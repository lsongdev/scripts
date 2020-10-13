
export const isArray = arr => Array.isArray(arr);

export const reduce = (arr, fn, initial = 0) => {
  let accumulator = initial;
  for (const index in arr) {
    const current = arr[index];
    accumulator = fn(accumulator, current, index, arr);
  }
  return accumulator;
};

export const flatten = arr =>
  reduce(arr, (flat, toFlatten) =>
    flat.concat(isArray(toFlatten) ? flatten(toFlatten) : toFlatten)
    , []);

export const findIndex = (arr, fn) => {
  for (const index in arr) {
    if (fn(arr[index], index, arr)) return index;
  }
  return -1;
};

export const find = (arr, fn) => {
  const index = findIndex(arr, fn);
  return arr[index];
};

export const filter = (arr, fn) => {
  const out = [];
  for (const index in arr) {
    if (fn(arr[index], index, arr)) out.push(arr[index]);
  }
  return out;
};
