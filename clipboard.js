
export const read = () => {
  return navigator.clipboard.read();
}

export const readText = () => {
  return navigator.clipboard.readText();
};

export const write = data => {
  return navigator.clipboard.write(data);
};

export const writeText = text => {
  return navigator.clipboard.writeText(text);
};
