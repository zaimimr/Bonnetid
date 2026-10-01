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
  return period === 'adha' ? 'Eid al-Adha-bønn' : 'Eid al-Fitr-bønn';
}

export function eidBadgeLabel(period: EidPeriod): string {
  return period === 'adha' ? 'Eid al-Adha' : 'Eid';
}

export function formatHijri(hijriDate: string, monthText: string): string {
  const parsed = parseHijriDate(hijriDate);
  if (!parsed) return hijriDate;
  return `${parsed.day}. ${monthText} ${parsed.year}`;
}

const NORWEGIAN_MONTHS = [
  'januar',
  'februar',
  'mars',
  'april',
  'mai',
  'juni',
  'juli',
  'august',
  'september',
  'oktober',
  'november',
  'desember',
] as const;

const NORWEGIAN_WEEKDAYS = [
  'søndag',
  'mandag',
  'tirsdag',
  'onsdag',
  'torsdag',
  'fredag',
  'lørdag',
] as const;

export function formatGregorianLong(date: Date): string {
  const weekday = NORWEGIAN_WEEKDAYS[date.getDay()];
  const month = NORWEGIAN_MONTHS[date.getMonth()];
  return `${capitalize(weekday)} ${date.getDate()}. ${month} ${date.getFullYear()}`;
}

export function formatGregorianShort(date: Date): string {
  return `${date.getDate()}. ${NORWEGIAN_MONTHS[date.getMonth()]}`;
}

export function monthName(monthIndex: number): string {
  return capitalize(NORWEGIAN_MONTHS[monthIndex] ?? '');
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
