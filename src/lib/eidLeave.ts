import type { HijriDay } from '../api/types.ts';
import { parseHijriDate, type EidPeriod } from './hijri.ts';

export const LEAVE_NOTICE_DAYS = 14;
const SHOW_FROM_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type EidLeave = {
  eid: EidPeriod;
  eidIso: string;
  deadlineIso: string;
  daysToDeadline: number;
};

function isoToUtc(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function utcToIso(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

function eidOf(row: HijriDay): EidPeriod | null {
  const hijri = parseHijriDate(row.hijri_date);
  if (!hijri) return null;
  if (hijri.month === 10 && hijri.day === 1) return 'fitr';
  if (hijri.month === 12 && hijri.day === 10) return 'adha';
  return null;
}

export function upcomingEidLeave(rows: HijriDay[], todayIso: string): EidLeave | null {
  const today = isoToUtc(todayIso);
  for (const row of [...rows].sort((a, b) => a.gregorian_date.localeCompare(b.gregorian_date))) {
    const eid = eidOf(row);
    if (!eid) continue;
    const eidTime = isoToUtc(row.gregorian_date);
    const daysToEid = Math.round((eidTime - today) / DAY_MS);
    const daysToDeadline = daysToEid - LEAVE_NOTICE_DAYS;
    if (daysToDeadline < 0 || daysToEid > SHOW_FROM_DAYS) continue;
    return {
      eid,
      eidIso: row.gregorian_date,
      deadlineIso: utcToIso(eidTime - LEAVE_NOTICE_DAYS * DAY_MS),
      daysToDeadline,
    };
  }
  return null;
}
