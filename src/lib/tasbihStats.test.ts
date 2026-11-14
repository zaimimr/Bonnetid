import assert from 'node:assert/strict';
import test from 'node:test';
import { KEEP_DAYS, addDaily, allTimeCount, dayKey, rankedTotals, todayCount, weekCount } from './tasbihStats.ts';

test('counts today, the last seven days and all time', () => {
  const now = new Date(2026, 10, 14, 12);
  let daily = {};
  daily = addDaily(daily, 'subhanallah', new Date(2026, 10, 5, 9));
  daily = addDaily(daily, 'subhanallah', new Date(2026, 10, 8, 9));
  daily = addDaily(daily, 'alhamdulillah', now);
  daily = addDaily(daily, 'alhamdulillah', now);
  assert.equal(todayCount(daily, now), 2);
  assert.equal(todayCount(daily, now, 'alhamdulillah'), 2);
  assert.equal(todayCount(daily, now, 'subhanallah'), 0);
  assert.equal(weekCount(daily, now), 3);
  assert.equal(allTimeCount({ a: 4, b: 6 }), 10);
});

test('drops days older than the keep window', () => {
  const start = new Date(2026, 0, 1, 9);
  let daily = addDaily({}, 'x', start);
  daily = addDaily(daily, 'x', new Date(2026, 0, KEEP_DAYS + 1, 9));
  assert.equal(daily[dayKey(start)], undefined);
  assert.equal(Object.keys(daily).length, 1);
});

test('ranks totals by count and hides zeros', () => {
  assert.deepEqual(rankedTotals({ a: 2, b: 0, c: 9 }), [
    ['c', 9],
    ['a', 2],
  ]);
});
