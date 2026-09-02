import type { PrayerEntry } from './prayerSchedule';

/** The activity appears this long before a prayer starts. */
export const ACTIVITY_LEAD_MS = 10 * 60 * 1000;
/** ...and stays this long after it has started, then goes away. */
export const ACTIVITY_TAIL_MS = 30 * 60 * 1000;

export type ActivityWindow = {
  prayer: PrayerEntry;
  /** True once the prayer time has passed: counting up instead of down. */
  isNow: boolean;
  /** Bounds of the phase being shown, for the progress bar. */
  phaseStart: Date;
  phaseEnd: Date;
  /** When the activity should be off the screen entirely. */
  dismissAt: Date;
};

/**
 * The Live Activity is only meaningful right around a prayer, so it runs from ten minutes
 * before until thirty minutes after - and only for the five prayers, never for sunrise.
 */
export function resolveActivityWindow(
  entries: PrayerEntry[],
  now: Date,
): ActivityWindow | null {
  const prayers = entries
    .filter((entry) => entry.isPrayer)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const time = now.getTime();

  // A prayer that has already started wins over one that is merely approaching: in the far
  // north maghrib and isha can be close enough for the two windows to touch.
  for (let index = prayers.length - 1; index >= 0; index -= 1) {
    const prayer = prayers[index];
    const start = prayer.date.getTime();
    if (time >= start && time - start <= ACTIVITY_TAIL_MS) {
      return {
        prayer,
        isNow: true,
        phaseStart: prayer.date,
        phaseEnd: new Date(start + ACTIVITY_TAIL_MS),
        dismissAt: new Date(start + ACTIVITY_TAIL_MS),
      };
    }
  }

  const upcoming = prayers.find((prayer) => {
    const start = prayer.date.getTime();
    return start > time && start - time <= ACTIVITY_LEAD_MS;
  });

  if (!upcoming) return null;

  return {
    prayer: upcoming,
    isNow: false,
    phaseStart: new Date(upcoming.date.getTime() - ACTIVITY_LEAD_MS),
    phaseEnd: upcoming.date,
    dismissAt: new Date(upcoming.date.getTime() + ACTIVITY_TAIL_MS),
  };
}
