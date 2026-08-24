import assert from 'node:assert/strict';
import test from 'node:test';
import { md5, md5Hex } from '../crypto/md5.js';

const vectors = new Map([
  ['', 'd41d8cd98f00b204e9800998ecf8427e'],
  ['a', '0cc175b9c0f1b6a831c399e269772661'],
  ['abc', '900150983cd24fb0d6963f7d28e17f72'],
  ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
  ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
  ['你好', '7eca689f0d3389d9dea66ae112e5cfd7'],
]);

test('MD5 matches legacy interoperability vectors for UTF-8 text', () => {
  for (const [input, expected] of vectors) assert.equal(md5Hex(input), expected);
});

test('MD5 accepts byte-oriented platform inputs and returns bytes', () => {
  const digest = md5(new TextEncoder().encode('abc'));
  assert.ok(digest instanceof Uint8Array);
  assert.equal(digest.byteLength, 16);
  assert.equal(md5Hex(digest.buffer), 'af5da9f45af7a300e3aded972f8ff687');
});
