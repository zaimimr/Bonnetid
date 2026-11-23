import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Mosque, MosqueJamat, PrayerDay } from '../../src/api/types.ts';
import { osloWallClockToDate } from '../../src/lib/time.ts';
import { buildTvDay, jummahInstants, nowAndNext, pickScreen, type TvState } from './tvModel.ts';

function day(date: string): PrayerDay {
  return {
    location: 'NO0301',
    date,
    kommune: 'Oslo',
    hijri_date: '',
    fajr: '06:05',
    fajr_endtime: '08:23',
    shuruq_sunrise: '08:23',
    istiwa_noon: '12:10',
    duhr: '12:16',
    asr: '13:41',
    shadow_1x: '13:41',
    shadow_2x: '14:10',
    wusta_noon_sunset: null,
    asr_endtime: null,
    ghrub_sunset: '15:10',
    maghrib: '15:15',
    isha: '17:12',
    muntasafallayl_midnight: null,
  };
}

const jamat: MosqueJamat = {
  mosque: '1',
  start_date: '2026-01-01',
  end_date: '2027-12-31',
  fajr: '06:30',
  duhr: '12:45',
  asr: '14:00',
  maghrib: null,
  isha: '18:30',
  fajr_offset: null,
  duhr_offset: null,
  asr_offset: null,
  maghrib_offset: 10,
  isha_offset: null,
  jummah: [
    { id: 1, mosque: '1', jummah: '13:15' },
    { id: 2, mosque: '1', jummah: '14:15' },
  ],
};

const mosque = { asr_method: 'IRN', show_eid: false, eid_prayers: [], jamat, jummah: [] } as unknown as Mosque;

function state(clock: string, iso = '2026-11-23', extra: Partial<TvState> = {}): TvState {
  const [y, m, d] = iso.split('-');
  const key = (offset: number) => {
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d) + offset));
    return `${String(date.getUTCDate()).padStart(2, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${date.getUTCFullYear()}`;
  };
  const build = (offset: number) => buildTvDay(day(key(offset)), day(key(offset + 1)), mosque, [jamat], []);
  return {
    now: osloWallClockToDate(iso, clock),
    yesterday: build(-1),
    today: build(0),
    tomorrow: build(1),
    jummah: jummahInstants(mosque, [jamat], iso),
    ramadanDay: null,
    eidPrayers: [],
    duaUntil: null,
    ...extra,
  };
}

test('jamat follows the fixed column, then adhan plus offset', () => {
  const today = state('10:00').today;
  const clock = (name: string) => today.prayers.find((p) => p.name === name)?.iqamah?.toISOString();
  assert.equal(clock('asr'), osloWallClockToDate('2026-11-23', '14:00').toISOString());
  assert.equal(clock('maghrib'), osloWallClockToDate('2026-11-23', '15:25').toISOString());
});

test('ordinary daytime shows the base screen', () => {
  assert.equal(pickScreen(state('10:00'), 'main'), 'main');
  assert.equal(pickScreen(state('10:00'), 'rad'), 'rad');
  assert.equal(pickScreen(state('10:00'), 'lobby'), 'lobby');
});

test('iqamah countdown starts ten minutes before iqamah', () => {
  assert.equal(pickScreen(state('13:49'), 'main'), 'main');
  assert.equal(pickScreen(state('13:51'), 'main'), 'iqamah');
  assert.equal(pickScreen(state('14:00'), 'main'), 'main');
});

test('plakat never switches away by itself', () => {
  assert.equal(pickScreen(state('13:55'), 'plakat'), 'plakat');
  assert.equal(pickScreen(state('23:00'), 'plakat'), 'plakat');
});

test('Isha lasts until Fajr: night screen from after Isha iqamah until Fajr azan', () => {
  assert.equal(pickScreen(state('18:45'), 'main'), 'main');
  assert.equal(pickScreen(state('19:05'), 'main'), 'hvile');
  assert.equal(pickScreen(state('03:00'), 'main'), 'hvile');
  assert.equal(pickScreen(state('06:10'), 'main'), 'main');
  const late = nowAndNext(state('23:40'));
  assert.equal(late.current?.name, 'isha');
  assert.equal(late.next?.name, 'fajr');
  assert.equal(late.nextIsTomorrow, true);
  const early = nowAndNext(state('03:00'));
  assert.equal(early.current?.name, 'isha');
  assert.equal(early.next?.name, 'fajr');
  assert.equal(early.nextIsTomorrow, false);
});

test('Fajr stops being current when Fajr ends', () => {
  assert.equal(nowAndNext(state('07:00')).current?.name, 'fajr');
  assert.equal(nowAndNext(state('09:00')).current, null);
});

test('Friday shows Jumuah from sunrise until half an hour after the last Jumuah', () => {
  const friday = '2026-11-27';
  assert.equal(pickScreen(state('06:25', friday), 'main'), 'iqamah');
  assert.equal(pickScreen(state('07:00', friday), 'main'), 'main');
  assert.equal(pickScreen(state('09:00', friday), 'main'), 'jumuah');
  assert.equal(pickScreen(state('12:40', friday), 'main'), 'jumuah');
  assert.equal(pickScreen(state('13:55', friday), 'main'), 'iqamah');
  assert.equal(pickScreen(state('14:40', friday), 'main'), 'jumuah');
  assert.equal(pickScreen(state('14:50', friday), 'main'), 'main');
});

test('Ramadan: iftar screen from Asr, taraweeh after Maghrib, night after taraweeh', () => {
  const ramadan = { ramadanDay: 10 };
  assert.equal(pickScreen(state('12:00', '2026-11-23', ramadan), 'main'), 'main');
  assert.equal(pickScreen(state('14:30', '2026-11-23', ramadan), 'main'), 'ramadan');
  assert.equal(pickScreen(state('15:30', '2026-11-23', ramadan), 'main'), 'taraweeh');
  assert.equal(pickScreen(state('20:00', '2026-11-23', ramadan), 'main'), 'taraweeh');
  assert.equal(pickScreen(state('20:20', '2026-11-23', ramadan), 'main'), 'hvile');
});

test('a pressed taraweeh pause shows the dua until it times out', () => {
  const until = osloWallClockToDate('2026-11-23', '19:30');
  assert.equal(pickScreen(state('19:28', '2026-11-23', { ramadanDay: 10, duaUntil: until }), 'main'), 'dua');
  assert.equal(pickScreen(state('19:31', '2026-11-23', { ramadanDay: 10, duaUntil: until }), 'main'), 'taraweeh');
});

test('Eid morning wins until half an hour after the last Eid prayer', () => {
  const eidPrayers = ['08:00', '09:00'].map((time) => osloWallClockToDate('2026-11-23', time));
  assert.equal(pickScreen(state('07:12', '2026-11-23', { eidPrayers }), 'main'), 'eid');
  assert.equal(pickScreen(state('09:25', '2026-11-23', { eidPrayers }), 'main'), 'eid');
  assert.equal(pickScreen(state('09:35', '2026-11-23', { eidPrayers }), 'main'), 'main');
});
