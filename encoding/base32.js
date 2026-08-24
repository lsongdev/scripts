const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Encode bytes as padded RFC 4648 base32. */
export function encode(value) {
  const input = value instanceof Uint8Array ? value : new Uint8Array(value);
  let output = '';
  let bits = 0;
  let buffer = 0;

  for (const byte of input) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(buffer >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += ALPHABET[(buffer << (5 - bits)) & 31];
  return output.padEnd(Math.ceil(output.length / 8) * 8, '=');
}

/** Decode padded or unpadded RFC 4648 base32 into bytes. */
export function decode(value) {
  if (typeof value !== 'string') throw new TypeError('Expected a base32 string');
  const match = /^([A-Z2-7]*)(=*)$/iu.exec(value);
  if (!match) throw new SyntaxError('Invalid base32 input');
  const input = match[1].toUpperCase();
  const padding = match[2].length;
  const remainder = input.length % 8;
  if (![0, 2, 4, 5, 7].includes(remainder)) {
    throw new SyntaxError('Invalid base32 length');
  }
  const expectedPadding = (8 - remainder) % 8;
  if (padding && (value.length % 8 !== 0 || padding !== expectedPadding)) {
    throw new SyntaxError('Invalid base32 padding');
  }
  const output = [];
  let bits = 0;
  let buffer = 0;

  for (const character of input) {
    const index = ALPHABET.indexOf(character);
    if (index === -1) throw new SyntaxError(`Invalid base32 character: ${character}`);
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  if (bits > 0 && (buffer & ((1 << bits) - 1)) !== 0) {
    throw new SyntaxError('Non-zero base32 padding bits');
  }
  return Uint8Array.from(output);
}
