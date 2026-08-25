import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseJSONLines,
  readLines,
  readStream,
  readText,
  writeText,
} from '../streams/index.js';

const streamFrom = chunks => new ReadableStream({
  start(controller) {
    for (const chunk of chunks) controller.enqueue(chunk);
    controller.close();
  },
});

test('readStream yields values without a terminal undefined and releases its lock', async () => {
  const stream = streamFrom([1, 2]);
  const values = [];
  for await (const value of readStream(stream)) values.push(value);
  assert.deepEqual(values, [1, 2]);
  assert.equal(stream.locked, false);
});

test('readText preserves multibyte characters split across chunks', async () => {
  const bytes = new TextEncoder().encode('A你B');
  const stream = streamFrom([bytes.slice(0, 2), bytes.slice(2)]);
  assert.equal(await readText(stream), 'A你B');
});

test('readLines supports CRLF, split lines, and blank lines', async () => {
  const stream = streamFrom(['one\r\n\npar', 'tial\ntail']);
  const lines = [];
  for await (const line of readLines(stream)) lines.push(line);
  assert.deepEqual(lines, ['one', '', 'partial', 'tail']);
});

test('parseJSONLines skips blank lines by default', async () => {
  const stream = streamFrom(['{"a":1}\n\n', '{"a":2}\n']);
  const values = [];
  for await (const value of parseJSONLines(stream)) values.push(value);
  assert.deepEqual(values, [{ a: 1 }, { a: 2 }]);
});

test('writeText writes every chunk and closes the stream', async () => {
  const values = [];
  let closed = false;
  const stream = new WritableStream({
    write(value) {
      values.push(value);
    },
    close() {
      closed = true;
    },
  });

  await writeText(stream, ['a', 2]);
  assert.deepEqual(values, ['a', '2']);
  assert.equal(closed, true);
  assert.equal(stream.locked, false);
});
