import type { PrayerEntry } from './prayerSchedule';

export type PrayerStatus = 'prayed' | 'skipped';

/** `status: null` is a tombstone: the user cleared a mark, and that must win over an older mark. */
export type PrayerLogEntry = {
  status: PrayerStatus | null;
  at: number;
};

/** Keyed by `prayerLogKey(isoDate, prayer)`. */
export type PrayerLog = Record<string, PrayerLogEntry>;

/** Shared key in the iOS app group / Android SharedPreferences, next to the widget snapshot. */
export const PRAYER_LOG_KEY = 'prayer_log_v1';
export const PRAYER_LOG_RETENTION_DAYS = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

export function prayerLogKey(isoDate: string, prayer: string): string {
  return `${isoDate}|${prayer}`;
}

export function parsePrayerLogKey(key: string): { isoDate: string; prayer: string } | null {
  const [isoDate, prayer] = key.split('|');
  if (!isoDate || !prayer) return null;
  return { isoDate, prayer };
}

export function statusOf(log: PrayerLog, isoDate: string, prayer: string): PrayerStatus | null {
  return log[prayerLogKey(isoDate, prayer)]?.status ?? null;
}

/** Last writer wins per prayer, so the app and the native surfaces can both mark prayers. */
export function mergePrayerLogs(...logs: PrayerLog[]): PrayerLog {
  const merged: PrayerLog = {};
  for (const log of logs) {
    for (const [key, entry] of Object.entries(log)) {
      const existing = merged[key];
      if (!existing || entry.at > existing.at) merged[key] = entry;
    }
  }
  return merged;
}

export function prunePrayerLog(
  log: PrayerLog,
  now: Date,
  retentionDays = PRAYER_LOG_RETENTION_DAYS,
): PrayerLog {
  const cutoff = now.getTime() - retentionDays * DAY_MS;
  const kept: PrayerLog = {};
  for (const [key, entry] of Object.entries(log)) {
    const parsed = parsePrayerLogKey(key);
    if (!parsed) continue;
    const day = new Date(`${parsed.isoDate}T12:00:00`).getTime();
    if (Number.isNaN(day) || day < cutoff) continue;
    kept[key] = entry;
  }
  return kept;
}

export function prayerLogsEqual(a: PrayerLog, b: PrayerLog): boolean {
  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;
  return keysA.every((key) => b[key]?.status === a[key].status && b[key]?.at === a[key].at);
}

function isStatus(value: unknown): value is PrayerStatus | null {
  return value === null || value === 'prayed' || value === 'skipped';
}

/** Tolerant of anything a native surface may have written; drops malformed entries. */
export function parsePrayerLog(json: string | null | undefined): PrayerLog {
  if (!json) return {};
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return {};
  }
  if (raw == null || typeof raw !== 'object') return {};
  const log: PrayerLog = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value == null || typeof value !== 'object') continue;
    const { status, at } = value as { status?: unknown; at?: unknown };
    if (!isStatus(status) || typeof at !== 'number') continue;
    if (!parsePrayerLogKey(key)) continue;
    log[key] = { status, at };
  }
  return log;
}

export type LoggedPrayer = {
  isoDate: string;
  entry: PrayerEntry;
  status: PrayerStatus | null;
};

/** The five daily prayers that have started, with whatever the user has marked on them. */
export function startedPrayers(
  days: { isoDate: string; schedule: PrayerEntry[] }[],
  log: PrayerLog,
  now: Date,
): LoggedPrayer[] {
  const time = now.getTime();
  return days.flatMap((day) =>
    day.schedule
      .filter((entry) => entry.isPrayer && entry.date.getTime() <= time)
      .map((entry) => ({ isoDate: day.isoDate, entry, status: statusOf(log, day.isoDate, entry.name) })),
  );
}

/** Started prayers with no mark yet: the "remember to pray" list. */
export function unmarkedPrayers(
  days: { isoDate: string; schedule: PrayerEntry[] }[],
  log: PrayerLog,
  now: Date,
): LoggedPrayer[] {
  return startedPrayers(days, log, now).filter((prayer) => prayer.status === null);
}
