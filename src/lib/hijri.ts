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
