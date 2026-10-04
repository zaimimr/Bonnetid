import { test } from 'node:test';
import assert from 'node:assert/strict';
import { duaCategoryForNow } from './duas.ts';

const base = { eid: false, sinceAdhanMs: null, atMosque: false, activeSeason: null } as const;
const atMosque = { ...base, atMosque: true } as const;
const MINUTE = 60_000;

test('Eid wins over everything', () => {
  assert.equal(duaCategoryForNow({ ...atMosque, eid: true, sinceAdhanMs: MINUTE }), 'eid');
});

test('at a mosque: adhan duas for 5 minutes, duas after prayer until 20, then wudu and mosque', () => {
  assert.equal(duaCategoryForNow({ ...atMosque, sinceAdhanMs: 4 * MINUTE }), 'after-adhan');
  assert.equal(duaCategoryForNow({ ...atMosque, sinceAdhanMs: 5 * MINUTE }), 'after-salah');
  assert.equal(duaCategoryForNow({ ...atMosque, sinceAdhanMs: 19 * MINUTE }), 'after-salah');
  assert.equal(duaCategoryForNow({ ...atMosque, sinceAdhanMs: 20 * MINUTE }), 'wudu-mosque');
  assert.equal(duaCategoryForNow({ ...atMosque, activeSeason: 'ramadan' }), 'wudu-mosque');
});

test('away from a mosque adhan time does not pick a category', () => {
  assert.equal(duaCategoryForNow({ ...base, sinceAdhanMs: 2 * MINUTE }), null);
  assert.equal(duaCategoryForNow({ ...base, sinceAdhanMs: 10 * MINUTE }), null);
});

test('an active season picks its category, otherwise nothing', () => {
  assert.equal(duaCategoryForNow({ ...base, activeSeason: 'ramadan' }), 'ramadan');
  assert.equal(duaCategoryForNow({ ...base, activeSeason: 'dhul-hijjah' }), 'hajj');
  assert.equal(duaCategoryForNow(base), null);
});
