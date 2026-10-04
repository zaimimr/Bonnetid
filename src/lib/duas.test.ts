import { test } from 'node:test';
import assert from 'node:assert/strict';
import { duaCategoryForNow } from './duas.ts';

const base = { eid: false, sinceAdhanMs: null, activeSeason: null } as const;
const MINUTE = 60_000;

test('Eid wins over everything', () => {
  assert.equal(duaCategoryForNow({ ...base, eid: true, sinceAdhanMs: MINUTE }), 'eid');
});

test('the first 15 minutes after adhan point to the adhan duas', () => {
  assert.equal(duaCategoryForNow({ ...base, sinceAdhanMs: 14 * MINUTE }), 'after-adhan');
  assert.equal(duaCategoryForNow({ ...base, sinceAdhanMs: 15 * MINUTE }), 'after-salah');
});

test('an active season replaces the everyday default', () => {
  assert.equal(duaCategoryForNow({ ...base, activeSeason: 'ramadan' }), 'ramadan');
  assert.equal(duaCategoryForNow({ ...base, activeSeason: 'dhul-hijjah' }), 'hajj');
  assert.equal(duaCategoryForNow(base), 'after-salah');
});
