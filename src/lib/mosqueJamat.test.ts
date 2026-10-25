import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Mosque, MosqueJamat } from '../api/types.ts';
import { jamatTimesForDate, mosqueJamatForDate } from './prayerSchedule.ts';
import { osloTimeToLocalClock } from './time.ts';

function period(start: string, end: string, duhr: string, jummah: string[] = []): MosqueJamat {
  return {
    mosque: '971258470',
    start_date: start,
    end_date: end,
    fajr: '06:30',
    duhr,
    asr: null,
    maghrib: null,
    isha: null,
    fajr_offset: null,
    duhr_offset: null,
    asr_offset: null,
    maghrib_offset: null,
    isha_offset: null,
    jummah: jummah.map((time, id) => ({ id, mosque: '971258470', jummah: time })),
  };
}

const lastWeek = period('2026-10-16', '2026-10-24', '14:30', ['14:30']);
const thisWeek = period('2026-10-25', '2026-10-29', '13:30', ['13:30']);
const cached = { jamat: lastWeek, jummah: lastWeek.jummah } as unknown as Mosque;

test('mosqueJamatForDate picks the period for the date, not the cached one', () => {
  const { jamat, jummah } = mosqueJamatForDate(cached, [lastWeek, thisWeek], '2026-10-25');
  assert.equal(jamat?.duhr, '13:30');
  assert.deepEqual(
    jummah.map((entry) => entry.jummah),
    ['13:30'],
  );
});

test('mosqueJamatForDate falls back to the mosque before periods load', () => {
  assert.equal(mosqueJamatForDate(cached, undefined, '2026-10-20').jamat?.duhr, '14:30');
});

test('jamatTimesForDate keeps fixed times when the offset is 0 and adds non-zero offsets to adhan', () => {
  const jamat = {
    ...thisWeek,
    asr: '14:50',
    fajr_offset: 0,
    duhr_offset: 0,
    asr_offset: 0,
    maghrib_offset: 1,
    isha_offset: 10,
  };
  const adhan = { fajr: '05:17', duhr: '12:07', asr: '14:42', maghrib: '16:46', isha: '18:37' };
  assert.deepEqual(jamatTimesForDate(jamat, '2026-10-25', adhan), {
    fajr: osloTimeToLocalClock('2026-10-25', '06:30'),
    duhr: osloTimeToLocalClock('2026-10-25', '13:30'),
    asr: osloTimeToLocalClock('2026-10-25', '14:50'),
    maghrib: '16:47',
    isha: '18:47',
  });
});

test('jamatTimesForDate uses the adhan time for a 0 offset without a fixed time', () => {
  const jamat = { ...thisWeek, maghrib_offset: 0 };
  assert.equal(jamatTimesForDate(jamat, '2026-10-25', { maghrib: '16:46' }).maghrib, '16:46');
});

test('jamatTimesForDate follows the bonnetider.eu rule for every fixed and offset combination', () => {
  const adhan = { maghrib: '16:46' };
  const fixed = osloTimeToLocalClock('2026-10-25', '17:00') ?? undefined;
  const cases: [string | null, number | null, string | undefined][] = [
    ['17:00', null, fixed],
    ['17:00', 0, fixed],
    ['17:00', 5, fixed],
    [null, 5, '16:51'],
    [null, 0, '16:46'],
    [null, null, undefined],
  ];
  for (const [maghrib, maghrib_offset, expected] of cases) {
    const jamat = { ...thisWeek, maghrib, maghrib_offset };
    assert.equal(
      jamatTimesForDate(jamat, '2026-10-25', adhan).maghrib,
      expected,
      `fixed ${maghrib}, offset ${maghrib_offset}`,
    );
  }
});
