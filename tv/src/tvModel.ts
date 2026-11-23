import type { HijriDay, Mosque, MosqueJamat, PrayerDay } from '../../src/api/types.ts';
import { parseHijriDate } from '../../src/lib/hijri.ts';
import {
  adhanTimesFromSchedule,
  buildDaySchedule,
  jamatTimesForDate,
  mosqueJamatForDate,
  type PrayerName,
} from '../../src/lib/prayerSchedule.ts';
import { osloWallClockToDate, parseDayKey } from '../../src/lib/time.ts';

export type ScreenId =
  | 'main'
  | 'lobby'
  | 'plakat'
  | 'rad'
  | 'iqamah'
  | 'jumuah'
  | 'ramadan'
  | 'taraweeh'
  | 'dua'
  | 'hvile'
  | 'eid';

export type BaseScreen = 'main' | 'lobby' | 'plakat' | 'rad';

export type TvPrayer = {
  name: PrayerName;
  label: string;
  isPrayer: boolean;
  azan: Date;
  iqamah: Date | null;
};

export type TvDay = {
  iso: string;
  prayers: TvPrayer[];
  hijri: HijriDay | null;
};

export type TvState = {
  now: Date;
  yesterday: TvDay | null;
  today: TvDay;
  tomorrow: TvDay | null;
  jummah: Date[];
  ramadanDay: number | null;
  eidPrayers: Date[];
  duaUntil: Date | null;
};

const MINUTE = 60_000;
export const IQAMAH_LEAD_MINUTES = 10;
export const NIGHT_AFTER_ISHA_IQAMAH_MINUTES = 30;
export const TARAWEEH_AFTER_ISHA_MINUTES = 15;
export const TARAWEEH_LENGTH_MINUTES = 90;
export const EID_GRACE_MINUTES = 30;
export const JUMUAH_GRACE_MINUTES = 30;
export const DUA_SHOW_MINUTES = 4;

type AsrPreference = 'irn' | 'shadow_1x' | 'shadow_2x' | 'wusta';

export function asrPreferenceOf(method: Mosque['asr_method'] | undefined): AsrPreference {
  if (method === 'SHADOW_1X') return 'shadow_1x';
  if (method === 'SHADOW_2X') return 'shadow_2x';
  if (method === 'WUSTA') return 'wusta';
  return 'irn';
}

export function isoOfDayKey(dayKey: string): string {
  const [day, month, year] = dayKey.split('-');
  return `${year}-${month}-${day}`;
}

function localClockToDate(iso: string, clock: string): Date | null {
  const [year, month, day] = iso.split('-').map(Number);
  const [hours, minutes] = clock.split(':').map(Number);
  if ([year, month, day, hours, minutes].some(Number.isNaN)) return null;
  return new Date(year, month - 1, day, hours, minutes);
}

export function buildTvDay(
  day: PrayerDay,
  nextDay: PrayerDay | null,
  mosque: Mosque | undefined,
  periods: MosqueJamat[] | undefined,
  hijriRows: HijriDay[],
): TvDay {
  const iso = isoOfDayKey(day.date);
  const entries = buildDaySchedule(day, parseDayKey(day.date), asrPreferenceOf(mosque?.asr_method), 'oslo', nextDay);
  const { jamat, jummah } = mosqueJamatForDate(mosque, periods, iso);
  const jamatTimes = jamatTimesForDate(jamat, iso, adhanTimesFromSchedule(entries), jummah, null);
  const prayers = entries.map((entry) => {
    const iqamah = entry.isPrayer ? jamatTimes[entry.name] : undefined;
    return {
      name: entry.name,
      label: entry.label,
      isPrayer: entry.isPrayer,
      azan: entry.date,
      iqamah: iqamah ? localClockToDate(iso, iqamah) : null,
    };
  });
  return { iso, prayers, hijri: hijriRows.find((row) => row.gregorian_date === iso) ?? null };
}

export function jummahInstants(mosque: Mosque | undefined, periods: MosqueJamat[] | undefined, iso: string): Date[] {
  const [year, month, day] = iso.split('-').map(Number);
  if (new Date(Date.UTC(year, month - 1, day)).getUTCDay() !== 5) return [];
  return mosqueJamatForDate(mosque, periods, iso)
    .jummah.map((entry) => osloWallClockToDate(iso, entry.jummah))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
}

export function eidPrayersOn(mosque: Mosque | undefined, day: TvDay): Date[] {
  const hijri = day.hijri ? parseHijriDate(day.hijri.hijri_date) : null;
  const isEid = hijri != null && ((hijri.month === 10 && hijri.day === 1) || (hijri.month === 12 && hijri.day === 10));
  if (!isEid || !mosque?.show_eid) return [];
  return mosque.eid_prayers
    .map((time) => osloWallClockToDate(day.iso, time))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
}

export function ramadanDayOf(day: TvDay): number | null {
  const hijri = day.hijri ? parseHijriDate(day.hijri.hijri_date) : null;
  return hijri?.month === 9 ? hijri.day : null;
}

