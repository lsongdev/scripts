function subtle(target) {
  if (!target?.subtle) throw new ReferenceError('Web Crypto is required');
  return target.subtle;
}

/** Generate a standard AES-GCM CryptoKey. */
export function generateAESKey({
  length = 256,
  extractable = false,
  usages = ['encrypt', 'decrypt'],
  crypto: target = globalThis.crypto,
} = {}) {
  return subtle(target).generateKey(
    { name: 'AES-GCM', length },
    extractable,
    usages,
  );
}

/** Generate a standard ECDH CryptoKeyPair. */
export function generateECDHKeyPair({
  namedCurve = 'P-256',
  extractable = false,
  usages = ['deriveKey', 'deriveBits'],
  crypto: target = globalThis.crypto,
} = {}) {
  return subtle(target).generateKey(
    { name: 'ECDH', namedCurve },
    extractable,
    usages,
  );
}

/** Generate a standard RSA CryptoKeyPair for signing or encryption. */
export function generateRSAKeyPair({
  name = 'RSA-PSS',
  modulusLength = 3072,
  publicExponent = new Uint8Array([1, 0, 1]),
  hash = 'SHA-256',
  extractable = false,
  usages = name === 'RSA-OAEP' ? ['encrypt', 'decrypt'] : ['sign', 'verify'],
  crypto: target = globalThis.crypto,
} = {}) {
  return subtle(target).generateKey(
    { name, modulusLength, publicExponent, hash },
    extractable,
    usages,
  );
}

/** Derive a standard CryptoKey from an ECDH private/public key pair. */
export function deriveECDHKey(privateKey, publicKey, derivedKeyType, {
  extractable = false,
  usages = ['encrypt', 'decrypt'],
  crypto: target = globalThis.crypto,
} = {}) {
  return subtle(target).deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    derivedKeyType,
    extractable,
    usages,
  );
}
