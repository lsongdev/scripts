
export const leftpad = (str, width, char = '0') => {
  str = str.toString();
  while (str.length < width)
    str = char + str;
  return str;
};

export const append = (s0, s1) => {
  return s0 + s1;
};
