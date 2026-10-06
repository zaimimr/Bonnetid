import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setLanguage } from './i18n.ts';
import { formatDayCount, formatDurationSpaced } from './time.ts';

const MINUTE = 60_000;

test('formatDurationSpaced writes hours and minutes', () => {
  assert.equal(formatDurationSpaced(156 * MINUTE), '2 t 36 min');
  assert.equal(formatDurationSpaced(612 * MINUTE), '10 t 12 min');
});

test('formatDurationSpaced drops the empty part', () => {
  assert.equal(formatDurationSpaced(45 * MINUTE), '45 min');
  assert.equal(formatDurationSpaced(120 * MINUTE), '2 t');
  assert.equal(formatDurationSpaced(-MINUTE), '0 min');
});

test('formatDurationSpaced and formatDayCount follow the language', () => {
  setLanguage('en');
  assert.equal(formatDurationSpaced(156 * MINUTE), '2 h 36 min');
  setLanguage('ar');
  assert.equal(formatDurationSpaced(120 * MINUTE), 'ساعتان');
  assert.equal(formatDurationSpaced(181 * MINUTE), '3 ساعات ودقيقة');
  assert.equal(formatDayCount(2), 'يومين');
  assert.equal(formatDayCount(11), '11 يومًا');
  setLanguage('ur');
  assert.equal(formatDurationSpaced(61 * MINUTE), '1 گھنٹہ 1 منٹ');
  setLanguage('nb');
  assert.equal(formatDayCount(5), '5 dager');
});
