function bytes(value) {
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  throw new TypeError('value must be an ArrayBuffer or ArrayBufferView');
}

export function bytesToHex(value) {
  return [...bytes(value)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(text) {
  if (typeof text !== 'string') throw new TypeError('hex must be a string');
  if (text.length % 2 !== 0 || !/^[\da-f]*$/iu.test(text)) throw new SyntaxError('Invalid hexadecimal text');
  return Uint8Array.from({ length: text.length / 2 }, (_, index) =>
    Number.parseInt(text.slice(index * 2, index * 2 + 2), 16));
}
