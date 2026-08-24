import { decode, encode } from '../encoding/base64.js';

/** Encode binary DER data as a PEM block. */
export function encodePEM(label, value) {
  const base64 = encode(value);
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

/** Decode one strict PEM block into its label and DER bytes. */
export function decodePEM(value) {
  if (typeof value !== 'string') throw new TypeError('Expected a PEM string');
  const match = /^-----BEGIN ([A-Z0-9 ]+)-----\s+([A-Za-z0-9+/=\s]+?)\s+-----END \1-----$/u
    .exec(value.trim());
  if (!match) throw new SyntaxError('Invalid PEM block');
  return {
    label: match[1],
    bytes: decode(match[2].replace(/\s/g, '')),
  };
}

/** Export a CryptoKey as a PUBLIC KEY or PRIVATE KEY PEM block. */
export async function exportKeyPEM(key, {
  crypto: target = globalThis.crypto,
} = {}) {
  if (!target?.subtle) throw new ReferenceError('Web Crypto is required');
  const format = key.type === 'public' ? 'spki' : 'pkcs8';
  const label = key.type === 'public' ? 'PUBLIC KEY' : 'PRIVATE KEY';
  return encodePEM(label, await target.subtle.exportKey(format, key));
}

/** Import a PUBLIC KEY or PRIVATE KEY PEM block as a standard CryptoKey. */
export function importKeyPEM(value, algorithm, {
  extractable = false,
  usages,
  crypto: target = globalThis.crypto,
} = {}) {
  if (!target?.subtle) throw new ReferenceError('Web Crypto is required');
  const { label, bytes } = decodePEM(value);
  const isPublic = label === 'PUBLIC KEY';
  if (!isPublic && label !== 'PRIVATE KEY') {
    throw new SyntaxError(`Unsupported PEM label: ${label}`);
  }
  return target.subtle.importKey(
    isPublic ? 'spki' : 'pkcs8',
    bytes,
    algorithm,
    extractable,
    usages ?? (isPublic ? ['verify'] : ['sign']),
  );
}
