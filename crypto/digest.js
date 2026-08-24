function toBytes(value) {
  return typeof value === 'string' ? new TextEncoder().encode(value) : value;
}

/** Digest bytes or UTF-8 text and return the standard ArrayBuffer result. */
export function digest(algorithm, value, {
  crypto: target = globalThis.crypto,
} = {}) {
  if (!target?.subtle) throw new ReferenceError('Web Crypto is required');
  return target.subtle.digest(algorithm, toBytes(value));
}

export const sha256 = (value, options) => digest('SHA-256', value, options);
export const sha384 = (value, options) => digest('SHA-384', value, options);
export const sha512 = (value, options) => digest('SHA-512', value, options);

/** Sign bytes or UTF-8 text with HMAC and return an ArrayBuffer. */
export async function hmac(hash, key, value, {
  crypto: target = globalThis.crypto,
} = {}) {
  if (!target?.subtle) throw new ReferenceError('Web Crypto is required');
  const algorithm = { name: 'HMAC', hash };
  const cryptoKey = key instanceof ArrayBuffer || ArrayBuffer.isView(key)
    ? await target.subtle.importKey('raw', key, algorithm, false, ['sign'])
    : key;
  return target.subtle.sign(algorithm, cryptoKey, toBytes(value));
}
