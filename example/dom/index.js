import { query } from '../../query.js';
import { flatten, reduce } from '../../array.js';
import { get, keys, values } from '../../object.js';

const arr = [
  1, 2, 3, 4, [5, 6, 7, [8, 9, 0]], 11
];

console.log(reduce(flatten(arr), (a, b) => a + b, 5));

const obj = {
  a: 1,
  b: 2,
  c: {
    d: 3,
    e: {
      f: 4
    }
  }
};

console.log(get(obj, 'c.e.f'));
