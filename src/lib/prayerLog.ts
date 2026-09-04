import type { PrayerEntry, PrayerName } from './prayerSchedule';
import { isoDateKey, osloDayStart } from './time';

export type PrayerStatus = 'prayed' | 'skipped';

export type PrayerLogEntry = {
  status: PrayerStatus | null;
  at: number;
};

export type PrayerLog = Record<string, PrayerLogEntry>;

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

export const TRACKED_PRAYERS: PrayerName[] = ['fajr', 'duhr', 'asr', 'maghrib', 'isha'];

const MONDAY_OFFSET = 6;

export function weekDayKeys(now: Date): string[] {
  const monday = osloDayStart(now);
  monday.setDate(monday.getDate() - (monday.getDay() + MONDAY_OFFSET) % 7);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(day.getDate() + index);
    return isoDateKey(day);
  });
}

export type WeekCell = {
  prayer: PrayerName;
  started: boolean;
  status: PrayerStatus | null;
};

export type WeekColumn = {
  isoDate: string;
  isToday: boolean;
  isFuture: boolean;
  cells: WeekCell[];
};

export function weekColumns(
  days: string[],
  todayIso: string,
  todaySchedule: PrayerEntry[],
  log: PrayerLog,
  now: Date,
): WeekColumn[] {
  const time = now.getTime();
  return days.map((isoDate) => {
    const isToday = isoDate === todayIso;
    const isFuture = isoDate > todayIso;
    const cells = TRACKED_PRAYERS.map((prayer) => {
      const entry = isToday ? todaySchedule.find((item) => item.name === prayer) : undefined;
      const started = isFuture ? false : isToday ? entry != null && entry.date.getTime() <= time : true;
      return { prayer, started, status: statusOf(log, isoDate, prayer) };
    });
    return { isoDate, isToday, isFuture, cells };
  });
}
