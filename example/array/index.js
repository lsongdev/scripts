// import { sort } from '../../array.js';

const arr = [1, 3, 4, 5, 7, 9, 3, 5, 7];

// console.log('arr:', arr);

// const a1 = bubbleSort(arr);
// console.log('bubbleSort:', a1);


// const a2 = selectionSort(arr);
// console.log('selectionSort:', a2);


const flatten = arr =>
  arr.reduce((flat, toFlatten) =>
    flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten)
    , []);

const uniq = arr => {
  const a = arr.map(x => x.sort().toString());
  return arr.filter((x, i) => a.indexOf(x.toString()) === i);
}

const memoize = (fn, resolver) => {
  const cache = {};
  return (...args) => {
    const key = resolver ? resolver.apply(this, args) : args[0];
    if (key in cache) return cache[key];
    return cache[key] = fn(...args);
  }
};

const F = memoize(function f(n) {
  var results = [];
  if (n <= 1) return [n];
  for (var i = 0; i < n; i++) {
    const j = n - i;
    const k = n - j;
    const arr = F(k);
    arr.forEach(t =>
      results.push(flatten([j, t]).filter(Boolean))
    );
  }
  return uniq(results);
});

const output = F(5);
console.log(output);
