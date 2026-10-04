import { test } from 'node:test';
import assert from 'node:assert/strict';
import { duaCategoryForNow } from './duas.ts';

const base = { eid: false, sinceAdhanMs: null, atMosque: false, activeSeason: null } as const;
const MINUTE = 60_000;

test('Eid wins over everything', () => {
  assert.equal(duaCategoryForNow({ ...base, eid: true, sinceAdhanMs: MINUTE }), 'eid');
});

test('the first 5 minutes after adhan point to the adhan duas, the rest of the hour to the duas after prayer', () => {
  assert.equal(duaCategoryForNow({ ...base, sinceAdhanMs: 4 * MINUTE }), 'after-adhan');
  assert.equal(duaCategoryForNow({ ...base, sinceAdhanMs: 5 * MINUTE }), 'after-salah');
  assert.equal(duaCategoryForNow({ ...base, sinceAdhanMs: 59 * MINUTE }), 'after-salah');
});

test('at a mosque the wudu and mosque duas come first, unless adhan or prayer is recent', () => {
  const atMosque = { ...base, atMosque: true, activeSeason: 'ramadan' } as const;
  assert.equal(duaCategoryForNow({ ...atMosque, sinceAdhanMs: 90 * MINUTE }), 'wudu-mosque');
  assert.equal(duaCategoryForNow({ ...atMosque, sinceAdhanMs: 2 * MINUTE }), 'after-adhan');
  assert.equal(duaCategoryForNow({ ...atMosque, sinceAdhanMs: 30 * MINUTE }), 'after-salah');
});

test('an active season replaces the everyday default', () => {
  assert.equal(duaCategoryForNow({ ...base, activeSeason: 'ramadan' }), 'ramadan');
  assert.equal(duaCategoryForNow({ ...base, activeSeason: 'dhul-hijjah' }), 'hajj');
  assert.equal(duaCategoryForNow(base), 'after-salah');
});
