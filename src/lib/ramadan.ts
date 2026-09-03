import type { HijriDay } from '@/api/types';
import { parseHijriDate } from './hijri';
import { daysBetweenIso } from './time';

export const RAMADAN_MONTH = 9;
export const RAMADAN_COUNTDOWN_DAYS = 10;
export const SUHOOR_REMINDER_MINUTES = 45;

export type RamadanStatus = {
  isRamadan: boolean;
  dayOfRamadan: number | null;
  hijriYear: number | null;
  daysUntilRamadan: number | null;
};

export const NOT_RAMADAN: RamadanStatus = {
  isRamadan: false,
  dayOfRamadan: null,
  hijriYear: null,
  daysUntilRamadan: null,
};

export function ramadanStatusFrom(
  rows: HijriDay[],
  todayIso: string,
  lookaheadDays: number = RAMADAN_COUNTDOWN_DAYS,
): RamadanStatus {
  const todayRow = rows.find((row) => row.gregorian_date === todayIso);
  const today = todayRow ? parseHijriDate(todayRow.hijri_date) : null;

  if (today && today.month === RAMADAN_MONTH) {
    return {
      isRamadan: true,
      dayOfRamadan: today.day,
      hijriYear: today.year,
      daysUntilRamadan: null,
    };
  }

  let soonest: { days: number; year: number } | null = null;
  for (const row of rows) {
    if (row.gregorian_date <= todayIso) continue;
    const parsed = parseHijriDate(row.hijri_date);
    if (!parsed || parsed.month !== RAMADAN_MONTH || parsed.day !== 1) continue;
    const days = daysBetweenIso(todayIso, row.gregorian_date);
    if (days == null || days <= 0 || days > lookaheadDays) continue;
    if (!soonest || days < soonest.days) soonest = { days, year: parsed.year };
  }

  if (soonest) {
    return {
      isRamadan: false,
      dayOfRamadan: null,
      hijriYear: soonest.year,
      daysUntilRamadan: soonest.days,
    };
  }

  return NOT_RAMADAN;
}

export function ramadanDayNumbers(rows: HijriDay[]): Map<string, number> {
  const days = new Map<string, number>();
  for (const row of rows) {
    const parsed = parseHijriDate(row.hijri_date);
    if (parsed && parsed.month === RAMADAN_MONTH) days.set(row.gregorian_date, parsed.day);
  }
  return days;
}

export function fastingProgress(now: Date, fajr: Date, maghrib: Date): number {
  const span = maghrib.getTime() - fajr.getTime();
  if (span <= 0) return 0;
  const elapsed = now.getTime() - fajr.getTime();
  return Math.min(1, Math.max(0, elapsed / span));
}

export type RamadanCountdown = {
  label: string;
  target: Date;
};

export function ramadanCountdown(
  now: Date,
  fajr: Date | null,
  maghrib: Date | null,
  tomorrowFajr: Date | null,
): RamadanCountdown | null {
  if (fajr && now.getTime() < fajr.getTime()) return { label: 'Suhoor slutter', target: fajr };
  if (maghrib && now.getTime() < maghrib.getTime()) return { label: 'Iftar', target: maghrib };
  if (tomorrowFajr && now.getTime() < tomorrowFajr.getTime()) {
    return { label: 'Suhoor slutter', target: tomorrowFajr };
  }
  return null;
}

export function ramadanCountdownText(days: number): string {
  if (days <= 1) return 'Ramadan begynner i morgen';
  return `Ramadan begynner om ${days} dager`;
}
