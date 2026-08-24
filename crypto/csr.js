import { encodePEM } from './pem.js';

const SUBJECT_OIDS = Object.freeze({
  commonName: '2.5.4.3',
  organization: '2.5.4.10',
  organizationalUnit: '2.5.4.11',
  locality: '2.5.4.7',
  state: '2.5.4.8',
  country: '2.5.4.6',
  email: '1.2.840.113549.1.9.1',
});

const HASH_OIDS = Object.freeze({
  'SHA-256': '2.16.840.1.101.3.4.2.1',
  'SHA-384': '2.16.840.1.101.3.4.2.2',
  'SHA-512': '2.16.840.1.101.3.4.2.3',
});

const RSA_SIGNATURE_OIDS = Object.freeze({
  'SHA-256': '1.2.840.113549.1.1.11',
  'SHA-384': '1.2.840.113549.1.1.12',
  'SHA-512': '1.2.840.113549.1.1.13',
});

const ECDSA_SIGNATURE_OIDS = Object.freeze({
  'SHA-256': '1.2.840.10045.4.3.2',
  'SHA-384': '1.2.840.10045.4.3.3',
  'SHA-512': '1.2.840.10045.4.3.4',
});

const concat = (...parts) => {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
};

function lengthBytes(length) {
  if (length < 0x80) return Uint8Array.of(length);
  const bytes = [];
  for (let value = length; value > 0; value >>>= 8) bytes.unshift(value & 0xff);
  return Uint8Array.of(0x80 | bytes.length, ...bytes);
}

const der = (tag, content) => concat(Uint8Array.of(tag), lengthBytes(content.length), content);
const sequence = (...parts) => der(0x30, concat(...parts));
const set = (...parts) => der(0x31, concat(...parts));
const explicit = (number, content) => der(0xa0 + number, content);
const nullValue = () => der(0x05, new Uint8Array());

function base128(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('Invalid OID component');
  const bytes = [value & 0x7f];
  for (value = Math.floor(value / 128); value > 0; value = Math.floor(value / 128)) {
    bytes.unshift((value & 0x7f) | 0x80);
  }
  return bytes;
}

function objectIdentifier(value) {
  const parts = value.split('.').map(Number);
  if (parts.length < 2 || ![0, 1, 2].includes(parts[0])
    || (parts[0] < 2 && parts[1] > 39)) throw new TypeError(`Invalid OID: ${value}`);
  return der(0x06, Uint8Array.from([
    ...base128(parts[0] * 40 + parts[1]),
    ...parts.slice(2).flatMap(base128),
  ]));
}

function integer(value) {
  if (Number.isSafeInteger(value) && value >= 0) {
    const bytes = [];
    do {
      bytes.unshift(value & 0xff);
      value = Math.floor(value / 256);
    } while (value > 0);
    if (bytes[0] & 0x80) bytes.unshift(0);
    return der(0x02, Uint8Array.from(bytes));
  }
  let bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let offset = 0;
  while (offset < bytes.length - 1 && bytes[offset] === 0) offset += 1;
  bytes = bytes.slice(offset);
  if (bytes[0] & 0x80) bytes = concat(Uint8Array.of(0), bytes);
  return der(0x02, bytes);
}

const text = (tag, value) => der(tag, new TextEncoder().encode(value));

function subjectEntries(subject) {
  const entries = Array.isArray(subject)
    ? subject
    : Object.entries(subject).map(([name, value]) => ({ name, value }));
  if (entries.length === 0) throw new TypeError('subject must contain at least one attribute');
  return entries.map(entry => {
    const oid = entry.oid ?? SUBJECT_OIDS[entry.name];
    if (!oid || typeof entry.value !== 'string' || !entry.value) {
      throw new TypeError('Each subject attribute requires a known name or OID and non-empty string value');
    }
    let tag = 0x0c;
    if (entry.name === 'country') {
      if (!/^[A-Z]{2}$/u.test(entry.value)) throw new TypeError('country must be a two-letter uppercase code');
      tag = 0x13;
    } else if (entry.name === 'email') {
      if (!/^[\x20-\x7e]+$/u.test(entry.value)) throw new TypeError('email must contain IA5 characters');
      tag = 0x16;
    }
    return set(sequence(objectIdentifier(oid), text(tag, entry.value)));
  });
}

