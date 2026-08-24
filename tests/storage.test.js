import assert from 'node:assert/strict';
import test from 'node:test';

import { createStorage } from '../storage/local.js';

class MemoryStorage {
  #values = new Map();

  get length() {
    return this.#values.size;
  }

  key(index) {
    return [...this.#values.keys()][index] ?? null;
  }

  getItem(key) {
    return this.#values.get(String(key)) ?? null;
  }

  setItem(key, value) {
    this.#values.set(String(key), String(value));
  }

  removeItem(key) {
    this.#values.delete(String(key));
  }

  clear() {
    this.#values.clear();
  }
}

test('createStorage preserves standard string semantics', () => {
  const storage = new MemoryStorage();
  const values = createStorage({ storage });

  assert.equal(values.get('missing'), null);
  assert.equal(values.set('count', 3), '3');
  assert.equal(values.get('count'), '3');
  assert.equal(values.has('count'), true);
  values.remove('count');
  assert.equal(values.has('count'), false);
});

test('namespaces isolate keys and clear only their own values', () => {
  const storage = new MemoryStorage();
  const first = createStorage({ namespace: 'first', storage });
  const second = createStorage({ namespace: 'second', storage });

  first.set('shared', 'a');
  first.set('only-first', 'b');
  second.set('shared', 'c');

  assert.deepEqual(first.keys().sort(), ['only-first', 'shared']);
  assert.equal(second.get('shared'), 'c');
  first.clear();
  assert.deepEqual(first.keys(), []);
  assert.equal(second.get('shared'), 'c');
});

test('createStorage can operate without a cache', () => {
  const storage = new MemoryStorage();
  const values = createStorage({ storage, cache: false });
  values.set('key', 'first');
  storage.setItem('key', 'external');
  assert.equal(values.get('key'), 'external');
});
