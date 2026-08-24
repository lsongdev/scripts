
// Encryption and decryption
export const encrypt = (key, data, algorithm = key.algorithm) =>
  crypto.subtle.encrypt(algorithm, key, data).then(buffer => new Uint8Array(buffer));

export const decrypt = (key, data, algorithm = key.algorithm) =>
  crypto.subtle.decrypt(algorithm, key, data).then(buffer => new Uint8Array(buffer));

const toBytes = value => typeof value === 'string'
  ? new TextEncoder().encode(value)
  : value;

// Hash functions
export const digest = (algorithm, data) =>
  crypto.subtle.digest(algorithm, toBytes(data));

// Signature functions
export const sign = async (key, data, algorithm = key.algorithm) => {
  return crypto.subtle.sign(algorithm, key, data).then(buffer => new Uint8Array(buffer));
};

export const verify = async (key, signature, data, algorithm = key.algorithm) => {
  return crypto.subtle.verify(algorithm, key, signature, data);
};

export const importKey = (key, algorithm, {
  format = 'raw',
  extractable = true,
  keyUsages = ['sign', 'verify'],
} = {}) => crypto.subtle.importKey(format, key, algorithm, extractable, keyUsages);

export const exportKey = async (key, format = 'raw') =>
  crypto.subtle.exportKey(format, key);

export const hmac = async (hash, key, data) => {
  const algorithm = { name: 'HMAC', hash };
  if (key instanceof ArrayBuffer || ArrayBuffer.isView(key))
    key = await importKey(key, algorithm, { extractable: false, keyUsages: ['sign'] });
  return crypto.subtle.sign(algorithm, key, toBytes(data));
};

export const hash = async (algorithm, data) => {
  return digest(algorithm, data);
};

// Specific hash functions
export const sha1 = data => hash('SHA-1', data);
export const sha256 = data => hash('SHA-256', data);
export const sha512 = data => hash('SHA-512', data);
export const sha1hmac = (key, data) => hmac('SHA-1', key, data);
export const sha256hmac = (key, data) => hmac('SHA-256', key, data);
export const sha512hmac = (key, data) => hmac('SHA-512', key, data);
