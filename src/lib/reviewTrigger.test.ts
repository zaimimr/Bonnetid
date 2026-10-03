import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addActiveDay,
  localDayKey,
  REASK_AFTER_MS,
  reviewTrigger,
  type ReviewContext,
  type ReviewHistory,
} from './reviewTrigger.ts';

const fresh: ReviewHistory = {
  activeDays: [],
  mosqueSelectedOn: null,
  lastRequestedAt: null,
  lastRequestedVersion: null,
};

const ctx: ReviewContext = {
  today: '2026-10-10',
  now: Date.UTC(2026, 9, 10),
  appVersion: '1.9.0',
  prayersLogged: 0,
  suppressed: false,
};

test('nothing met returns null', () => {
  assert.equal(reviewTrigger(fresh, ctx), null);
});

test('five prayers logged triggers', () => {
  assert.equal(reviewTrigger(fresh, { ...ctx, prayersLogged: 5 }), 'prayers_logged');
  assert.equal(reviewTrigger(fresh, { ...ctx, prayersLogged: 4 }), null);
});

test('seven active days triggers', () => {
  const days = ['01', '02', '03', '04', '05', '06', '07'].map((d) => `2026-10-${d}`);
  assert.equal(reviewTrigger({ ...fresh, activeDays: days }, ctx), 'active_days');
  assert.equal(reviewTrigger({ ...fresh, activeDays: days.slice(1) }, ctx), null);
});

test('mosque return triggers only on a later day', () => {
  assert.equal(reviewTrigger({ ...fresh, mosqueSelectedOn: '2026-10-09' }, ctx), 'mosque_return');
  assert.equal(reviewTrigger({ ...fresh, mosqueSelectedOn: '2026-10-10' }, ctx), null);
});

test('suppressed session never triggers', () => {
  assert.equal(reviewTrigger(fresh, { ...ctx, prayersLogged: 9, suppressed: true }), null);
});

test('re-ask needs 120 days and a new version', () => {
  const asked: ReviewHistory = { ...fresh, lastRequestedAt: ctx.now - REASK_AFTER_MS, lastRequestedVersion: '1.8.0' };
  assert.equal(reviewTrigger(asked, { ...ctx, prayersLogged: 5 }), 'prayers_logged');
  assert.equal(reviewTrigger({ ...asked, lastRequestedVersion: '1.9.0' }, { ...ctx, prayersLogged: 5 }), null);
  assert.equal(reviewTrigger({ ...asked, lastRequestedAt: ctx.now - REASK_AFTER_MS + 1 }, { ...ctx, prayersLogged: 5 }), null);
});

test('addActiveDay dedupes, sorts and caps at 30', () => {
  assert.deepEqual(addActiveDay(['2026-10-02', '2026-10-01'], '2026-10-02'), ['2026-10-01', '2026-10-02']);
  const many = Array.from({ length: 30 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`);
  const next = addActiveDay(many, '2026-10-01');
  assert.equal(next.length, 30);
  assert.equal(next[0], '2026-09-02');
  assert.equal(next[29], '2026-10-01');
});

test('localDayKey uses local calendar date', () => {
  assert.equal(localDayKey(new Date(2026, 0, 5, 23, 30)), '2026-01-05');
});
