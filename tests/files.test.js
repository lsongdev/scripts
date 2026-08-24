import assert from 'node:assert/strict';
import test from 'node:test';

import { readArrayBuffer, readText } from '../files/read.js';

test('readText uses Blob text semantics for UTF-8', async () => {
  const blob = new Blob(['hello 你']);
  assert.equal(await readText(blob), 'hello 你');
});

test('readText supports an explicit alternate encoding', async () => {
  const blob = new Blob([Uint8Array.from([0x48, 0x69])]);
  assert.equal(await readText(blob, { encoding: 'ascii' }), 'Hi');
});

test('readArrayBuffer returns the Blob bytes', async () => {
  const blob = new Blob([Uint8Array.from([1, 2, 3])]);
  assert.deepEqual(new Uint8Array(await readArrayBuffer(blob)), new Uint8Array([1, 2, 3]));
  assert.throws(() => readArrayBuffer('not a blob'), TypeError);
});
