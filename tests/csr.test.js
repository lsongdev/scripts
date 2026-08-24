import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createCSRPEM } from '../crypto/csr.js';

function verifyWithOpenSSL(pem, expectedSubject) {
  const directory = mkdtempSync(join(tmpdir(), 'web-stdlib-csr-'));
  const path = join(directory, 'request.pem');
  try {
    writeFileSync(path, pem);
    const result = spawnSync('openssl', ['req', '-in', path, '-noout', '-verify', '-subject'], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    const output = `${result.stdout}${result.stderr}`;
    assert.match(output, /Certificate request self-signature verify OK/u);
    assert.match(output, expectedSubject);
  } finally {
    rmSync(directory, { recursive: true });
  }
}

test('RSA PKCS#1 CSR interoperates with OpenSSL', async () => {
  const keyPair = await crypto.subtle.generateKey({
    name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256',
  }, true, ['sign', 'verify']);
  const pem = await createCSRPEM(keyPair, {
    country: 'CN', organization: 'Web Stdlib', commonName: 'example.test',
  });
  verifyWithOpenSSL(pem, /CN\s*=\s*example\.test/u);
});

test('ECDSA CSR converts Web Crypto raw signatures for OpenSSL', async () => {
  const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const pem = await createCSRPEM(keyPair, [
    { name: 'commonName', value: 'ecdsa.example' },
    { name: 'email', value: 'admin@example.test' },
  ]);
  verifyWithOpenSSL(pem, /CN\s*=\s*ecdsa\.example/u);
});

test('CSR validates subjects and algorithm-specific values', async () => {
  const keyPair = await crypto.subtle.generateKey({
    name: 'RSA-PSS', modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256',
  }, true, ['sign', 'verify']);
  await assert.rejects(createCSRPEM(keyPair, { country: 'China' }), TypeError);
  const pem = await createCSRPEM(keyPair, { commonName: 'pss.example' });
  verifyWithOpenSSL(pem, /CN\s*=\s*pss\.example/u);
});
