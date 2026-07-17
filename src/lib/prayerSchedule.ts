import type { PrayerDay } from '@/api/types';
import type { AsrMethodPreference } from '@/store/settings';
import { parseTimeToDate } from './time';

export type PrayerName = 'fajr' | 'shuruq' | 'duhr' | 'asr' | 'maghrib' | 'isha';

export type PrayerEntry = {
  name: PrayerName;
  label: string;
  time: string;
  date: Date;
  isPrayer: boolean;
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

  return source
    .filter((entry): entry is { name: PrayerName; time: string; isPrayer: boolean } => entry.time != null)
    .map((entry) => ({
      name: entry.name,
      label: PRAYER_LABELS[entry.name],
      time: entry.time,
      date: parseTimeToDate(entry.time, baseDate),
      isPrayer: entry.isPrayer,
    }));
}

export type NextPrayerResult = {
  next: PrayerEntry;
  current: PrayerEntry | null;
  isTomorrow: boolean;
};

export function findNextPrayer(
  today: PrayerEntry[],
  tomorrow: PrayerEntry[],
  now: Date,
): NextPrayerResult | null {
  const prayersToday = today.filter((entry) => entry.isPrayer);
  const upcoming = prayersToday.find((entry) => entry.date.getTime() > now.getTime());

  if (upcoming) {
    const passed = prayersToday.filter((entry) => entry.date.getTime() <= now.getTime());
    return {
      next: upcoming,
      current: passed.length > 0 ? passed[passed.length - 1] : null,
      isTomorrow: false,
    };
  }

  const firstTomorrow = tomorrow.find((entry) => entry.isPrayer);
  if (!firstTomorrow) return null;

  return {
    next: firstTomorrow,
    current: prayersToday.length > 0 ? prayersToday[prayersToday.length - 1] : null,
    isTomorrow: true,
  };
}
