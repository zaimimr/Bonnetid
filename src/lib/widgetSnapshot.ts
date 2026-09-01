import type { PrayerEntry } from './prayerSchedule';
import { isoDateKey } from './time';

export const SNAPSHOT_VERSION = 1;

export type SnapshotDayInput = {
  date: Date;
  schedule: PrayerEntry[];
  hijriText: string;
  jamatTimes?: Partial<Record<string, string>>;
};

export type SnapshotInput = {
  locationName: string;
  mosqueName?: string | null;
  generatedAt: Date;
  days: SnapshotDayInput[];
};

export type SnapshotPrayer = {
  kind: string;
  label: string;
  at: string;
  isPrayer: boolean;
  jamat: string | null;
};

export type SnapshotDay = {
  date: string;
  hijriText: string;
  prayers: SnapshotPrayer[];
};

export type Snapshot = {
  version: number;
  generatedAt: string;
  locationName: string;
  mosqueName: string | null;
  days: SnapshotDay[];
};

/** `HH:MM` on the given calendar day, as an absolute instant in the device's zone. */
function jamatInstant(day: Date, time: string | undefined): string | null {
  if (!time) return null;
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const date = new Date(day);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

/**
 * The single payload every widget surface reads. Times are absolute instants so the widget
 * never has to know the app's date formats or the user's time zone rules.
 */
export function buildSnapshot(input: SnapshotInput): Snapshot {
  return {
    version: SNAPSHOT_VERSION,
    generatedAt: input.generatedAt.toISOString(),
    locationName: input.locationName,
    mosqueName: input.mosqueName ?? null,
    days: input.days.map((day) => ({
      date: isoDateKey(day.date),
      hijriText: day.hijriText,
      prayers: day.schedule.map((entry) => ({
        kind: entry.name,
        label: entry.label,
        at: entry.date.toISOString(),
        isPrayer: entry.isPrayer,
        jamat: jamatInstant(day.date, day.jamatTimes?.[entry.name]),
      })),
    })),
  };
}

export function snapshotIsEmpty(snapshot: Snapshot): boolean {
  return snapshot.days.every((day) => day.prayers.length === 0);
}
