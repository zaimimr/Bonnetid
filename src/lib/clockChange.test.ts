import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clockChangeReminder } from './clockChange.ts';
import { nextOsloClockChange } from './time.ts';

test('next Oslo clock change rolls from autumn to the following spring', () => {
  assert.deepEqual(nextOsloClockChange(new Date('2026-10-25T00:59Z')), {
    at: new Date('2026-10-25T01:00Z'),
    direction: 'back',
  });
  assert.deepEqual(nextOsloClockChange(new Date('2026-10-25T01:00Z')), {
    at: new Date('2027-03-28T01:00Z'),
    direction: 'forward',
  });
});

test('reminder fires at 20:00 Norwegian time the evening before the change', () => {
  const spring = clockChangeReminder(new Date('2027-01-10T12:00Z'));
  assert.equal(spring?.eveIso, '2027-03-27');
  assert.equal(spring?.fireAt.toISOString(), '2027-03-27T19:00:00.000Z');

  const autumn = clockChangeReminder(new Date('2027-08-01T12:00Z'));
  assert.equal(autumn?.eveIso, '2027-10-30');
  assert.equal(autumn?.fireAt.toISOString(), '2027-10-30T18:00:00.000Z');
});

test('no reminder once the evening before has passed', () => {
  assert.equal(clockChangeReminder(new Date('2027-03-27T19:30Z')), null);
});