function normalizeHash(name) {
  const normalized = String(name).toUpperCase().replace(/^SHA(\d+)$/u, 'SHA-$1');
  if (!HASH_OIDS[normalized]) throw new TypeError(`Unsupported CSR hash: ${name}`);
  return normalized;
}

const algorithmIdentifier = (oid, parameters) =>
  sequence(objectIdentifier(oid), ...(parameters === undefined ? [] : [parameters]));

function signaturePlan(key, requestedHash, saltLength) {
  const name = key.algorithm.name;
  if (name === 'RSASSA-PKCS1-v1_5') {
    const hash = normalizeHash(requestedHash ?? key.algorithm.hash.name);
    return {
      webCrypto: name,
      identifier: algorithmIdentifier(RSA_SIGNATURE_OIDS[hash], nullValue()),
      encode: value => new Uint8Array(value),
    };
  }
  if (name === 'RSA-PSS') {
    const hash = normalizeHash(requestedHash ?? key.algorithm.hash.name);
    const length = saltLength ?? { 'SHA-256': 32, 'SHA-384': 48, 'SHA-512': 64 }[hash];
    const hashIdentifier = algorithmIdentifier(HASH_OIDS[hash], nullValue());
    const parameters = sequence(
      explicit(0, hashIdentifier),
      explicit(1, algorithmIdentifier('1.2.840.113549.1.1.8', hashIdentifier)),
      explicit(2, integer(length)),
    );
    return {
      webCrypto: { name, saltLength: length },
      identifier: algorithmIdentifier('1.2.840.113549.1.1.10', parameters),
      encode: value => new Uint8Array(value),
    };
  }
  if (name === 'ECDSA') {
    const defaultHash = { 'P-256': 'SHA-256', 'P-384': 'SHA-384', 'P-521': 'SHA-512' }[key.algorithm.namedCurve];
    const hash = normalizeHash(requestedHash ?? defaultHash);
    return {
      webCrypto: { name, hash },
      identifier: algorithmIdentifier(ECDSA_SIGNATURE_OIDS[hash]),
      encode(value) {
        const raw = new Uint8Array(value);
        if (raw.length % 2 !== 0) throw new TypeError('Web Crypto returned an invalid ECDSA signature');
        const half = raw.length / 2;
        return sequence(integer(raw.slice(0, half)), integer(raw.slice(half)));
      },
    };
  }
  if (name === 'Ed25519') {
    return {
      webCrypto: name,
      identifier: algorithmIdentifier('1.3.101.112'),
      encode: value => new Uint8Array(value),
    };
  }
  throw new TypeError(`Unsupported CSR key algorithm: ${name}`);
}

/** Create a DER-encoded PKCS#10 certification request. */
export async function createCSR(keyPair, subject, {
  hash,
  saltLength,
  crypto: cryptoImplementation = globalThis.crypto,
} = {}) {
  if (!keyPair?.publicKey || !keyPair?.privateKey) throw new TypeError('A CryptoKeyPair is required');
  if (!cryptoImplementation?.subtle) throw new ReferenceError('Web Crypto is required');
  const plan = signaturePlan(keyPair.privateKey, hash, saltLength);
  const spki = new Uint8Array(await cryptoImplementation.subtle.exportKey('spki', keyPair.publicKey));
  const requestInfo = sequence(
    integer(0),
    sequence(...subjectEntries(subject)),
    spki,
    explicit(0, new Uint8Array()),
  );
  const signature = plan.encode(await cryptoImplementation.subtle.sign(
    plan.webCrypto,
    keyPair.privateKey,
    requestInfo,
  ));
  const request = sequence(
    requestInfo,
    plan.identifier,
    der(0x03, concat(Uint8Array.of(0), signature)),
  );
  return request.buffer;
}

export async function createCSRPEM(keyPair, subject, options) {
  return encodePEM('CERTIFICATE REQUEST', await createCSR(keyPair, subject, options));
}
