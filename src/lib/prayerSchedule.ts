import type { PrayerDay } from '@/api/types';
import type { AsrMethodPreference } from '@/store/settings';
import { addMinutesToTime, parseTimeToDate } from './time';

export type PrayerName = 'fajr' | 'shuruq' | 'duhr' | 'asr' | 'maghrib' | 'isha';

export type PrayerWindowEnd = {
  label: string;
  date: Date;
};

export type PrayerEntry = {
  name: PrayerName;
  label: string;
  time: string;
  date: Date;
  isPrayer: boolean;
  end: PrayerWindowEnd | null;
};

export const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: 'Fajr',
  shuruq: 'Soloppgang',
  duhr: 'Duhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

function asrTimeFor(day: PrayerDay, method: AsrMethodPreference): string | null {
  const preferred = method === 'shadow_2x' ? day.shadow_2x : day.shadow_1x;
  return preferred ?? day.asr;
}

export function buildDaySchedule(
  day: PrayerDay,
  baseDate: Date,
  asrMethod: AsrMethodPreference,
): PrayerEntry[] {
  const source: { name: PrayerName; time: string | null; isPrayer: boolean }[] = [
    { name: 'fajr', time: day.fajr, isPrayer: true },
    { name: 'shuruq', time: day.shuruq_sunrise, isPrayer: false },
    { name: 'duhr', time: day.duhr, isPrayer: true },
    { name: 'asr', time: asrTimeFor(day, asrMethod), isPrayer: true },
    { name: 'maghrib', time: day.maghrib, isPrayer: true },
    { name: 'isha', time: day.isha, isPrayer: true },
  ];

  const entries = source
    .filter((entry): entry is { name: PrayerName; time: string; isPrayer: boolean } => entry.time != null)
    .map((entry) => ({
      name: entry.name,
      label: PRAYER_LABELS[entry.name],
      time: entry.time,
      date: parseTimeToDate(entry.time, baseDate),
      isPrayer: entry.isPrayer,
      end: null as PrayerWindowEnd | null,
    }));

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry.name === 'isha') {
      entry.end = midnightEnd(day, entry.date, baseDate);
      continue;
    }
    if (!entry.isPrayer) continue;
    if (entry.name === 'fajr') {
      const sunrise = day.shuruq_sunrise ?? day.fajr_endtime;
      if (sunrise) {
        entry.end = { label: PRAYER_LABELS.shuruq, date: parseTimeToDate(sunrise, baseDate) };
        continue;
      }
    }
    const boundary = entries[index + 1];
    if (boundary) entry.end = { label: boundary.label, date: boundary.date };
  }

  return entries;
}

function midnightEnd(day: PrayerDay, ishaDate: Date, baseDate: Date): PrayerWindowEnd | null {
  if (!day.muntasafallayl_midnight) return null;
  const date = parseTimeToDate(day.muntasafallayl_midnight, baseDate);
  if (date.getTime() <= ishaDate.getTime()) date.setDate(date.getDate() + 1);
  return { label: 'Midnatt', date };
}

export type JamatTimes = Partial<Record<PrayerName, string>>;

export type AdhanTimes = Partial<Record<PrayerName, string>>;

type JamatSource = {
  start_date: string | null;
  end_date: string | null;
  fajr: string | null;
  duhr: string | null;
  asr: string | null;
  maghrib: string | null;
  isha: string | null;
  fajr_offset?: number | null;
  duhr_offset?: number | null;
  asr_offset?: number | null;
  maghrib_offset?: number | null;
  isha_offset?: number | null;
};

export function findJamatPeriod<T extends JamatSource>(
  periods: T[] | undefined,
  isoDate: string,
): T | null {
  if (!periods) return null;
  return (
    periods.find(
      (period) =>
        (!period.start_date || isoDate >= period.start_date) &&
        (!period.end_date || isoDate <= period.end_date),
    ) ?? null
  );
}

export function adhanTimesFromSchedule(entries: PrayerEntry[]): AdhanTimes {
  const times: AdhanTimes = {};
  for (const entry of entries) {
    times[entry.name] = entry.time;
  }
  return times;
}

function resolveJamatTime(
  fixed: string | null,
  offset: number | null | undefined,
  adhan: string | undefined,
): string | undefined {
  if (offset && adhan) return addMinutesToTime(adhan, offset);
  return fixed ?? undefined;
}

export function jamatTimesForDate(
  jamat: JamatSource | null | undefined,
  isoDate: string,
  adhan: AdhanTimes = {},
): JamatTimes {
  if (!jamat) return {};
  if (jamat.start_date && isoDate < jamat.start_date) return {};
  if (jamat.end_date && isoDate > jamat.end_date) return {};
  return {
    fajr: resolveJamatTime(jamat.fajr, jamat.fajr_offset, adhan.fajr),
    duhr: resolveJamatTime(jamat.duhr, jamat.duhr_offset, adhan.duhr),
    asr: resolveJamatTime(jamat.asr, jamat.asr_offset, adhan.asr),
    maghrib: resolveJamatTime(jamat.maghrib, jamat.maghrib_offset, adhan.maghrib),
    isha: resolveJamatTime(jamat.isha, jamat.isha_offset, adhan.isha),
  };
}

export type NextPrayerResult = {
  next: PrayerEntry;
  current: PrayerEntry | null;
  isTomorrow: boolean;
};

function currentWithinWindow(passed: PrayerEntry[], now: Date): PrayerEntry | null {
  const last = passed.length > 0 ? passed[passed.length - 1] : null;
  if (!last) return null;
  if (last.end && now.getTime() >= last.end.date.getTime()) return null;
  return last;
}

export function findNextPrayer(
  today: PrayerEntry[],
  tomorrow: PrayerEntry[],
  now: Date,
): NextPrayerResult | null {
  const prayersToday = today.filter((entry) => entry.isPrayer);
  const upcoming = prayersToday.find((entry) => entry.date.getTime() > now.getTime());
  const passed = prayersToday.filter((entry) => entry.date.getTime() <= now.getTime());
  const current = currentWithinWindow(passed, now);

  if (upcoming) {
    return { next: upcoming, current, isTomorrow: false };
  }

  const firstTomorrow = tomorrow.find((entry) => entry.isPrayer);
  if (!firstTomorrow) return null;

  return { next: firstTomorrow, current, isTomorrow: true };
}
