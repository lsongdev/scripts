
export const append = (s0, s1) => {
  return s0 + s1;
};

export const leftpad = (str, width, char = '0') => {
  str = '' + str;
  while (str.length < width)
    str = char + str;
  return str;
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
