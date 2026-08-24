import assert from 'node:assert/strict';
import test from 'node:test';
import {
  bech32WordsToBytes,
  bytesToBech32Words,
  decode,
  encode,
} from '../encoding/bech32.js';

const valid = new Map([
  ['A12UEL5L', 'bech32'],
  ['split1checkupstagehandshakeupstreamerranterredcaperred2y9e3w', 'bech32'],
  ['?1ezyfcl', 'bech32'],
  ['A1LQFN3A', 'bech32m'],
  ['split1checkupstagehandshakeupstreamerranterredcaperredlc445v', 'bech32m'],
  ['?1v759aa', 'bech32m'],
]);

test('Bech32 and Bech32m decode official BIP-173/BIP-350 vectors', () => {
  for (const [value, encoding] of valid) {
    const decoded = decode(value);
    assert.equal(decoded.encoding, encoding);
    assert.equal(encode(decoded.prefix, decoded.words, { encoding }), value.toLowerCase());
  }
});

test('Bech32 rejects mixed case, invalid checksums, and invalid padding', () => {
  assert.throws(() => decode('a12UEL5L'), SyntaxError);
  assert.throws(() => decode('a12uel5p'), SyntaxError);
  assert.throws(() => bech32WordsToBytes([31]), SyntaxError);
});

test('Bech32 word conversion round-trips arbitrary bytes', () => {
  const input = Uint8Array.from([0, 1, 2, 127, 128, 254, 255]);
  assert.deepEqual(bech32WordsToBytes(bytesToBech32Words(input)), input);
});
