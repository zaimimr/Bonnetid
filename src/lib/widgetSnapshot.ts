import type { PrayerEntry } from './prayerSchedule';
import { isoDateKey, localClockNear } from './time';

export const SNAPSHOT_VERSION = 2;
const FRIDAY = 5;

export type SnapshotDayInput = {
  date: Date;
  schedule: PrayerEntry[];
  hijriText: string;
  jamatTimes?: Partial<Record<string, string>>;
  /** True when the mosque has a Jumuah time for this Friday. */
  hasJummah?: boolean;
};

export type SnapshotMosqueInput = {
  orgNr: string;
  name: string;
  address: string | null;
  lat: number;
  lon: number;
};

export type SnapshotInput = {
  locationName: string;
  mode?: 'norway' | 'calculated';
  /** Where the user's chosen kommune is, used when the car has no location fix. */
  origin?: { lat: number; lon: number } | null;
  /** Every mosque that has coordinates; the car app ranks them against its own position. */
  mosques?: SnapshotMosqueInput[];
  mosqueName?: string | null;
  showJamat?: boolean;
  /** Android only: post the ongoing "har du bedt?" notification when a prayer starts. */
  lockScreenEnabled?: boolean;
  generatedAt: Date;
  days: SnapshotDayInput[];
};

export type SnapshotPrayer = {
  kind: string;
  /** The prayer's own name, used for logic. */
  label: string;
  /** What a widget prints: "Jumuah" instead of "Dhuhr" on Friday. */
  displayLabel: string;
  /** When the prayer starts, used for "next" and "now". */
  at: string;
  isPrayer: boolean;
  jamat: string | null;
  /** True when `jamat` is this Friday's Jumuah time rather than an ordinary jamat time. */
  isJummah: boolean;
  end: string | null;
};

export type SnapshotDay = {
  date: string;
  hijriText: string;
  prayers: SnapshotPrayer[];
};

export type SnapshotMosque = SnapshotMosqueInput;

export type Snapshot = {
  version: number;
  generatedAt: string;
  locationName: string;
  mode: 'norway' | 'calculated';
  origin: { lat: number; lon: number } | null;
  mosques: SnapshotMosque[];
  mosqueName: string | null;
  showJamat: boolean;
  lockScreenEnabled: boolean;
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
    mode: input.mode ?? 'norway',
    origin: input.origin ?? null,
    mosques: input.mosques ?? [],
    mosqueName: input.mosqueName ?? null,
    showJamat: input.showJamat ?? false,
    lockScreenEnabled: input.lockScreenEnabled ?? false,
    days: input.days.map((day) => ({
      date: isoDateKey(day.date),
      hijriText: day.hijriText,
      prayers: day.schedule.map((entry) => {
        const jamat = jamatInstant(entry.date, day.jamatTimes?.[entry.name]);
        const jummah = isJummahCell(day, entry.name) && jamat != null;

        return {
          kind: entry.name,
          label: entry.label,
          displayLabel: jummah ? 'Jumuah' : entry.label,
          at: entry.date.toISOString(),
          isPrayer: entry.isPrayer,
          jamat,
          isJummah: jummah,
          end: entry.end?.date.toISOString() ?? null,
        };
      }),
    })),
  };
}

export function snapshotIsEmpty(snapshot: Snapshot): boolean {
  return snapshot.days.every((day) => day.prayers.length === 0);
}
