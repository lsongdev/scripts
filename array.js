import { random } from './math.js';

export const isArray = obj => {
  return !!obj.length;
};

export const toArray = obj => {
  return [].slice.call(obj);
};

export const keys = arr => {
  return Object.keys(toArray(arr));
};

export const each = (arr, cb) => {
  for (const i of keys(arr)) {
    typeof cb === 'function' && cb(arr[i], i, arr);
  }
};

export const map = (arr, cb) => {
  const results = [];
  each(arr, (item, i, arr) => {
    results.push(typeof cb === 'function' ? cb(item, i, arr) : item);
  });
  return results;
};

export const filter = (arr, fn) => {
  const results = [];
  each(arr, (item, i, arr) => {
    if (fn ? fn(item, i, arr) : true) results.push(item);
  });
  return results;
};

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

export const uniq = arr =>
  arr.filter((x, i, arr) => arr.indexOf(x) === i);

export const shuffle = arr =>
  arr.sort(() => random() - .5);

export const sample = (arr, k) =>
  shuffle(arr).slice(0, k);

export const bubblesort = (arr, comparator = (a, b) => a - b) => {
  var temp;
  for (var i = 0, l = arr.length; i < l; i++) {
    for (var j = i; j > 0; j--) {
      if (comparator(arr[j], arr[j - 1]) < 0) {
        temp = arr[j];
        arr[j] = arr[j - 1];
        arr[j - 1] = temp;
      }
    }
  }
  return arr;
};