function prayer(day: TvDay | null, name: PrayerName): TvPrayer | null {
  return day?.prayers.find((entry) => entry.name === name) ?? null;
}

function at(entry: TvPrayer | null): Date | null {
  return entry ? (entry.iqamah ?? entry.azan) : null;
}

function plus(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * MINUTE);
}

export function taraweehStart(day: TvDay): Date | null {
  const isha = at(prayer(day, 'isha'));
  return isha ? plus(isha, TARAWEEH_AFTER_ISHA_MINUTES) : null;
}

export function upcomingIqamah(state: TvState): TvPrayer | null {
  const now = state.now.getTime();
  return (
    state.today.prayers.find((entry) => {
      if (!entry.iqamah || entry.azan.getTime() > now) return false;
      const left = entry.iqamah.getTime() - now;
      return left > 0 && left <= IQAMAH_LEAD_MINUTES * MINUTE;
    }) ?? null
  );
}

export function nightEnd(state: TvState): TvPrayer | null {
  const now = state.now.getTime();
  const fajrToday = prayer(state.today, 'fajr');
  if (fajrToday && now < fajrToday.azan.getTime()) return fajrToday;
  return prayer(state.tomorrow, 'fajr');
}

export function isNight(state: TvState): boolean {
  const now = state.now.getTime();
  const fajr = prayer(state.today, 'fajr');
  if (fajr && now < fajr.azan.getTime()) return true;
  const isha = prayer(state.today, 'isha');
  if (!isha) return false;
  const after = isha.iqamah
    ? plus(isha.iqamah, NIGHT_AFTER_ISHA_IQAMAH_MINUTES)
    : plus(isha.azan, NIGHT_AFTER_ISHA_IQAMAH_MINUTES * 2);
  const start = state.ramadanDay != null ? plus(taraweehStart(state.today) ?? after, TARAWEEH_LENGTH_MINUTES) : after;
  return now >= start.getTime();
}

export function pickScreen(state: TvState, base: BaseScreen): ScreenId {
  const now = state.now.getTime();
  if (state.duaUntil && now < state.duaUntil.getTime()) return 'dua';
  if (base === 'plakat') return 'plakat';

  const lastEid = state.eidPrayers[state.eidPrayers.length - 1];
  const fajr = prayer(state.today, 'fajr');
  if (lastEid && fajr && now >= fajr.azan.getTime() && now < plus(lastEid, EID_GRACE_MINUTES).getTime()) {
    return 'eid';
  }

  const lastJummah = state.jummah[state.jummah.length - 1];
  const sunrise = prayer(state.today, 'fajr_endtime');
  const jumuahOpen =
    lastJummah != null &&
    sunrise != null &&
    now >= sunrise.azan.getTime() &&
    now < plus(lastJummah, JUMUAH_GRACE_MINUTES).getTime();

  const iqamah = upcomingIqamah(state);
  if (iqamah && !(jumuahOpen && iqamah.name === 'duhr')) return 'iqamah';
  if (jumuahOpen) return 'jumuah';

  if (state.ramadanDay != null) {
    const asr = prayer(state.today, 'asr');
    const maghrib = prayer(state.today, 'maghrib');
    const maghribDone = at(maghrib);
    if (asr && maghrib && maghribDone && now >= asr.azan.getTime() && now < maghribDone.getTime()) {
      return 'ramadan';
    }
    const start = taraweehStart(state.today);
    if (maghribDone && start && now >= maghribDone.getTime() && now < plus(start, TARAWEEH_LENGTH_MINUTES).getTime()) {
      return 'taraweeh';
    }
  }

  if (isNight(state)) return 'hvile';
  return base;
}

export type NowNext = {
  current: TvPrayer | null;
  next: TvPrayer | null;
  nextIsTomorrow: boolean;
};

export function nowAndNext(state: TvState): NowNext {
  const now = state.now.getTime();
  const prayers = state.today.prayers.filter((entry) => entry.isPrayer);
  const next = prayers.find((entry) => entry.azan.getTime() > now) ?? null;
  const passed = prayers.filter((entry) => entry.azan.getTime() <= now);
  let current: TvPrayer | null = passed[passed.length - 1] ?? prayer(state.yesterday, 'isha');
  const sunrise = prayer(state.today, 'fajr_endtime');
  if (current?.name === 'fajr' && sunrise && now >= sunrise.azan.getTime()) current = null;
  if (next) return { current, next, nextIsTomorrow: false };
  const tomorrowFajr = prayer(state.tomorrow, 'fajr');
  return { current, next: tomorrowFajr, nextIsTomorrow: true };
}

export type TaraweehPause = { pause: number; rakat: number; total: number };

export const TARAWEEH_RAKAT = 20;

export function pauseInfo(pauses: number): TaraweehPause {
  const pause = Math.min(Math.max(pauses, 1), TARAWEEH_RAKAT / 4);
  return { pause, rakat: pause * 4, total: TARAWEEH_RAKAT };
}

export function minutesUntil(now: Date, target: Date): number {
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / MINUTE));
}
