

export const keys = obj => {
  const keys = [];
  for (const key in obj) {
    keys.push(key);
  }
  return keys;
};

export const values = obj => {
  const values = [];
  for(const key in obj) {
    values.push(obj[key]);
  }
  return values;
};

export const get = (obj, path) =>
  path.split('.').reduce((o, k) => o[k], obj);
