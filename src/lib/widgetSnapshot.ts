import type { PrayerEntry } from './prayerSchedule';
import { isoDateKey, localClockNear } from './time';

export const SNAPSHOT_VERSION = 1;
const FRIDAY = 5;

export type SnapshotDayInput = {
  date: Date;
  schedule: PrayerEntry[];
  hijriText: string;
  jamatTimes?: Partial<Record<string, string>>;
  /** True when the mosque has a jummah time for this Friday. */
  hasJummah?: boolean;
};

export type SnapshotInput = {
  locationName: string;
  mosqueName?: string | null;
  showJamat?: boolean;
  generatedAt: Date;
  days: SnapshotDayInput[];
};

export type SnapshotPrayer = {
  kind: string;
  /** The prayer's own name, used for logic. */
  label: string;
  /** What a widget prints: "Jummah" instead of "Duhr" on Friday. */
  displayLabel: string;
  /** When the prayer starts, used for "next" and "now". */
  at: string;
  isPrayer: boolean;
  jamat: string | null;
  /** True when `jamat` is this Friday's jummah time rather than an ordinary jamat time. */
  isJummah: boolean;
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
  showJamat: boolean;
  days: SnapshotDay[];
};

function jamatInstant(adhanAt: Date, time: string | undefined): string | null {
  if (!time) return null;
  const instant = localClockNear(adhanAt, time);
  return Number.isNaN(instant.getTime()) ? null : instant.toISOString();
}

export function isJummahCell(day: SnapshotDayInput, prayerName: string): boolean {
  return day.hasJummah === true && prayerName === 'duhr' && day.date.getDay() === FRIDAY;
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
    showJamat: input.showJamat ?? false,
    days: input.days.map((day) => ({
      date: isoDateKey(day.date),
      hijriText: day.hijriText,
      prayers: day.schedule.map((entry) => {
        const jamat = jamatInstant(entry.date, day.jamatTimes?.[entry.name]);
        const jummah = isJummahCell(day, entry.name) && jamat != null;

        return {
          kind: entry.name,
          label: entry.label,
          displayLabel: jummah ? 'Jummah' : entry.label,
          at: entry.date.toISOString(),
          isPrayer: entry.isPrayer,
          jamat,
          isJummah: jummah,
        };
      }),
    })),
  };
}

export function snapshotIsEmpty(snapshot: Snapshot): boolean {
  return snapshot.days.every((day) => day.prayers.length === 0);
}
