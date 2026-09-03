import { statusOf, type PrayerLog } from './prayerLog';
import type { PrayerEntry } from './prayerSchedule';

export type ActivityDay = {
  isoDate: string;
  schedule: PrayerEntry[];
};

export type ActivityWindow = {
  isoDate: string;
  prayer: PrayerEntry;
  windowEnd: Date;
  inWindow: boolean;
  windowOver: boolean;
};

const FALLBACK_WINDOW_MS = 12 * 60 * 60 * 1000;

/**
 * The Live Activity follows the prayer the user is in the middle of: it appears the moment a
 * prayer starts, survives the end of its window, and only goes away once the user marks the
 * prayer or the next one takes over. Sunrise never gets one.
 */
export function resolveActivityWindow(
  days: ActivityDay[],
  log: PrayerLog,
  now: Date,
): ActivityWindow | null {
  const prayers = days
    .flatMap((day) =>
      day.schedule
        .filter((entry) => entry.isPrayer)
        .map((entry) => ({ isoDate: day.isoDate, entry })),
    )
    .sort((a, b) => a.entry.date.getTime() - b.entry.date.getTime());

  const time = now.getTime();
  let index = -1;
  for (let position = 0; position < prayers.length; position += 1) {
    if (prayers[position].entry.date.getTime() > time) break;
    index = position;
  }
  if (index < 0) return null;

  const { isoDate, entry } = prayers[index];
  if (statusOf(log, isoDate, entry.name) !== null) return null;

  const successor = prayers[index + 1]?.entry.date ?? null;
  const windowEnd =
    entry.end?.date ?? successor ?? new Date(entry.date.getTime() + FALLBACK_WINDOW_MS);
  const inWindow = time < windowEnd.getTime();

  return { isoDate, prayer: entry, windowEnd, inWindow, windowOver: !inWindow };
}
