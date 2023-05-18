
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32decode(base32) {
  let bits = '';
  let result = new Uint8Array(Math.ceil(base32.length * 5 / 8));

  for (let i = 0; i < base32.length; i++) {
    let value = alphabet.indexOf(base32[i].toUpperCase());
    bits += value.toString(2).padStart(5, '0');
  }

  for (let i = 0; i < result.length; i++) {
    result[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  return result;
}

export function base32encode(buffer) {
  const pad = '=';
  let result = '';
  let bits = 0;
  let value = 0;
  let padCount = 0;

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
    padCount = (result.length % 8) ? 8 - (result.length % 8) : 0;
  }

  for (let i = 0; i < padCount; i++) {
    result += pad;
  }

  return result;
}

// // Example usage:
// // Convert a string to a Uint8Array
// function stringToUint8Array(str) {
//   const arr = [];
//   for (let i = 0; i < str.length; i++) {
//     arr.push(str.charCodeAt(i));
//   }
//   return new Uint8Array(arr);
// }

// // Encode a string as base32
// const data = stringToUint8Array('Hello World');
// const encoded = base32encode(data);
// console.log(encoded); // Output: JBSWY3DPEBLW64TMMQQQ====
