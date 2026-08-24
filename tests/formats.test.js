import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCSV, stringifyCSV } from '../encoding/csv.js';
import { deleteCookie, parseCookies, serializeCookie, setCookie } from '../storage/cookies.js';

test('CSV parses quoted fields, escaped quotes, and embedded newlines', () => {
  const source = 'name,note\r\nAlice,"one, two"\r\nBob,"line 1\nline ""2"""\r\n';
  assert.deepEqual(parseCSV(source), [
    ['name', 'note'],
    ['Alice', 'one, two'],
    ['Bob', 'line 1\nline "2"'],
  ]);
  assert.equal(stringifyCSV(parseCSV(source)), source.trimEnd());
  assert.throws(() => parseCSV('"unterminated'), SyntaxError);
});

test('cookie helpers preserve raw parsing and explicit browser attributes', () => {
  assert.deepEqual([...parseCookies('one=1; encoded=a%20b; equals=a=b')], [
    ['one', '1'], ['encoded', 'a%20b'], ['equals', 'a=b'],
  ]);
  assert.equal(serializeCookie('session', 'a b', {
    path: '/', sameSite: 'strict', secure: true,
  }), 'session=a%20b; Path=/; SameSite=Strict; Secure');

  const target = { cookie: '' };
  setCookie('name', 'value', { path: '/' }, { document: target });
  assert.equal(target.cookie, 'name=value; Path=/');
  deleteCookie('name', { path: '/' }, { document: target });
  assert.match(target.cookie, /^name=; Path=\/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0$/);
});
