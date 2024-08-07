export * as md5 from './crypto/md5.js';

export async function generateKey(algorithm, options = {}) {
  const {
    extractable = true,
    keyUsages = ['sign', 'verify'],
  } = options;
  return crypto.subtle.generateKey(algorithm, extractable, keyUsages);
};

export async function importKey(key, algorithm, options = {}) {
  const {
    extractable = true,
    keyUsages = ['sign', 'verify'],
  } = options;
  return crypto.subtle.importKey('raw', key, algorithm, extractable, keyUsages);
};

export async function encrypt(key, data) {
  return crypto.subtle.encrypt({ name: 'RSA-OAEP', hash: 'SHA-256' }, key, data);
}

export async function decrypt(key, data) {
  return crypto.subtle.decrypt({ name: 'RSA-OAEP', hash: 'SHA-256' }, key, data);
}

export async function encryptString(key, str) {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  return encrypt(key, data);
};

export async function decryptString(key, data) {
  const dec = new TextDecoder();
  const bytes = await decrypt(key, data);
  return dec.decode(bytes);
}

// Utility function to generate a hash
export async function createHash(algorithm, data) {
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  return new Uint8Array(hashBuffer);
}

// Function to generate HMAC signature
export async function createHmac(algorithm, key, data) {
  const cryptoKey = await importKey(key, algorithm);
  return crypto.subtle.sign('HMAC', cryptoKey, data);
}

// Specific SHA hash functions
export const sha1 = data => createHash('SHA-1', data);
export const sha256 = data => createHash('SHA-256', data);
export const sha512 = data => createHash('SHA-512', data);
export const sha1hmac = (key, data) => createHmac('SHA-1', key, data);
export const sha256hmac = (key, data) => createHmac('SHA-256', key, data);
export const sha512hmac = (key, data) => createHmac('SHA-512', key, data);

