import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDurationSpaced } from './time.ts';

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
