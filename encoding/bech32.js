const alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const alphabetMap = new Map([...alphabet].map((character, index) => [character, index]));
const constants = Object.freeze({ bech32: 1, bech32m: 0x2bc830a3 });
const generators = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values) {
  let checksum = 1;
  for (const value of values) {
    const high = checksum >>> 25;
    checksum = ((checksum & 0x1ffffff) << 5 ^ value) >>> 0;
    for (let index = 0; index < 5; index += 1) {
      if ((high >>> index) & 1) checksum = (checksum ^ generators[index]) >>> 0;
    }
  }
  return checksum >>> 0;
}

function expandPrefix(prefix) {
  return [
    ...[...prefix].map(character => character.charCodeAt(0) >>> 5),
    0,
    ...[...prefix].map(character => character.charCodeAt(0) & 31),
  ];
}

function validatePrefix(prefix) {
  if (!prefix.length) throw new SyntaxError('Bech32 prefix must not be empty');
  if ([...prefix].some(character => {
    const code = character.charCodeAt(0);
    return code < 33 || code > 126;
  })) throw new SyntaxError('Bech32 prefix must contain printable ASCII only');
  if (prefix !== prefix.toLowerCase() && prefix !== prefix.toUpperCase()) {
    throw new SyntaxError('Bech32 prefix must not mix case');
  }
}

function checksum(prefix, words, encoding) {
  const value = polymod([...expandPrefix(prefix), ...words, 0, 0, 0, 0, 0, 0])
    ^ constants[encoding];
  return Array.from({ length: 6 }, (_, index) => value >>> (5 * (5 - index)) & 31);
}

/** Encode 5-bit words using BIP-173 Bech32 or BIP-350 Bech32m. */
export function encode(prefix, words, {
  encoding = 'bech32',
  limit = 90,
} = {}) {
  if (!Object.hasOwn(constants, encoding)) throw new TypeError(`Unknown encoding: ${encoding}`);
  validatePrefix(prefix);
  const values = [...words];
  if (values.some(word => !Number.isInteger(word) || word < 0 || word > 31)) {
    throw new RangeError('Bech32 words must be integers from 0 through 31');
  }
  const normalized = prefix.toLowerCase();
  const output = normalized + '1' + [...values, ...checksum(normalized, values, encoding)]
    .map(word => alphabet[word]).join('');
  if (output.length > limit) throw new RangeError(`Bech32 value exceeds ${limit} characters`);
  return output;
}

/** Decode and identify a BIP-173 Bech32 or BIP-350 Bech32m string. */
export function decode(value, { limit = 90 } = {}) {
  if (typeof value !== 'string') throw new TypeError('Bech32 value must be a string');
  if (value.length > limit) throw new RangeError(`Bech32 value exceeds ${limit} characters`);
  if (value !== value.toLowerCase() && value !== value.toUpperCase()) {
    throw new SyntaxError('Bech32 value must not mix case');
  }
  const normalized = value.toLowerCase();
  const separator = normalized.lastIndexOf('1');
  if (separator <= 0) throw new SyntaxError('Bech32 separator or prefix is missing');
  if (separator + 7 > normalized.length) throw new SyntaxError('Bech32 checksum is too short');
  const prefix = normalized.slice(0, separator);
  validatePrefix(prefix);
  const encoded = normalized.slice(separator + 1);
  const values = [...encoded].map(character => {
    const word = alphabetMap.get(character);
    if (word === undefined) throw new SyntaxError(`Invalid Bech32 character: ${character}`);
    return word;
  });
  const result = polymod([...expandPrefix(prefix), ...values]);
  const encoding = Object.entries(constants).find(([, constant]) => result === constant)?.[0];
  if (!encoding) throw new SyntaxError('Invalid Bech32 checksum');
  return Object.freeze({
    encoding,
    prefix,
    words: Uint8Array.from(values.slice(0, -6)),
  });
}

/** Convert packed values between bit widths with strict padding checks. */
export function convertBits(data, fromBits, toBits, { pad = true } = {}) {
  if (!Number.isInteger(fromBits) || fromBits < 1 || fromBits > 8
    || !Number.isInteger(toBits) || toBits < 1 || toBits > 8) {
    throw new RangeError('Bit widths must be integers from 1 through 8');
  }
  let accumulator = 0;
  let bits = 0;
  const output = [];
  const outputMask = (1 << toBits) - 1;
  const inputLimit = 1 << fromBits;
  const accumulatorMask = (1 << (fromBits + toBits - 1)) - 1;
  for (const value of data) {
    if (!Number.isInteger(value) || value < 0 || value >= inputLimit) {
      throw new RangeError(`Input values must fit in ${fromBits} bits`);
    }
    accumulator = (accumulator << fromBits | value) & accumulatorMask;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      output.push(accumulator >>> bits & outputMask);
    }
  }
  if (pad && bits) output.push(accumulator << (toBits - bits) & outputMask);
  if (!pad && (bits >= fromBits || accumulator << (toBits - bits) & outputMask)) {
    throw new SyntaxError('Invalid Bech32 bit padding');
  }
  return Uint8Array.from(output);
}

export const bytesToBech32Words = value => convertBits(value, 8, 5);
export const bech32WordsToBytes = value => convertBits(value, 5, 8, { pad: false });
