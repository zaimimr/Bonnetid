import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Mosque, MosqueJamat } from '../api/types.ts';
import { mosqueJamatForDate } from './prayerSchedule.ts';

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
