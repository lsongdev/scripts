
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