import type { HijriDay } from '@/api/types';
import { parseHijriDate, weekdayName, type ParsedHijri } from './hijri';
import { t } from './i18n.ts';
import { ARAFAH_DAY, DHUL_HIJJAH_SEASON, RAMADAN_SEASON } from './hijriSeason';
import { SUHOOR_REMINDER_MINUTES } from './ramadan';
import { addIsoDays, isoWeekday, osloWallClockToDate } from './time';

export const EVENING_REMINDER_CLOCK = '21:00';
export const WHITE_DAYS = [13, 14, 15];
export const ASHURA_DAYS = [9, 10];
export const MUHARRAM = 1;
export const SHAWWAL = 10;

const MINUTE_MS = 60_000;
const MONDAY = 1;
const THURSDAY = 4;
const FORBIDDEN_DHUL_HIJJAH_DAYS = [10, 11, 12, 13];

export type FastOccasionKind = 'arafah' | 'ashura' | 'whiteDays' | 'mondayThursday';

export type FastToggles = Record<FastOccasionKind, boolean>;

export type FastOccasion = {
  isoDate: string;
  kind: FastOccasionKind;
  title: string;
  body: string;
};

export type FastingReminder = {
  isoDate: string;
  title: string;
  body: string;
  fireAt: Date;
};

const SUHOOR_HINT = t('season.rememberSuhoorIfYou');

function hijriDayOf(day: number, month: string): string {
  return t('season.combined', { day, month });
}

export function isFastingForbidden(hijri: ParsedHijri): boolean {
  if (hijri.month === SHAWWAL && hijri.day === 1) return true;
  return (
    hijri.month === DHUL_HIJJAH_SEASON.month && FORBIDDEN_DHUL_HIJJAH_DAYS.includes(hijri.day)
  );
}

function occasionFor(
  row: HijriDay,
  hijri: ParsedHijri,
  toggles: FastToggles,
): FastOccasion | null {
  if (toggles.arafah && hijri.month === DHUL_HIJJAH_SEASON.month && hijri.day === ARAFAH_DAY) {
    return {
      isoDate: row.gregorian_date,
      kind: 'arafah',
      title: t('season.arafah2.title'),
      body: t('season.arafah2.body', { SUHOOR_HINT }),
    };
  }

  if (toggles.ashura && hijri.month === MUHARRAM && ASHURA_DAYS.includes(hijri.day)) {
    return {
      isoDate: row.gregorian_date,
      kind: 'ashura',
      title:
        hijri.day === 10
          ? t('season.tomorrowIsAshura')
          : t('season.tomorrowIsTheDay'),
      body: `${hijriDayOf(hijri.day, t('season.muharram'))} ${SUHOOR_HINT}`,
    };
  }

  if (toggles.whiteDays && WHITE_DAYS.includes(hijri.day)) {
    return {
      isoDate: row.gregorian_date,
      kind: 'whiteDays',
      title: t('season.whitedays.title'),
      body: `${hijriDayOf(hijri.day, row.hijri_month_text)} ${SUHOOR_HINT}`,
    };
  }

  const weekday = isoWeekday(row.gregorian_date);
  if (toggles.mondayThursday && (weekday === MONDAY || weekday === THURSDAY)) {
    return {
      isoDate: row.gregorian_date,
      kind: 'mondayThursday',
      title: t('season.mondaythursday.title', { value: weekdayName(weekday) }),
      body: SUHOOR_HINT,
    };
  }

  return null;
}

export function fastOccasionsFrom(
  rows: HijriDay[],
  toggles: FastToggles,
  fromIso: string,
): FastOccasion[] {
  const byDate = new Map<string, FastOccasion>();

  for (const row of rows) {
    if (row.gregorian_date <= fromIso) continue;
    if (byDate.has(row.gregorian_date)) continue;
    const hijri = parseHijriDate(row.hijri_date);
    if (!hijri) continue;
    if (hijri.month === RAMADAN_SEASON.month) continue;
    if (isFastingForbidden(hijri)) continue;
    const occasion = occasionFor(row, hijri, toggles);
    if (occasion) byDate.set(row.gregorian_date, occasion);
  }

  return [...byDate.values()].sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}

export function suhoorReminderAt(fajrAt: Date): Date {
  return new Date(fajrAt.getTime() - SUHOOR_REMINDER_MINUTES * MINUTE_MS);
}

export function eveningReminderAt(isoDate: string): Date {
  return osloWallClockToDate(addIsoDays(isoDate, -1), EVENING_REMINDER_CLOCK);
}

export type RamadanFastingDay = {
  isoDate: string;
  dayOfRamadan: number;
  fajrAt: Date;
  fajrClock: string;
};

export function ramadanFastingReminders(
  days: RamadanFastingDay[],
  locationName: string,
): FastingReminder[] {
  return days.map((day) => ({
    isoDate: day.isoDate,
    title: t('season.suhoorEndsInMinutes', { SUHOOR_REMINDER_MINUTES }),
    body: t('season.fajrIsAtIn', { fajrClock: day.fajrClock, locationName, dayOfRamadan: day.dayOfRamadan }),
    fireAt: suhoorReminderAt(day.fajrAt),
  }));
}

export function occasionFastingReminders(occasions: FastOccasion[]): FastingReminder[] {
  return occasions.map((occasion) => ({
    isoDate: occasion.isoDate,
    title: occasion.title,
    body: occasion.body,
    fireAt: eveningReminderAt(occasion.isoDate),
  }));
}

export function mergeFastingReminders(
  ramadan: FastingReminder[],
  occasions: FastingReminder[],
): FastingReminder[] {
  const byDate = new Map<string, FastingReminder>();
  for (const reminder of [...ramadan, ...occasions]) {
    if (Number.isNaN(reminder.fireAt.getTime())) continue;
    if (byDate.has(reminder.isoDate)) continue;
    byDate.set(reminder.isoDate, reminder);
  }
  return [...byDate.values()].sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}
