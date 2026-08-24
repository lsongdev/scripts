/** Execute task functions sequentially and return their ordered results. */
export async function runSerial(tasks, { signal } = {}) {
  const results = [];
  let index = 0;
  for (const task of tasks) {
    if (typeof task !== 'function') throw new TypeError(`task at index ${index} must be a function`);
    signal?.throwIfAborted();
    results.push(await task({ index, signal }));
    index += 1;
  }
  return results;
}
