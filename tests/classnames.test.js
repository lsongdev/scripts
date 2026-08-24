import assert from 'node:assert/strict';
import test from 'node:test';

import { classes } from '../react/classnames.js';

test('classes composes strings, arrays, objects, and removes duplicates', () => {
  assert.equal(
    classes('button', ['active', null], { disabled: false, primary: true }, 'button'),
    'button active primary',
  );
});
