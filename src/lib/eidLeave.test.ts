import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { HijriDay } from '../api/types.ts';
import { upcomingEidLeave } from './eidLeave.ts';

function row(gregorian_date: string, hijri_date: string): HijriDay {
  return { gregorian_date, hijri_date } as HijriDay;
}

const rows = [
  row('2027-03-09', '1448-9-30'),
  row('2027-03-10', '1448-10-1'),
  row('2027-03-11', '1448-10-2'),
];

test('shows from 30 days before Eid with a deadline 14 days before it', () => {
  assert.deepEqual(upcomingEidLeave(rows, '2027-02-08'), {
    eid: 'fitr',
    eidIso: '2027-03-10',
    deadlineIso: '2027-02-24',
    daysToDeadline: 16,
  });
});

test('hidden more than 30 days before Eid', () => {
  assert.equal(upcomingEidLeave(rows, '2027-02-07'), null);
});

test('still shown on the deadline day, hidden the day after', () => {
  assert.equal(upcomingEidLeave(rows, '2027-02-24')?.daysToDeadline, 0);
  assert.equal(upcomingEidLeave(rows, '2027-02-25'), null);
});

test('Eid al-Adha is 10 Dhul Hijjah', () => {
  const adha = [row('2027-05-16', '1448-12-9'), row('2027-05-17', '1448-12-10')];
  assert.equal(upcomingEidLeave(adha, '2027-05-01')?.eid, 'adha');
  assert.equal(upcomingEidLeave(adha, '2027-05-01')?.deadlineIso, '2027-05-03');
});
