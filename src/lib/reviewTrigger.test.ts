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
  lastRequestedAt: null,
  lastRequestedVersion: null,
};

const ctx: ReviewContext = {
  now: Date.UTC(2026, 9, 10),
  appVersion: '1.9.0',
  prayersLogged: 0,
  dayCompleted: false,
  suppressed: false,
};

const days = ['01', '02', '03', '04', '05', '06', '07'].map((d) => `2026-10-${d}`);
const regular: ReviewHistory = { ...fresh, activeDays: days };

test('nothing met returns null', () => {
  assert.equal(reviewTrigger(fresh, ctx), null);
});

test('fewer than seven active days never triggers', () => {
  const early = { ...fresh, activeDays: days.slice(1) };
  assert.equal(reviewTrigger(early, ctx), null);
  assert.equal(reviewTrigger(early, { ...ctx, prayersLogged: 5, dayCompleted: true }), null);
});

test('a completed day triggers for a regular user', () => {
  assert.equal(reviewTrigger(regular, { ...ctx, prayersLogged: 5, dayCompleted: true }), 'day_completed');
});

test('tracker users wait for a completed day', () => {
  assert.equal(reviewTrigger(regular, { ...ctx, prayersLogged: 3 }), null);
});

test('users without the tracker are asked after seven active days', () => {
  assert.equal(reviewTrigger(regular, ctx), 'active_days');
});

test('suppressed session never triggers', () => {
  assert.equal(reviewTrigger(regular, { ...ctx, prayersLogged: 9, dayCompleted: true, suppressed: true }), null);
});

test('re-ask needs 120 days and a new version', () => {
  const asked: ReviewHistory = { ...regular, lastRequestedAt: ctx.now - REASK_AFTER_MS, lastRequestedVersion: '1.8.0' };
  assert.equal(reviewTrigger(asked, { ...ctx, prayersLogged: 5, dayCompleted: true }), 'day_completed');
  assert.equal(reviewTrigger({ ...asked, lastRequestedVersion: '1.9.0' }, { ...ctx, prayersLogged: 5, dayCompleted: true }), null);
  assert.equal(reviewTrigger({ ...asked, lastRequestedAt: ctx.now - REASK_AFTER_MS + 1 }, { ...ctx, prayersLogged: 5, dayCompleted: true }), null);
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
