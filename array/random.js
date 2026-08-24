function randomIndex(limit, random) {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('random must return a finite number in [0, 1)');
  }
  return Math.floor(value * limit);
}

/** Return a Fisher-Yates shuffled copy without mutating the source iterable. */
export function shuffled(values, { random = Math.random } = {}) {
  if (typeof random !== 'function') throw new TypeError('random must be a function');
  const result = Array.from(values);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = randomIndex(index + 1, random);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

/** Select count distinct values without replacement or source mutation. */
export function sample(values, count = 1, options) {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError('count must be a non-negative safe integer');
  }
  const items = Array.from(values);
  if (count > items.length) throw new RangeError('count exceeds the number of values');
  return shuffled(items, options).slice(0, count);
}
