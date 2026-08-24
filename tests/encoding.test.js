import assert from 'node:assert/strict';
import test from 'node:test';

import {
  decode as decodeBase32,
  encode as encodeBase32,
} from '../encoding/base32.js';
import {
  encode as encodeBase64,
  decode as decodeBase64,
  decodeBase64URL,
  encodeBase64URL,
} from '../encoding/base64.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

test('base64 helpers round-trip arbitrary bytes', () => {
  const input = encoder.encode('hello 你');
  const encoded = encodeBase64(input);
  assert.equal(decoder.decode(decodeBase64(encoded)), 'hello 你');
  assert.deepEqual(decodeBase64('/+7d'), Uint8Array.from([255, 238, 221]));
});

test('base64url helpers use the unpadded URL alphabet', () => {
  const input = Uint8Array.from([255, 238, 221]);
  assert.equal(encodeBase64URL(input), '_-7d');
  assert.deepEqual(decodeBase64URL('_-7d'), input);
});

test('base32 helpers conform to RFC 4648 vectors', () => {
  assert.equal(encodeBase32(encoder.encode('foo')), 'MZXW6===');
  assert.equal(encodeBase32(encoder.encode('foobar')), 'MZXW6YTBOI======');
  assert.equal(decoder.decode(decodeBase32('MZXW6YTBOI======')), 'foobar');
  assert.throws(() => decodeBase32('MZXW!'), SyntaxError);
});

test('base32 rejects malformed length, padding, alphabet, and trailing bits', () => {
  assert.throws(() => decodeBase32('A'), SyntaxError);
  assert.throws(() => decodeBase32('MY====='), SyntaxError);
  assert.throws(() => decodeBase32('M=Y====='), SyntaxError);
  assert.throws(() => decodeBase32('M0======'), SyntaxError);
  assert.throws(() => decodeBase32('MZ======'), SyntaxError);
});
