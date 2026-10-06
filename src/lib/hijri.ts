import { language, t } from './i18n.ts';

export type ParsedHijri = {
  year: number;
  month: number;
  day: number;
};

export function parseHijriDate(hijriDate: string): ParsedHijri | null {
  const parts = hijriDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [year, month, day] = parts;
  return { year, month, day };
}

export type EidPeriod = 'fitr' | 'adha';

const EID_AL_ADHA_LEAD_DAYS = 10;

export function eidPeriodOf(hijri: ParsedHijri): EidPeriod | null {
  if (hijri.month === 9 || (hijri.month === 10 && hijri.day === 1)) return 'fitr';
  if (hijri.month === 12 && hijri.day <= EID_AL_ADHA_LEAD_DAYS) return 'adha';
  return null;
}

export function eidPrayerTitle(period: EidPeriod): string {
  return period === 'adha'
    ? t('hijri.eidAlAdhaPrayer')
    : t('hijri.eidAlFitrPrayer');
}

export function eidBadgeLabel(period: EidPeriod): string {
  return period === 'adha'
    ? t('hijri.eidAlAdha')
    : t('hijri.eid');
}

export function formatHijri(hijriDate: string, monthText: string): string {
  const parsed = parseHijriDate(hijriDate);
  if (!parsed) return hijriDate;
  return language() === 'nb' ? `${parsed.day}. ${monthText} ${parsed.year}` : `${parsed.day} ${monthText} ${parsed.year}`;
}

export function weekdayName(dayIndex: number): string {
  return t('hijri.weekdays', { returnObjects: true })[dayIndex] ?? '';
}

function gregorianMonth(monthIndex: number): string {
  return t('hijri.gregorianMonths', { returnObjects: true })[monthIndex] ?? '';
}

function dayAndMonth(date: Date): string {
  const month = gregorianMonth(date.getMonth());
  return language() === 'nb' ? `${date.getDate()}. ${month}` : `${date.getDate()} ${month}`;
}

export function formatGregorianLong(date: Date): string {
  return `${capitalize(weekdayName(date.getDay()))} ${dayAndMonth(date)} ${date.getFullYear()}`;
}

export function formatGregorianShort(date: Date): string {
  return dayAndMonth(date);
}

export function monthName(monthIndex: number): string {
  return capitalize(gregorianMonth(monthIndex));
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export type HijriMonthCursor = {
  year: number;
  month: number;
};

const HIJRI_EPOCH_UTC = Date.UTC(622, 6, 19);
const DAY_MS = 24 * 60 * 60 * 1000;
const HIJRI_YEAR_DAYS = 354.36667;
const HIJRI_MONTH_DAYS = 29.5306;

export function approxGregorianStart({ year, month }: HijriMonthCursor): Date {
  const days = Math.floor((year - 1) * HIJRI_YEAR_DAYS + (month - 1) * HIJRI_MONTH_DAYS);
  return new Date(HIJRI_EPOCH_UTC + days * DAY_MS);
}

export function shiftHijriMonth(cursor: HijriMonthCursor, delta: number): HijriMonthCursor {
  const index = cursor.year * 12 + (cursor.month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function monthYearLabel(date: Date): string {
  return `${gregorianMonth(date.getMonth())} ${date.getFullYear()}`;
}
