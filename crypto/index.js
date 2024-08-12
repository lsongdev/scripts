import { createCSR } from './csr.js';
import { base64ToArrayBuffer, arrayBufferToBase64 } from './base64.js';

export const generateCSR = async (keyPair, info) => {
  const csr = await createCSR(keyPair, info);
  return toPem('CERTIFICATE REQUEST', csr);
};

// Key generation and management
export const generateKey = (algorithm, {
  extractable = true,
  keyUsages = ['sign', 'verify'],
} = {}) => crypto.subtle.generateKey(algorithm, extractable, keyUsages);

export const generateAESKey = async (length = 256, {
  extractable = true,
  keyUsages = ['encrypt', 'decrypt'],
} = {}) => generateKey({
  name: 'AES-GCM',
  length,
}, { extractable, keyUsages });

export const generateECDHKey = async (namedCurve = 'P-256', {
  extractable = true,
  keyUsages = ['deriveKey', 'deriveBits'],
} = {}) => generateKey({
  name: 'ECDH',
  namedCurve,
}, { extractable, keyUsages });

export const generateRSAKey = async ({
  name = 'RSASSA-PKCS1-v1_5',
  modulusLength = 2048,
  publicExponent = new Uint8Array([1, 0, 1]),
  hash = 'SHA-256',
  extractable = true,
  keyUsages = ['sign', 'verify'],
} = {}) => {
  if (name === 'RSA-OAEP') keyUsages = keyUsages || ['encrypt', 'decrypt'];
  const algorithm = { name, modulusLength, publicExponent, hash };
  return generateKey(algorithm, { keyUsages, extractable });
};

export async function generateRsaKeyPairAsPem() {
  const keyPair = await generateRSAKey();
  return exportKeyPairToPem(keyPair, algorithm);
};

// New function: deriveSharedKey
export const deriveSharedKey = async (privateKey, publicKey, algorithm = { name: 'AES-GCM', length: 256 }) =>
  crypto.subtle.deriveKey({
    name: 'ECDH',
    public: publicKey,
  },
    privateKey,
    algorithm.length,
  );

export const importKey = (key, algorithm, {
  format = 'raw',
  extractable = true,
  keyUsages = ['sign', 'verify'],
} = {}) => crypto.subtle.importKey(format, key, algorithm, extractable, keyUsages);

export const exportKey = async (key, format = 'raw') =>
  crypto.subtle.exportKey(format, key);


// Additional importKey functions
export const importKeyFromBase64 = async (base64Key, algorithm, options) => {
  const keyData = base64ToArrayBuffer(base64Key);
  return importKey(keyData, algorithm, options);
};

export const exportKeyToBase64 = async (key, format = 'raw') => {
  const exportedKey = await exportKey(key, format);
  return arrayBufferToBase64(exportedKey);
};

export const importKeyFromJwkString = (jwkString, algorithm, options) => {
  const jwk = JSON.parse(jwkString);
  return importKey(jwk, algorithm, {
    format: 'jwk',
    ...options,
  });
};

export async function exportPublicKeyToJwk(publicKey) {
  const jwk = await exportKey(publicKey, "jwk");
  // fields in lexicographic order
  return {
    e: jwk.e,
    kty: jwk.kty,
    n: jwk.n,
  };
};

export const toPem = (type, data) => {
  return [
    `-----BEGIN ${type}-----`,
    arrayBufferToBase64(data).replace(/(.{64})/g, '$1\n'),
    `-----END ${type}-----`,
  ].join('\n');
};

export const parsePem = pem => {
  const lines = pem.split('\n');
  const header = lines[0];
  const type = header.match(/-----BEGIN (.*)-----/)[1];
  const base64 = lines.slice(1, -1).join('');
  const data = base64ToArrayBuffer(base64);
  return { type, data };
};

export const importKeyFromPem = async (pemKey, algorithm, options = {}) => {
  const { type, data } = parsePem(pemKey);
  const isPublic = type === 'PUBLIC KEY';
  const format = isPublic ? 'spki' : 'pkcs8';
  return importKey(data, algorithm, {
    format,
    keyUsages: isPublic ? ['verify'] : ['sign'],
    ...options,
  });
};

export const importKeyPairFromPem = async (pemKeyPair, algorithm, options) => {
  const publicKey = await importKeyFromPem(pemKeyPair.publicKey, algorithm, options);
  const privateKey = await importKeyFromPem(pemKeyPair.privateKey, algorithm, options);
  return {
    publicKey,
    privateKey,
  };
};

export const exportKeyToPem = async (key, format = 'pkcs8') => {
  const exportedKey = await exportKey(key, format);
  const type = format == 'pkcs8' ? 'PRIVATE KEY' : 'PUBLIC KEY';
  return toPem(type, exportedKey);
};

export const exportKeyPairToPem = async keyPair => {
  return {
    publicKey: await exportKeyToPem(keyPair.publicKey, 'spki'),
    privateKey: await exportKeyToPem(keyPair.privateKey, 'pkcs8'),
  };
};


// Encryption and decryption
export const encrypt = (key, data, algorithm = key.algorithm) =>
  crypto.subtle.encrypt(algorithm, key, data).then(buffer => new Uint8Array(buffer));

export const decrypt = (key, data, algorithm = key.algorithm) =>
  crypto.subtle.decrypt(algorithm, key, data).then(buffer => new Uint8Array(buffer));

// Hash functions
export const digest = async (data, algorithm = 'SHA-256') =>
  crypto.subtle.digest(algorithm, data).then(buffer => new Uint8Array(buffer));

// Signature functions
export const sign = async (key, data, algorithm = key.algorithm) => {
  return crypto.subtle.sign(algorithm, key, data).then(buffer => new Uint8Array(buffer));
};

export const verify = async (key, signature, data, algorithm = key.algorithm) => {
  return crypto.subtle.verify(algorithm, key, signature, data);
};

export const createHmac = async (hash, key, data) => {
  const algorithm = { name: 'HMAC', hash };
  if (!(key instanceof CryptoKey))
    key = await importKey(key, algorithm);
  if (typeof data === 'string')
    data = new TextEncoder().encode(data);
  return sign(key, data, algorithm);
}

export const createHash = async (algorithm, data) => {
  if (typeof data === 'string')
    data = new TextEncoder().encode(data);
  return digest(data, algorithm);
};

// Specific hash functions
export const sha1 = data => createHash('SHA-1', data);
export const sha256 = data => createHash('SHA-256', data);
export const sha512 = data => createHash('SHA-512', data);
export const sha1hmac = (key, data) => createHmac('SHA-1', key, data);
export const sha256hmac = (key, data) => createHmac('SHA-256', key, data);
export const sha512hmac = (key, data) => createHmac('SHA-512', key, data);
