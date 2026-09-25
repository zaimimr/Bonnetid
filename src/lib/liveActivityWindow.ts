import { statusOf, type PrayerLog } from './prayerLog';
import type { PrayerEntry } from './prayerSchedule';

export type ActivityDay = {
  isoDate: string;
  schedule: PrayerEntry[];
};

export type ActivityNext = {
  isoDate: string;
  prayer: PrayerEntry;
  windowEnd: Date;
};

export type ActivityWindow = {
  isoDate: string;
  prayer: PrayerEntry;
  windowEnd: Date;
  inWindow: boolean;
  windowOver: boolean;
  next: ActivityNext | null;
};

type Slot = { isoDate: string; entry: PrayerEntry };

const FALLBACK_WINDOW_MS = 12 * 60 * 60 * 1000;

function windowEndOf(slots: Slot[], index: number): Date {
  const { entry } = slots[index];
  const successor = slots[index + 1]?.entry.date ?? null;
  return entry.end?.date ?? successor ?? new Date(entry.date.getTime() + FALLBACK_WINDOW_MS);
}

/**
 * The Live Activity follows the prayer the user is in the middle of: it appears the moment a
 * prayer starts and goes away once the user marks the prayer or its window ends. Sunrise never
 * gets one.
 *
 * The successor rides along so the activity can carry itself one prayer further than the app
 * managed to push. Only an unmarked successor counts: a marked one is a prayer the app would
 * have retired the activity over anyway.
 */
export function resolveActivityWindow(
  days: ActivityDay[],
  log: PrayerLog,
  now: Date,
): ActivityWindow | null {
  const prayers: Slot[] = days
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

  const windowEnd = windowEndOf(prayers, index);
  const inWindow = time < windowEnd.getTime();

  const successor = prayers[index + 1] ?? null;
  const next =
    successor && statusOf(log, successor.isoDate, successor.entry.name) === null
      ? {
          isoDate: successor.isoDate,
          prayer: successor.entry,
          windowEnd: windowEndOf(prayers, index + 1),
        }
      : null;

  return { isoDate, prayer: entry, windowEnd, inWindow, windowOver: !inWindow, next };
}
