import assert from 'node:assert/strict';
import test from 'node:test';

import { cls } from '../dom/stylesheets.js';

test('classes composes strings, arrays, objects, and removes duplicates', () => {
  assert.equal(
    cls('button', ['active', null], { disabled: false, primary: true }, 'button'),
    'button active primary',
  );
});
