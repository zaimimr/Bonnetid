const MINUTE_MS = 60_000;
const OSLO_STANDARD_OFFSET = 60;
const OSLO_SUMMER_OFFSET = 120;
const MARCH = 2;
const OCTOBER = 9;
const FRIDAY = 5;
const NEIGHBOUR_DAYS = [-1, 1];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function lastSundayAtOneUtc(year: number, monthIndex: number): number {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0));
  const sunday = lastDay.getUTCDate() - lastDay.getUTCDay();
  return Date.UTC(year, monthIndex, sunday, 1, 0, 0, 0);
}

export function osloOffsetMinutes(instant: Date): number {
  const time = instant.getTime();
  if (Number.isNaN(time)) return OSLO_STANDARD_OFFSET;
  const year = instant.getUTCFullYear();
  const summerStart = lastSundayAtOneUtc(year, MARCH);
  const summerEnd = lastSundayAtOneUtc(year, OCTOBER);
  return time >= summerStart && time < summerEnd ? OSLO_SUMMER_OFFSET : OSLO_STANDARD_OFFSET;
}

export function deviceOffsetMinutes(instant: Date = new Date()): number {
  return -instant.getTimezoneOffset();
}

export function formatUtcOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const absolute = Math.abs(minutes);
  const hours = Math.floor(absolute / 60);
  const rest = absolute % 60;
  return rest === 0 ? `UTC${sign}${hours}` : `UTC${sign}${hours}:${pad(rest)}`;
}

type CalendarDay = { year: number; month: number; day: number };

function calendarDayOf(day: Date | string): CalendarDay | null {
  if (typeof day === 'string') {
    const [year, month, date] = day.split('-').map(Number);
    if ([year, month, date].some(Number.isNaN)) return null;
    return { year, month, day: date };
  }
  if (Number.isNaN(day.getTime())) return null;
  return { year: day.getFullYear(), month: day.getMonth() + 1, day: day.getDate() };
}

export function osloWallClockToDate(day: Date | string, time: string): Date {
  const calendar = calendarDayOf(day);
  const [hours, minutes] = time.split(':').map(Number);
  if (!calendar || Number.isNaN(hours) || Number.isNaN(minutes)) return new Date(NaN);

  const naive = Date.UTC(calendar.year, calendar.month - 1, calendar.day, hours, minutes, 0, 0);
  for (const offset of [OSLO_SUMMER_OFFSET, OSLO_STANDARD_OFFSET]) {
    const instant = naive - offset * MINUTE_MS;
    if (osloOffsetMinutes(new Date(instant)) === offset) return new Date(instant);
  }
  return new Date(naive - OSLO_STANDARD_OFFSET * MINUTE_MS);
}

export function parseTimeToDate(time: string, baseDate: Date): Date {
  return osloWallClockToDate(baseDate, time);
}

export function formatLocalClock(instant: Date): string {
  if (Number.isNaN(instant.getTime())) return '–';
  return `${pad(instant.getHours())}:${pad(instant.getMinutes())}`;
}

export function osloTimeToLocalClock(day: Date | string, time: string): string | null {
  const instant = osloWallClockToDate(day, time);
  return Number.isNaN(instant.getTime()) ? null : formatLocalClock(instant);
}

export function osloDateKey(instant: Date = new Date()): string {
  if (Number.isNaN(instant.getTime())) return '';
  const shifted = new Date(instant.getTime() + osloOffsetMinutes(instant) * MINUTE_MS);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

export function osloDayKey(instant: Date = new Date()): string {
  const [year, month, day] = osloDateKey(instant).split('-');
  return `${day}-${month}-${year}`;
}

export function osloDayStart(instant: Date = new Date()): Date {
  const [year, month, day] = osloDateKey(instant).split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function localClockNear(reference: Date, localTime: string): Date {
  const [hours, minutes] = localTime.split(':').map(Number);
  if (Number.isNaN(reference.getTime()) || Number.isNaN(hours) || Number.isNaN(minutes)) {
    return new Date(NaN);
  }

  const base = new Date(reference);
  base.setHours(hours, minutes, 0, 0);
  let nearest = base;
  for (const shift of NEIGHBOUR_DAYS) {
    const candidate = new Date(base);
    candidate.setDate(candidate.getDate() + shift);
    const closer =
      Math.abs(candidate.getTime() - reference.getTime()) <
      Math.abs(nearest.getTime() - reference.getTime());
    if (closer) nearest = candidate;
  }
  return nearest;
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const total = (((hours * 60 + mins + minutes) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatCountdownUnits(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}t ${minutes}m ${pad(seconds)}s`;
  if (minutes > 0) return `${minutes}m ${pad(seconds)}s`;
  return `${seconds}s`;
}

export function formatDurationShort(milliseconds: number): string {
  const totalMinutes = Math.max(0, Math.round(milliseconds / MINUTE_MS));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}t ${minutes}m`;
  return `${minutes}m`;
}

export function formatClock(time: string | null): string {
  return time ?? '–';
}

export function todayKey(date: Date = new Date()): string {
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
}

export function parseDayKey(dayKey: string): Date {
  const [day, month, year] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isoDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isoWeekday(isoDate: string): number {
  const parsed = new Date(`${isoDate}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? -1 : parsed.getDay();
}

export function isoDateIsFriday(isoDate: string): boolean {
  return isoWeekday(isoDate) === FRIDAY;
}

export function addIsoDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if ([year, month, day].some(Number.isNaN)) return isoDate;
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

export function daysBetweenIso(from: string, to: string): number | null {
  const start = calendarDayOf(from);
  const end = calendarDayOf(to);
  if (!start || !end) return null;
  const startMs = Date.UTC(start.year, start.month - 1, start.day);
  const endMs = Date.UTC(end.year, end.month - 1, end.day);
  return Math.round((endMs - startMs) / (24 * 60 * MINUTE_MS));
}
