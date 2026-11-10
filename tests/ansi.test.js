import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAnsi, stripAnsi } from '../text/ansi.js';

const pick = segs => segs.map(({ text, fg, bg, bold }) => ({ text, fg, bg, bold }));

test('parseAnsi splits text into styled segments', () => {
  assert.deepEqual(pick(parseAnsi('a\x1b[1;31mred\x1b[0m b')), [
    { text: 'a', fg: null, bg: null, bold: false },
    { text: 'red', fg: 1, bg: null, bold: true },
    { text: ' b', fg: null, bg: null, bold: false },
  ]);
});

test('parseAnsi reads bright, 256 and true colours, and resets', () => {
  const [bright, idx, rgb, plain] = parseAnsi('\x1b[92mA\x1b[38;5;208mB\x1b[48;2;1;2;3mC\x1b[39;49mD');
  assert.equal(bright.fg, 10);
  assert.equal(idx.fg, 208);
  assert.equal(rgb.bg, 'rgb(1, 2, 3)');
  assert.deepEqual([plain.fg, plain.bg], [null, null]);
});

test('parseAnsi swaps colours for inverse, falling back to the defaults', () => {
  const [seg] = parseAnsi('\x1b[7;32mX');
  assert.deepEqual([seg.fg, seg.bg], ['inverse-bg', 2]);
});

test('parseAnsi drops other escapes and keeps what a carriage return leaves', () => {
  assert.equal(stripAnsi('\x1b[2K\x1b[1Gdownloading 10%\rdownloading 100%\r'), 'downloading 100%');
  assert.equal(stripAnsi('\x1b]0;title\x07text\x1b[?25l'), 'text');
});

test('parseAnsi carries state across lines when asked', () => {
  const first = parseAnsi('\x1b[33mstart');
  const [next] = parseAnsi('more', { state: first.state });
  assert.equal(next.fg, 3);
});
