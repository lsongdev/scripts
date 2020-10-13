
export const append = (s0, s1) => {
  return s0 + s1;
};

export const leftpad = (str, width, char = '0') => {
  str = str.toString();
  while (str.length < width)
    str = char + str;
  return str;
};

export const uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });

export const format = (template, data = {}) => {
  const ks = Object.keys(data);
  const vs = ks.map((k) => data[k]);
  const t = `return \`${template}\``;
  const f = new Function(...ks, t);
  return f(...vs);
};
