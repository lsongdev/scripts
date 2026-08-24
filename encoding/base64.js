function bytes(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  throw new TypeError('Expected an ArrayBuffer or ArrayBufferView');
}

/** Encode bytes as RFC 4648 base64. */
export function bytesToBase64(value) {
  const input = bytes(value);
  let binary = '';
  const size = 0x8000;
  for (let offset = 0; offset < input.length; offset += size) {
    binary += String.fromCharCode(...input.subarray(offset, offset + size));
  }
  return btoa(binary);
}

/** Decode RFC 4648 base64 into bytes. */
export function base64ToBytes(value) {
  if (typeof value !== 'string') throw new TypeError('Expected a base64 string');
  const binary = atob(value);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

/** Encode bytes as unpadded base64url. */
export function bytesToBase64URL(value) {
  return bytesToBase64(value)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

/** Decode padded or unpadded base64url into bytes. */
export function base64URLToBytes(value) {
  if (typeof value !== 'string') throw new TypeError('Expected a base64url string');
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  return base64ToBytes(base64 + padding);
}
