import assert from 'node:assert/strict';
import test from 'node:test';

import { createMessages, formatMessage } from '../localization/messages.js';

test('message formatting is plain-text interpolation without evaluation', () => {
  assert.equal(formatMessage('Hello {user.name}', { user: { name: 'Ada' } }), 'Hello Ada');
  assert.equal(formatMessage('{missing}', {}), '{missing}');
  assert.throws(() => formatMessage('{missing}', {}, { missing: 'throw' }), ReferenceError);
});

test('message catalogs isolate locale, fallback, and function-valued policy', () => {
  const messages = createMessages({
    en: { welcome: 'Hello {name}', count: ({ count }) => `${count} items` },
    zh: {},
  }, { locale: 'zh', fallbackLocale: 'en' });
  assert.equal(messages.translate('welcome', { name: '林' }), 'Hello 林');
  messages.setLocale('en');
  assert.equal(messages.translate('count', { count: 2 }), '2 items');
  assert.equal(messages.translate('absent'), undefined);
});
