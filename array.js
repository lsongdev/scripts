
export const flatten = arr =>
  arr.reduce((flat, toFlatten) =>
    flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten)
    , []);

export const reduce = (arr, fn, initial = 0) => {
  let accumulator = initial;
  for (const index in arr) {
    const current = arr[index];
    accumulator = fn(accumulator, current, index, arr);
  }
  return accumulator;
};
