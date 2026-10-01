import type { PrayerDay } from '@/api/types';
import { formatZonedClock, wallClockToDate, type PrayerTimeZone } from './time';

export type ExtraTimeName = 'duha' | 'midnight' | 'tahajjud';

export type ExtraTime = {
  name: ExtraTimeName;
  label: string;
  note: string;
  time: string;
  date: Date;
};

export const DUHA_AFTER_SUNRISE_MINUTES = 20;

const MINUTE_MS = 60 * 1000;
const HALF_DAY_MS = 12 * 60 * MINUTE_MS;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function buildExtraTimes(
  day: PrayerDay,
  baseDate: Date,
  zone: PrayerTimeZone = 'oslo',
  nextDay?: PrayerDay | null,
): ExtraTime[] {
  const at = (clock: string | null, date = baseDate) =>
    clock ? wallClockToDate(date, clock, zone) : null;

  const sunrise = at(day.shuruq_sunrise ?? day.fajr_endtime);
  const noon = at(day.istiwa_noon ?? day.duhr);
  const maghrib = at(day.maghrib);
  const nextFajr = at(nextDay?.fajr ?? day.fajr, addDays(baseDate, 1));

  const entries: Omit<ExtraTime, 'time'>[] = [];

  if (sunrise) {
    entries.push({
      name: 'duha',
      label: 'Duha',
      note: `Fra ${DUHA_AFTER_SUNRISE_MINUTES} min etter soloppgang til like før middag`,
      date: new Date(sunrise.getTime() + DUHA_AFTER_SUNRISE_MINUTES * MINUTE_MS),
    });
  }

  if (noon) {
    entries.push({
      name: 'midnight',
      label: 'Midnatt',
      note: '12 timer etter middag',
      date: new Date(noon.getTime() + HALF_DAY_MS),
    });
  }

  if (maghrib && nextFajr && nextFajr.getTime() > maghrib.getTime()) {
    const night = nextFajr.getTime() - maghrib.getTime();
    entries.push({
      name: 'tahajjud',
      label: 'Tahajjud',
      note: 'Siste tredjedel av natten, frem til Fajr',
      date: new Date(maghrib.getTime() + Math.round((night * 2) / 3)),
    });
  }

  return entries
    .map((entry) => ({ ...entry, time: formatZonedClock(entry.date, zone) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
