import type { PrayerDay } from '@/api/types';
import type { AsrMethodPreference } from '@/store/settings';
import { jummahSlotFor, jummahSlotIsOpen } from './jummah';
import {
  addMinutesToTime,
  formatZonedClock,
  osloTimeToLocalClock,
  wallClockToDate,
  type PrayerTimeZone,
} from './time';

export type PrayerName = 'fajr' | 'fajr_endtime' | 'duhr' | 'asr' | 'maghrib' | 'isha';

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
  fajr_endtime: 'Soloppgang',
  duhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export function asrTimeFor(day: PrayerDay, method: AsrMethodPreference): string | null {
  const preferred =
    method === 'shadow_1x'
      ? day.shadow_1x
      : method === 'shadow_2x'
        ? day.shadow_2x
        : method === 'wusta'
          ? day.wusta_noon_sunset
          : day.asr;
  return preferred ?? day.asr;
}

export function buildDaySchedule(
  day: PrayerDay,
  baseDate: Date,
  asrMethod: AsrMethodPreference,
  zone: PrayerTimeZone = 'oslo',
): PrayerEntry[] {
  const source: { name: PrayerName; time: string | null; isPrayer: boolean }[] = [
    { name: 'fajr', time: day.fajr, isPrayer: true },
    { name: 'fajr_endtime', time: day.fajr_endtime, isPrayer: false },
    { name: 'duhr', time: day.duhr, isPrayer: true },
    { name: 'asr', time: asrTimeFor(day, asrMethod), isPrayer: true },
    { name: 'maghrib', time: day.maghrib, isPrayer: true },
    { name: 'isha', time: day.isha, isPrayer: true },
  ];

  const entries = source
    .filter((entry): entry is { name: PrayerName; time: string; isPrayer: boolean } => entry.time != null)
    .map((entry) => {
      const date = wallClockToDate(baseDate, entry.time, zone);
      return {
        name: entry.name,
        label: PRAYER_LABELS[entry.name],
        time: formatZonedClock(date, zone),
        date,
        isPrayer: entry.isPrayer,
        end: null as PrayerWindowEnd | null,
      };
    });

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry.name === 'isha') {
      entry.end = midnightEnd(day, entry.date, baseDate, zone);
      continue;
    }
    if (!entry.isPrayer) continue;
    if (entry.name === 'fajr') {
      const sunrise = day.fajr_endtime ?? day.shuruq_sunrise;
      if (sunrise) {
        entry.end = {
          label: PRAYER_LABELS.fajr_endtime,
          date: wallClockToDate(baseDate, sunrise, zone),
        };
        continue;
      }
    }
    const boundary = entries[index + 1];
    if (boundary) entry.end = { label: boundary.label, date: boundary.date };
  }

  return entries;
}

function midnightEnd(
  day: PrayerDay,
  ishaDate: Date,
  baseDate: Date,
  zone: PrayerTimeZone,
): PrayerWindowEnd | null {
  if (!day.muntasafallayl_midnight) return null;
  const sameDay = wallClockToDate(baseDate, day.muntasafallayl_midnight, zone);
  if (sameDay.getTime() > ishaDate.getTime()) return { label: 'Midnatt', date: sameDay };

  const nextDay = new Date(baseDate);
  nextDay.setDate(nextDay.getDate() + 1);
  return { label: 'Midnatt', date: wallClockToDate(nextDay, day.muntasafallayl_midnight, zone) };
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
  isoDate: string,
  fixed: string | null,
  offset: number | null | undefined,
  adhan: string | undefined,
): string | undefined {
  if (offset != null && adhan) return addMinutesToTime(adhan, offset);
  if (!fixed) return undefined;
  return osloTimeToLocalClock(isoDate, fixed) ?? undefined;
}

export function jamatTimesForDate(
  jamat: JamatSource | null | undefined,
  isoDate: string,
  adhan: AdhanTimes = {},
  jummah: { jummah: string }[] = [],
  now?: Date | null,
): JamatTimes {
  const withinPeriod =
    jamat != null &&
    (!jamat.start_date || isoDate >= jamat.start_date) &&
    (!jamat.end_date || isoDate <= jamat.end_date);

  const times: JamatTimes = withinPeriod
    ? {
        fajr: resolveJamatTime(isoDate, jamat.fajr, jamat.fajr_offset, adhan.fajr),
        duhr: resolveJamatTime(isoDate, jamat.duhr, jamat.duhr_offset, adhan.duhr),
        asr: resolveJamatTime(isoDate, jamat.asr, jamat.asr_offset, adhan.asr),
        maghrib: resolveJamatTime(isoDate, jamat.maghrib, jamat.maghrib_offset, adhan.maghrib),
        isha: resolveJamatTime(isoDate, jamat.isha, jamat.isha_offset, adhan.isha),
      }
    : {};

  const slot = jummahSlotFor(isoDate, jummah);
  if (slot && jummahSlotIsOpen(slot, now)) {
    times.duhr = slot.at;
  }

  return times;
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

  const prayersTomorrow = tomorrow.filter((entry) => entry.isPrayer);
  const firstTomorrow =
    prayersTomorrow.find((entry) => entry.date.getTime() > now.getTime()) ?? prayersTomorrow[0];
  if (!firstTomorrow) return null;

  return { next: firstTomorrow, current, isTomorrow: true };
}
