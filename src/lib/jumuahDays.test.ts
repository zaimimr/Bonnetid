import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isoDateIsJumuahEveOrDay } from './time.ts';

test('isoDateIsJumuahEveOrDay is true on Thursday and Friday only', () => {
  assert.equal(isoDateIsJumuahEveOrDay('2026-10-14'), false);
  assert.equal(isoDateIsJumuahEveOrDay('2026-10-15'), true);
  assert.equal(isoDateIsJumuahEveOrDay('2026-10-16'), true);
  assert.equal(isoDateIsJumuahEveOrDay('2026-10-17'), false);
});

test('isoDateIsJumuahEveOrDay rejects invalid dates', () => {
  assert.equal(isoDateIsJumuahEveOrDay('not-a-date'), false);
});
