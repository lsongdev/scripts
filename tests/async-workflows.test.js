import assert from 'node:assert/strict';
import test from 'node:test';

import { retry } from '../async/retry.js';
import { runSerial } from '../async/serial.js';
import { withTimeout } from '../async/timeout.js';

test('retry exposes attempts and applies retry policy', async () => {
  const seen = [];
  const value = await retry(async ({ attempt }) => {
    seen.push(attempt);
    if (attempt < 3) throw new Error('again');
    return 'done';
  }, { attempts: 3 });
  assert.equal(value, 'done');
  assert.deepEqual(seen, [1, 2, 3]);
});

test('withTimeout aborts cooperative work with the exact timeout reason', async () => {
  const reason = new Error('deadline');
  await assert.rejects(withTimeout(() => new Promise(() => {}), 0, { reason }),
    error => error === reason);
});

test('runSerial never overlaps tasks and preserves result order', async () => {
  const seen = [];
  const results = await runSerial([
    async ({ index }) => { seen.push(`start${index}`); await Promise.resolve(); seen.push(`end${index}`); return 1; },
    async ({ index }) => { seen.push(`start${index}`); return 2; },
  ]);
  assert.deepEqual(results, [1, 2]);
  assert.deepEqual(seen, ['start0', 'end0', 'start1']);
});
