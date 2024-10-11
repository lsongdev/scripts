
export const append = (s0, s1) => {
  return s0 + s1;
};

export const leftpad = (str, width, char = '0') => {
  str = '' + str;
  while (str.length < width)
    str = char + str;
  return str;
};

export const addZero = (s, n) => {
  return leftpad(s, n, '0');
};

export const format = (template, data = {}) => {
  const ks = Object.keys(data);
  const vs = ks.map((k) => data[k]);
  const t = `return \`${template}\``;
  const f = new Function(...ks, t);
  return f(...vs);
};

export const trim = str => {
  return (str || '').toString().trim();
};

export function sprintf(format, ...args) {
  let i = 0;
  return format.replace(/%[sd]/g, match => {
    let arg = args[i++];
    if (match === '%d') {
      return parseInt(arg, 10);
    } else if (match === '%s') {
      return String(arg);
    }
    return match;
  });
}

export const hex = uint8array =>
  uint8array.reduce((a, b) => a + b.toString(16).padStart(2, '0'), '');

// export function toHexString(byteArray) {
//   return Array.from(byteArray, function(byte) {
//     return ('0' + (byte & 0xFF).toString(16)).slice(-2);
//   }).join('')
// }


/**
 * Gives the length of a string in Unicode code points
 *
 * ```
 * codePointLength("🐱"); // 1
 * "🐱".length; // 2
 * ```
 */
export function codePointLength(s) {
  return Array.from(s).length;
}
