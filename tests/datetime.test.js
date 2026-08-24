import assert from 'node:assert/strict';
import test from 'node:test';
import { dateParts, difference, formatDate, formatDuration, formatTime, parseDate } from '../datetime/format.js';

test('date formatting uses explicit IANA time zones and stable tokens', () => {
  const value = '2026-08-24T12:34:56.789Z';
  assert.equal(formatDate(value, '{datetime}', { timeZone: 'UTC' }), '2026-08-24 12:34:56');
  assert.equal(formatDate(value, '{yyyy}/{MM}/{dd} {HH}:{mm}', {
    timeZone: 'Asia/Shanghai',
  }), '2026/08/24 20:34');
  assert.deepEqual(dateParts(value, { timeZone: 'UTC' }), {
    day: 24, hour: 12, millisecond: 789, minute: 34,
    month: 8, second: 56, year: 2026,
  });
  assert.throws(() => parseDate('not a date'), RangeError);
});

test('duration differences retain direction and format predictably', () => {
  const duration = difference('2026-08-23T10:00:00Z', '2026-08-24T12:03:04Z');
  assert.equal(duration.sign, -1);
  assert.equal(duration.totalMilliseconds, -93_784_000);
  assert.equal(formatDuration(duration), '-1d2h3m4s');
  assert.equal(formatDuration(duration, { separator: ':' }), '-1:02:03:04');
});

test('elapsed time formats whole seconds as an unbounded minute clock', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(65.9), '01:05');
  assert.equal(formatTime(3_600), '60:00');
  assert.equal(formatTime(-1), '00:00');
  assert.throws(() => formatTime(Number.NaN), TypeError);
});
