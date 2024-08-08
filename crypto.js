import { base64ToArrayBuffer, arrayBufferToBase64 } from './crypto/base64.js';

// Key generation and management
export const generateKey = (algorithm, options = {}) => {
  const { extractable = true, keyUsages = ['sign', 'verify'] } = options;
  return crypto.subtle.generateKey(algorithm, extractable, keyUsages);
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

export const generateECDHKey = async (namedCurve = 'P-256', options = {}) => {
  const { extractable = true, keyUsages = ['deriveKey', 'deriveBits'] } = options;
  return generateKey(
    {
      name: 'ECDH',
      namedCurve,
    },
    { extractable, keyUsages }
  );
};

// New function: deriveSharedKey
export const deriveSharedKey = async (privateKey, publicKey, algorithm = { name: 'AES-GCM', length: 256 }) => {
  return crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: publicKey,
    },
    privateKey,
    algorithm.length,
  );
};

export const importKey = (key, algorithm, {
  format = 'raw',
  extractable = true,
  keyUsages = ['sign', 'verify'],
} = {}) => {
  return crypto.subtle.importKey(format, key, algorithm, extractable, keyUsages);
};

// Additional importKey functions
export const importKeyFromBase64 = async (base64Key, algorithm, options) => {
  const keyData = base64ToArrayBuffer(base64Key);
  return importKey(keyData, algorithm, options);
};

export const importKeyFromPem = async (pemKey, algorithm, options = {}) => {
  const base64Key = pemKey
    .replace(/-----BEGIN (.*) KEY-----/, '')
    .replace(/-----END (.*) KEY-----/, '')
    .replace(/\s/g, '');
  const keyData = base64ToArrayBuffer(base64Key);
  return importKey(keyData, algorithm, {
    format: 'pkcs8',
    ...options,
  });
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
  const p = format == 'pkcs8' ? 'PRIVATE' : 'PUBLIC';
  const h = a => `-----${a} ${p} KEY-----`;
  return [
    h('BEGIN'),
    base64Key.match(/.{1,64}/g).join('\n'),
    h('END'),
  ].join('\n');
};

// Encryption and decryption
export const encrypt = (key, data, algorithm = { name: 'RSA-OAEP', hash: 'SHA-256' }) =>
  crypto.subtle.encrypt(algorithm, key, data).then(buffer => new Uint8Array(buffer));

export const decrypt = (key, data, algorithm = { name: 'RSA-OAEP', hash: 'SHA-256' }) =>
  crypto.subtle.decrypt(algorithm, key, data).then(buffer => new Uint8Array(buffer));

// Hash functions
export const digest = (algorithm, data) => {
  return crypto.subtle.digest(algorithm, data).then(buffer => new Uint8Array(buffer));
}

// Signature functions
export const sign = async (key, data, algorithm = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }) => {
  return crypto.subtle.sign(algorithm, key, data).then(buffer => new Uint8Array(buffer));
};

export const verify = async (key, signature, data, algorithm = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }) => {
  return crypto.subtle.verify(algorithm, key, signature, data);
};

export const createHmac = async (hash, key, data) => {
  if (typeof data === 'string')
    data = new TextEncoder().encode(data);
  return sign(key, data, { name: 'HMAC', hash });
}

export const createHash = async (algorithm, data) => {
  if (typeof data === 'string')
    data = new TextEncoder().encode(data);
  return digest(algorithm, data);
};

// Specific hash functions
export const sha1 = data => createHash('SHA-1', data);
export const sha256 = data => createHash('SHA-256', data);
export const sha512 = data => createHash('SHA-512', data);
export const sha1hmac = (key, data) => createHmac('SHA-1', key, data);
export const sha256hmac = (key, data) => createHmac('SHA-256', key, data);
export const sha512hmac = (key, data) => createHmac('SHA-512', key, data);
