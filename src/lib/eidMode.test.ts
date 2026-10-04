import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { HijriDay, Mosque } from '../api/types.ts';
import { eidModeAt, heroEidSource, nearbyEidMosques } from './eidMode.ts';

function row(gregorian_date: string, hijri_date: string): HijriDay {
  return { gregorian_date, hijri_date } as HijriDay;
}

function mosque(name: string, lat: number, eid_prayers: string[], show_eid = true): Mosque {
  return { org_nr: name, name, lat, lon: 10.75, show_eid, eid_prayers } as Mosque;
}

const rows = [row('2027-03-08', '1448-9-29'), row('2027-03-09', '1448-10-1'), row('2027-03-10', '1448-10-2')];
const maghrib = new Date('2027-03-08T17:05Z');

test('eve starts at Maghrib the day before Eid', () => {
  assert.equal(eidModeAt(rows, '2027-03-08', new Date('2027-03-08T17:04Z'), maghrib), null);
  assert.deepEqual(eidModeAt(rows, '2027-03-08', new Date('2027-03-08T17:05Z'), maghrib), {
    eid: 'fitr',
    phase: 'eve',
    eidIso: '2027-03-09',
  });
});

test('eve falls back to 18:00 Norwegian time without prayer times', () => {
  assert.equal(eidModeAt(rows, '2027-03-08', new Date('2027-03-08T16:59Z'), null), null);
  assert.equal(eidModeAt(rows, '2027-03-08', new Date('2027-03-08T17:00Z'), null)?.phase, 'eve');
});

test('the whole Eid day is Eid mode and the day after is not', () => {
  assert.equal(eidModeAt(rows, '2027-03-09', new Date('2027-03-08T23:30Z'), null)?.phase, 'day');
  assert.equal(eidModeAt(rows, '2027-03-10', new Date('2027-03-09T23:30Z'), null), null);
});

test('Eid al-Adha is 10 Dhul Hijjah', () => {
  const adha = [row('2027-05-16', '1448-12-9'), row('2027-05-17', '1448-12-10')];
  assert.equal(eidModeAt(adha, '2027-05-17', new Date('2027-05-17T08:00Z'), null)?.eid, 'adha');
});

test('nearby lists only mosques with Eid times, nearest first', () => {
  const list = [
    mosque('far', 63.4, ['09:00']),
    mosque('hidden', 59.9, ['09:00'], false),
    mosque('empty', 59.9, []),
    mosque('near', 59.92, ['08:30', '10:00']),
  ];
  assert.deepEqual(
    nearbyEidMosques(list, { lat: 59.91, lon: 10.75 }).map((item) => item.name),
    ['near', 'far'],
  );
});

test('hero prefers my mosque, falls back to the nearest, and ends 30 min after the last prayer', () => {
  const mine = mosque('mine', 59.9, ['10:00', '08:00']);
  const near = mosque('near', 59.92, ['09:00']);
  const morning = new Date('2027-03-09T06:00Z');
  const source = heroEidSource(mine, [near], '2027-03-09', morning);
  assert.equal(source?.mosque.name, 'mine');
  assert.deepEqual(source?.prayers.map((date) => date.toISOString()), [
    '2027-03-09T07:00:00.000Z',
    '2027-03-09T09:00:00.000Z',
  ]);
  assert.equal(heroEidSource(mosque('mine', 59.9, []), [near], '2027-03-09', morning)?.mosque.name, 'near');
  assert.ok(heroEidSource(mine, [near], '2027-03-09', new Date('2027-03-09T09:30Z')));
  assert.equal(heroEidSource(mine, [near], '2027-03-09', new Date('2027-03-09T09:31Z')), null);
});
