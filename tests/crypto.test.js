import assert from 'node:assert/strict';
import test from 'node:test';

import { digest, hmac, sha256 } from '../crypto/index.js';
import {
  deriveECDHKey,
  generateAESKey,
  generateECDHKeyPair,
} from '../crypto/keys.js';
import { decodePEM, encodePEM, exportKeyPEM, importKeyPEM } from '../crypto/pem.js';

const hex = value => [...new Uint8Array(value)]
  .map(byte => byte.toString(16).padStart(2, '0'))
  .join('');

test('digest accepts UTF-8 text and returns the standard ArrayBuffer', async () => {
  const result = await sha256('abc');
  assert.ok(result instanceof ArrayBuffer);
  assert.equal(
    hex(result),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  );
  assert.deepEqual(await digest('SHA-256', 'abc'), result);
});

test('hmac accepts raw key bytes and returns an ArrayBuffer', async () => {
  const signature = await hmac('SHA-256', new TextEncoder().encode('key'), 'data');
  assert.ok(signature instanceof ArrayBuffer);
  assert.equal(signature.byteLength, 32);
});

test('key helpers return standard CryptoKey objects with secure defaults', async () => {
  const key = await generateAESKey();
  assert.equal(key.type, 'secret');
  assert.equal(key.extractable, false);
  assert.deepEqual(key.usages.sort(), ['decrypt', 'encrypt']);
});

test('deriveECDHKey produces a usable standard key', async () => {
  const first = await generateECDHKeyPair();
  const second = await generateECDHKeyPair();
  const derived = await deriveECDHKey(first.privateKey, second.publicKey, {
    name: 'AES-GCM',
    length: 256,
  });
  assert.equal(derived.algorithm.name, 'AES-GCM');
  assert.deepEqual(derived.usages.sort(), ['decrypt', 'encrypt']);
});

test('PEM helpers round-trip DER bytes strictly', () => {
  const bytes = Uint8Array.from({ length: 100 }, (_, index) => index);
  const pem = encodePEM('TEST DATA', bytes);
  const decoded = decodePEM(pem);
  assert.equal(decoded.label, 'TEST DATA');
  assert.deepEqual(decoded.bytes, bytes);
  assert.throws(() => decodePEM('not pem'), SyntaxError);
});

test('PEM key workflows preserve standard CryptoKey behavior', async () => {
  const pair = await crypto.subtle.generateKey({
    name: 'RSA-PSS',
    modulusLength: 1024,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  }, true, ['sign', 'verify']);

  const publicPEM = await exportKeyPEM(pair.publicKey);
  const imported = await importKeyPEM(publicPEM, {
    name: 'RSA-PSS',
    hash: 'SHA-256',
  });
  assert.equal(imported.type, 'public');
  assert.deepEqual(imported.usages, ['verify']);
});
