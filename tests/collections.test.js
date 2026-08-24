import assert from 'node:assert/strict';
import test from 'node:test';

import { sample, shuffled } from '../array/random.js';
import { getPath, omit, pick } from '../array/records.js';

test('shuffled and sample preserve their input and support deterministic randomness', () => {
  const source = [1, 2, 3, 4];
  assert.deepEqual(shuffled(source, { random: () => 0 }), [2, 3, 4, 1]);
  assert.deepEqual(sample(source, 2, { random: () => 0 }), [2, 3]);
  assert.deepEqual(source, [1, 2, 3, 4]);
  assert.throws(() => sample(source, 5), RangeError);
});

test('record selection uses own properties and blocks prototype traversal', () => {
  const record = Object.assign(Object.create({ inherited: true }), {
    id: 1,
    profile: { name: 'Ada' },
  });
  assert.equal(getPath(record, 'profile.name'), 'Ada');
  assert.equal(getPath(record, '__proto__.polluted', 'safe'), 'safe');
  assert.deepEqual({ ...pick(record, ['id', 'inherited']) }, { id: 1 });
  assert.deepEqual({ ...omit(record, ['profile']) }, { id: 1 });
});
