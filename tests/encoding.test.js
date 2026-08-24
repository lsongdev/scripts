import assert from 'node:assert/strict';
import test from 'node:test';

import { base32ToBytes, bytesToBase32 } from '../encoding/base32.js';
import {
  base64ToBytes,
  base64URLToBytes,
  bytesToBase64,
  bytesToBase64URL,
} from '../encoding/base64.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

test('base64 helpers round-trip arbitrary bytes', () => {
  const input = encoder.encode('hello 你');
  const encoded = bytesToBase64(input);
  assert.equal(decoder.decode(base64ToBytes(encoded)), 'hello 你');
  assert.deepEqual(base64ToBytes('/+7d'), Uint8Array.from([255, 238, 221]));
});

test('base64url helpers use the unpadded URL alphabet', () => {
  const input = Uint8Array.from([255, 238, 221]);
  assert.equal(bytesToBase64URL(input), '_-7d');
  assert.deepEqual(base64URLToBytes('_-7d'), input);
});

test('base32 helpers conform to RFC 4648 vectors', () => {
  assert.equal(bytesToBase32(encoder.encode('foo')), 'MZXW6===');
  assert.equal(bytesToBase32(encoder.encode('foobar')), 'MZXW6YTBOI======');
  assert.equal(decoder.decode(base32ToBytes('MZXW6YTBOI======')), 'foobar');
  assert.throws(() => base32ToBytes('MZXW!'), SyntaxError);
});

test('base32 rejects malformed length, padding, alphabet, and trailing bits', () => {
  assert.throws(() => base32ToBytes('A'), SyntaxError);
  assert.throws(() => base32ToBytes('MY====='), SyntaxError);
  assert.throws(() => base32ToBytes('M=Y====='), SyntaxError);
  assert.throws(() => base32ToBytes('M0======'), SyntaxError);
  assert.throws(() => base32ToBytes('MZ======'), SyntaxError);
});
