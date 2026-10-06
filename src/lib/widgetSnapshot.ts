import { language, type Language } from './i18n.ts';
import type { JummahSlot } from './jummah';
import { jummahSlotIsOpen } from './jummah';
import type { PrayerEntry } from './prayerSchedule';
import { isoDateKey, localClockNear } from './time';

export const SNAPSHOT_VERSION = 3;

export type SnapshotDayInput = {
  date: Date;
  schedule: PrayerEntry[];
  hijriText: string;
  jamatTimes?: Partial<Record<string, string>>;
  /** This Friday's congregation, and the instant it stops standing in for Dhuhr. */
  jummah?: JummahSlot | null;
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
  label: string;
  /** When the prayer starts, used for "next" and "now". */
  at: string;
  isPrayer: boolean;
  /** The mosque's ordinary congregation time, Jumuah excluded. */
  jamat: string | null;
  /** This Friday's Jumuah, which stands in for the Dhuhr congregation until `jummahEnd`. */
  jummahAt: string | null;
  /** When a widget goes back to printing "Dhuhr" and the ordinary jamat time. */
  jummahEnd: string | null;
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
  lang: Language;
  days: SnapshotDay[];
};

function jamatInstant(adhanAt: Date, time: string | undefined): string | null {
  if (!time) return null;
  const instant = localClockNear(adhanAt, time);
  return Number.isNaN(instant.getTime()) ? null : instant.toISOString();
}

export function jummahSlotForCell(day: SnapshotDayInput, prayerName: string): JummahSlot | null {
  return prayerName === 'duhr' ? (day.jummah ?? null) : null;
}

export function isJummahCell(day: SnapshotDayInput, prayerName: string, now?: Date): boolean {
  return jummahSlotIsOpen(jummahSlotForCell(day, prayerName), now);
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
    lang: language(),
    days: input.days.map((day) => ({
      date: isoDateKey(day.date),
      hijriText: day.hijriText,
      prayers: day.schedule.map((entry) => {
        const slot = jummahSlotForCell(day, entry.name);
        const jummahAt = slot ? jamatInstant(entry.date, slot.at) : null;

        return {
          kind: entry.name,
          label: entry.label,
          at: entry.date.toISOString(),
          isPrayer: entry.isPrayer,
          jamat: jamatInstant(entry.date, day.jamatTimes?.[entry.name]),
          jummahAt,
          jummahEnd: slot && jummahAt ? slot.endsAt.toISOString() : null,
          end: entry.end?.date.toISOString() ?? null,
        };
      }),
    })),
  };
}

export function snapshotIsEmpty(snapshot: Snapshot): boolean {
  return snapshot.days.every((day) => day.prayers.length === 0);
}
