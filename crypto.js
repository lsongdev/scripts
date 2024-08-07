import { base64ToArrayBuffer, arrayBufferToBase64 } from './crypto/base64.js';

// Key generation and management
export const generateKey = (algorithm, options = {}) => {
  const { extractable = true, keyUsages = ['sign', 'verify'] } = options;
  return crypto.subtle.generateKey(algorithm, extractable, keyUsages);
};

export const importKey = (key, algorithm, options = {}) => {
  const { extractable = true, keyUsages = ['sign', 'verify'] } = options;
  return crypto.subtle.importKey('raw', key, algorithm, extractable, keyUsages);
};

export const exportKey = async (key, format = 'raw') => {
  return crypto.subtle.exportKey(format, key);
};

export const exportKeyToBase64 = async (key, format = 'raw') => {
  const exportedKey = await exportKey(key, format);
  return arrayBufferToBase64(exportedKey);
};

export const exportKeyToPem = async (key, format = 'pkcs8') => {
  const base64Key = await exportKeyToBase64(key, format);
  const h = (a, b) => `-----${a} ${b ? 'PRIVATE' : 'PUBLIC'} KEY-----`;
  return [
    h('BEGIN', format == 'pkcs8'),
    base64Key.match(/.{1,64}/g).join('\n'),
    h('END', format == 'pkcs8'),
  ].join('\n');
};

// Encryption and decryption
export const encrypt = (key, data, algorithm = { name: 'RSA-OAEP', hash: 'SHA-256' }) =>
  crypto.subtle.encrypt(algorithm, key, data);

export const decrypt = (key, data, algorithm = { name: 'RSA-OAEP', hash: 'SHA-256' }) =>
  crypto.subtle.decrypt(algorithm, key, data);

export const encryptString = async (key, str, algorithm = { name: 'RSA-OAEP', hash: 'SHA-256' }) => {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  return encrypt(key, data, algorithm);
};

export const decryptString = async (key, data, algorithm = { name: 'RSA-OAEP', hash: 'SHA-256' }) => {
  const dec = new TextDecoder();
  const bytes = await decrypt(key, data, algorithm);
  return dec.decode(bytes);
};

// Hash functions
export const createHash = (algorithm, data) =>
  crypto.subtle.digest(algorithm, data).then(buffer => new Uint8Array(buffer));

export const createHmac = async (algorithm, key, data) => {
  const cryptoKey = await importKey(key, { name: 'HMAC', hash: algorithm });
  return crypto.subtle.sign('HMAC', cryptoKey, data);
};

// Specific hash functions
export const sha1 = data => createHash('SHA-1', data);
export const sha256 = data => createHash('SHA-256', data);
export const sha512 = data => createHash('SHA-512', data);
export const sha1hmac = (key, data) => createHmac('SHA-1', key, data);
export const sha256hmac = (key, data) => createHmac('SHA-256', key, data);
export const sha512hmac = (key, data) => createHmac('SHA-512', key, data);

// New function: deriveSharedKey
export const deriveSharedKey = async (privateKey, publicKey, derivedKeyAlgorithm = { name: 'AES-GCM', length: 256 }) => {
  // Perform the key derivation
  const sharedSecret = await crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: publicKey,
    },
    privateKey,
    derivedKeyAlgorithm.length,
  );
  return sharedSecret;
};

// Additional importKey functions
export const importKeyFromBase64 = async (base64Key, algorithm, options = {}) => {
  const { extractable = true, keyUsages = ['encrypt', 'decrypt'] } = options;
  const keyData = base64ToArrayBuffer(base64Key);
  return crypto.subtle.importKey('raw', keyData, algorithm, extractable, keyUsages);
};

export const importKeyFromPem = async (pemKey, algorithm, options = {}) => {
  const { extractable = true, keyUsages = ['encrypt', 'decrypt'] } = options;
  const base64Key = pemKey
    .replace(/-----BEGIN (.*) KEY-----/, '')
    .replace(/-----END (.*) KEY-----/, '')
    .replace(/\s/g, '');
  const keyData = base64ToArrayBuffer(base64Key);
  return crypto.subtle.importKey('pkcs8', keyData, algorithm, extractable, keyUsages);
};

// Signature functions
export const sign = async (key, data, algorithm = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }) => {
  return crypto.subtle.sign(algorithm, key, data);
};

export const verify = async (key, signature, data, algorithm = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }) => {
  return crypto.subtle.verify(algorithm, key, signature, data);
};

export const signString = async (key, str, algorithm = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }) => {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  return sign(key, data, algorithm);
};

export const verifyString = async (key, signature, str, algorithm = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }) => {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  return verify(key, signature, data, algorithm);
};

// Key generation functions
export const generateRSAKeyPair = async (modulusLength = 2048, options = {}) => {
  const { extractable = true, keyUsages = ['encrypt', 'decrypt', 'sign', 'verify'] } = options;
  return generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    { extractable, keyUsages }
  );
};

export const generateAESKey = async (length = 256, options = {}) => {
  const { extractable = true, keyUsages = ['encrypt', 'decrypt'] } = options;
  return generateKey(
    {
      name: 'AES-GCM',
      length,
    },
    { extractable, keyUsages }
  );
};

export const generateECDHKeyPair = async (namedCurve = 'P-256', options = {}) => {
  const { extractable = true, keyUsages = ['deriveKey', 'deriveBits'] } = options;
  return generateKey(
    {
      name: 'ECDH',
      namedCurve,
    },
    { extractable, keyUsages }
  );
};
