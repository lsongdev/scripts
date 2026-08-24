import assert from 'node:assert/strict';
import test from 'node:test';

import { debounce } from '../async/debounce.js';
import { delay } from '../async/delay.js';

test('delay resolves and validates its duration', async () => {
  await delay(0);
  assert.throws(() => delay(-1), RangeError);
  assert.throws(() => delay(Number.NaN), RangeError);
});

test('delay rejects with the AbortSignal reason', async () => {
  const controller = new AbortController();
  const reason = new Error('stop');
  const pending = delay(1000, { signal: controller.signal });
  controller.abort(reason);
  await assert.rejects(pending, error => error === reason);
});

test('debounce keeps the latest call and preserves this', async () => {
  const calls = [];
  const receiver = {
    value: 7,
    run: debounce(function (value) {
      calls.push([this.value, value]);
    }, 10),
  };

  receiver.run(1);
  receiver.run(2);
  assert.equal(receiver.run.pending, true);
  await delay(20);
  assert.deepEqual(calls, [[7, 2]]);
  assert.equal(receiver.run.pending, false);
});

test('debounce can flush, clear, and abort', async () => {
  const values = [];
  const controller = new AbortController();
  const run = debounce(value => values.push(value), 100, {
    signal: controller.signal,
  });

  run('flush');
  assert.equal(run.flush(), 1);
  assert.deepEqual(values, ['flush']);

  run('clear');
  run.clear();
  await delay(0);
  assert.deepEqual(values, ['flush']);

  run('abort');
  controller.abort();
  assert.equal(run.pending, false);
  assert.throws(() => run('again'), error => error === controller.signal.reason);
});
