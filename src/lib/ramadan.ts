import type { HijriDay } from '@/api/types';
import { RAMADAN_SEASON, seasonDayNumbers, seasonStatusFrom } from './hijriSeason';
import { t } from './i18n.ts';
import { formatDayCount } from './time';

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
  const suhoorEnds = t({ nb: 'Suhoor slutter', en: 'Suhoor ends', ar: 'ينتهي السحور', ur: 'سحری ختم' });
  const iftar = t({ nb: 'Iftar', en: 'Iftar', ar: 'الإفطار', ur: 'افطار' });
  if (fajr && now.getTime() < fajr.getTime()) return { label: suhoorEnds, target: fajr };
  if (maghrib && now.getTime() < maghrib.getTime()) return { label: iftar, target: maghrib };
  if (tomorrowFajr && now.getTime() < tomorrowFajr.getTime()) {
    return { label: suhoorEnds, target: tomorrowFajr };
  }
  return null;
}

export function ramadanCountdownText(days: number): string {
  if (days <= 1) {
    return t({
      nb: 'Ramadan begynner i morgen',
      en: 'Ramadan begins tomorrow',
      ar: 'يبدأ رمضان غدًا',
      ur: 'رمضان کل شروع ہو گا',
    });
  }
  return t({
    nb: `Ramadan begynner om ${days} dager`,
    en: `Ramadan begins in ${formatDayCount(days)}`,
    ar: `يبدأ رمضان بعد ${formatDayCount(days)}`,
    ur: `رمضان ${formatDayCount(days)} میں شروع ہو گا`,
  });
}
