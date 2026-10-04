import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { PrayerDay } from '../api/types.ts';
import { buildDaySchedule, findNextPrayer } from './prayerSchedule.ts';
import { osloDateKey, osloOffsetMinutes, osloWallClockToDate, parseDayKey } from './time.ts';

function day(date: string, times: Partial<PrayerDay>): PrayerDay {
  return {
    location: 'NO0301',
    date,
    kommune: null,
    hijri_date: '1-1-1448',
    fajr: null,
    fajr_endtime: null,
    shuruq_sunrise: null,
    istiwa_noon: null,
    duhr: null,
    asr: null,
    shadow_1x: null,
    shadow_2x: null,
    wusta_noon_sunset: null,
    asr_endtime: null,
    ghrub_sunset: null,
    maghrib: null,
    isha: null,
    muntasafallayl_midnight: null,
    ...times,
  };
}

const iso = (date: Date) => date.toISOString().slice(0, 16);

test('Oslo offset flips at 01:00 UTC on the last Sunday of October and March', () => {
  assert.equal(osloOffsetMinutes(new Date('2026-10-25T00:59Z')), 120);
  assert.equal(osloOffsetMinutes(new Date('2026-10-25T01:00Z')), 60);
  assert.equal(osloOffsetMinutes(new Date('2027-03-28T00:59Z')), 60);
  assert.equal(osloOffsetMinutes(new Date('2027-03-28T01:00Z')), 120);
});

test('Norwegian wall clock maps to the right instant on both sides of the autumn change', () => {
  assert.equal(iso(osloWallClockToDate('2026-10-24', '06:00')), '2026-10-24T04:00');
  assert.equal(iso(osloWallClockToDate('2026-10-25', '06:00')), '2026-10-25T05:00');
  assert.equal(iso(osloWallClockToDate('2026-10-25', '00:30')), '2026-10-24T22:30');
  assert.equal(iso(osloWallClockToDate('2026-10-25', '04:00')), '2026-10-25T03:00');
});

test('Norwegian wall clock maps to the right instant on both sides of the spring change', () => {
  assert.equal(iso(osloWallClockToDate('2027-03-27', '05:00')), '2027-03-27T04:00');
  assert.equal(iso(osloWallClockToDate('2027-03-28', '05:00')), '2027-03-28T03:00');
  assert.equal(iso(osloWallClockToDate('2027-03-28', '01:30')), '2027-03-28T00:30');
});

test('Oslo date key rolls over at Norwegian midnight across the change', () => {
  assert.equal(osloDateKey(new Date('2026-10-24T21:59Z')), '2026-10-24');
  assert.equal(osloDateKey(new Date('2026-10-24T22:00Z')), '2026-10-25');
  assert.equal(osloDateKey(new Date('2026-10-25T22:59Z')), '2026-10-25');
  assert.equal(osloDateKey(new Date('2026-10-25T23:00Z')), '2026-10-26');
});

const saturday = day('24-10-2026', {
  fajr: '06:05',
  fajr_endtime: '08:10',
  duhr: '12:55',
  asr: '15:00',
  maghrib: '17:40',
  isha: '19:30',
});

const sunday = day('25-10-2026', {
  fajr: '05:08',
  fajr_endtime: '07:13',
  duhr: '11:55',
  asr: '14:00',
  maghrib: '16:38',
  isha: '18:28',
});

test('Isha on the night of the change ends at the first Fajr in winter time', () => {
  const schedule = buildDaySchedule(saturday, parseDayKey(saturday.date), 'irn', 'oslo', sunday);
  const isha = schedule.find((entry) => entry.name === 'isha');
  assert.ok(isha?.end);
  assert.equal(iso(isha.date), '2026-10-24T17:30');
  assert.equal(iso(isha.end.date), '2026-10-25T04:08');
  assert.equal(isha.end.date.getTime() - isha.date.getTime(), (10 * 60 + 38) * 60_000);
});

test('Every prayer on the change day lands in winter time', () => {
  const schedule = buildDaySchedule(sunday, parseDayKey(sunday.date), 'irn', 'oslo');
  const instants = Object.fromEntries(schedule.map((entry) => [entry.name, iso(entry.date)]));
  assert.deepEqual(instants, {
    fajr: '2026-10-25T04:08',
    fajr_endtime: '2026-10-25T06:13',
    duhr: '2026-10-25T10:55',
    asr: '2026-10-25T13:00',
    maghrib: '2026-10-25T15:38',
    isha: '2026-10-25T17:28',
  });
});

test('Next prayer during the repeated hour is Fajr, with Isha still running', () => {
  const today = buildDaySchedule(sunday, parseDayKey(sunday.date), 'irn', 'oslo');
  const yesterday = buildDaySchedule(saturday, parseDayKey(saturday.date), 'irn', 'oslo', sunday);
  const repeatedHour = new Date('2026-10-25T01:30Z');
  const result = findNextPrayer(today, [], repeatedHour, yesterday);
  assert.equal(result?.next.name, 'fajr');
  assert.equal(result?.current?.name, 'isha');
  assert.equal(result.next.date.getTime() - repeatedHour.getTime(), (2 * 60 + 38) * 60_000);
});
