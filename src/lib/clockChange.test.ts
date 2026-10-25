import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clockChangeReminders } from './clockChange.ts';
import { upcomingOsloClockChanges } from './time.ts';

test('Oslo clock changes follow the last Sunday of March and October every year', () => {
  assert.deepEqual(
    upcomingOsloClockChanges(new Date('2026-10-25T01:00Z'), 5).map((change) => [
      change.at.toISOString(),
      change.direction,
    ]),
    [
      ['2027-03-28T01:00:00.000Z', 'forward'],
      ['2027-10-31T01:00:00.000Z', 'back'],
      ['2028-03-26T01:00:00.000Z', 'forward'],
      ['2028-10-29T01:00:00.000Z', 'back'],
      ['2029-03-25T01:00:00.000Z', 'forward'],
    ],
  );
});

test('reminders fire at 20:00 Norwegian time the evening before, with the right direction', () => {
  const reminders = clockChangeReminders(new Date('2027-01-10T12:00Z'));
  assert.deepEqual(
    reminders.map((reminder) => [reminder.eveIso, reminder.fireAt.toISOString()]),
    [
      ['2027-03-27', '2027-03-27T19:00:00.000Z'],
      ['2027-10-30', '2027-10-30T18:00:00.000Z'],
      ['2028-03-25', '2028-03-25T19:00:00.000Z'],
      ['2028-10-28', '2028-10-28T18:00:00.000Z'],
    ],
  );
  assert.notEqual(reminders[0].body, reminders[1].body);
  assert.equal(reminders[0].body, reminders[2].body);
});

test('skips a change whose evening reminder has already passed', () => {
  const [first] = clockChangeReminders(new Date('2027-03-27T19:30Z'));
  assert.equal(first.eveIso, '2027-10-30');
});
