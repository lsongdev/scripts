import assert from 'node:assert/strict';
import test from 'node:test';

import { formDataToObject } from '../dom/form-data.js';

test('formDataToObject preserves repeated names and File values', () => {
  const data = new FormData();
  const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
  data.append('single', 'value');
  data.append('repeated', 'first');
  data.append('repeated', 'second');
  data.append('file', file);

  const object = formDataToObject(data);
  assert.equal(Object.getPrototypeOf(object), null);
  assert.equal(object.single, 'value');
  assert.deepEqual(object.repeated, ['first', 'second']);
  assert.equal(object.file, file);
});
