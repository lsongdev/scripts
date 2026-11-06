import assert from 'node:assert/strict';
import test from 'node:test';
import { pages } from '../react/components/pagination.js';

test('pages shows the ends, the neighbours of the current page and gaps', () => {
  assert.deepEqual(pages(1, 1), [1]);
  assert.deepEqual(pages(1, 3), [1, 2, 3]);
  assert.deepEqual(pages(1, 10), [1, 2, null, 10]);
  assert.deepEqual(pages(5, 10), [1, null, 4, 5, 6, null, 10]);
  assert.deepEqual(pages(10, 10), [1, null, 9, 10]);
  assert.deepEqual(pages(5, 10, 2), [1, 2, 3, 4, 5, 6, 7, null, 10]);
  assert.deepEqual(pages(6, 12, 2), [1, null, 4, 5, 6, 7, 8, null, 12]);
});

test('a gap of one page shows the page instead', () => {
  assert.deepEqual(pages(3, 10), [1, 2, 3, 4, null, 10]);
  assert.deepEqual(pages(4, 7), [1, 2, 3, 4, 5, 6, 7]);
});
