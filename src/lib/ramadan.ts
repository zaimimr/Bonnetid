import type { HijriDay } from '@/api/types';
import { RAMADAN_SEASON, seasonDayNumbers, seasonStatusFrom } from './hijriSeason';

export const RAMADAN_MONTH = RAMADAN_SEASON.month;
export const RAMADAN_COUNTDOWN_DAYS = RAMADAN_SEASON.countdownDays;
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
  const status = seasonStatusFrom(RAMADAN_SEASON, rows, todayIso, lookaheadDays);
  if (!status) return NOT_RAMADAN;
  return {
    isRamadan: status.isActive,
    dayOfRamadan: status.dayOfSeason,
    hijriYear: status.hijriYear,
    daysUntilRamadan: status.daysUntilStart,
  };
}

export function ramadanDayNumbers(rows: HijriDay[]): Map<string, number> {
  return seasonDayNumbers(rows, RAMADAN_SEASON);
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
