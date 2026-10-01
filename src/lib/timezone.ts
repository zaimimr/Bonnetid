import tzLookup from 'tz-lookup';

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const MAX_CACHED_DAYS = 2000;
const COORD_PRECISION = 2;
const HOURS_IN_DAY = 24;

const zoneByCoords = new Map<string, string | null>();
const formatters = new Map<string, Intl.DateTimeFormat | null>();
const dayOffsets = new Map<string, number | null>();

function coordKey(lat: number, lon: number): string {
  return `${lat.toFixed(COORD_PRECISION)},${lon.toFixed(COORD_PRECISION)}`;
}

export function timeZoneForCoords(lat: number, lon: number): string | null {
  const key = coordKey(lat, lon);
  const cached = zoneByCoords.get(key);
  if (cached !== undefined) return cached;

  let zone: string | null = null;
  try {
    zone = tzLookup(lat, lon);
  } catch {
    zone = null;
  }
  zoneByCoords.set(key, zone);
  return zone;
}

function formatterFor(zone: string): Intl.DateTimeFormat | null {
  const cached = formatters.get(zone);
  if (cached !== undefined) return cached;

  let formatter: Intl.DateTimeFormat | null = null;
  try {
    formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    formatter.format(new Date());
  } catch {
    formatter = null;
  }
  formatters.set(zone, formatter);
  return formatter;
}

export function timeZoneIsUsable(zone: string): boolean {
  return formatterFor(zone) != null;
}

type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function partsIn(zone: string, instant: Date): ZonedParts | null {
  const formatter = formatterFor(zone);
  if (!formatter || Number.isNaN(instant.getTime())) return null;

  const parts = formatter.formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const found = parts.find((part) => part.type === type);
    return found ? Number(found.value) : NaN;
  };

  const hour = read('hour');
  const values = {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: hour === HOURS_IN_DAY ? 0 : hour,
    minute: read('minute'),
    second: read('second'),
  };
  return Object.values(values).some(Number.isNaN) ? null : values;
}

function exactOffsetMinutes(zone: string, instant: Date): number | null {
  const parts = partsIn(zone, instant);
  if (!parts) return null;

  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / MINUTE_MS);
}

function steadyDayOffset(zone: string, utcDay: number): number | null {
  const key = `${zone}|${utcDay}`;
  const cached = dayOffsets.get(key);
  if (cached !== undefined) return cached;

  const start = exactOffsetMinutes(zone, new Date(utcDay * DAY_MS));
  const end = exactOffsetMinutes(zone, new Date((utcDay + 1) * DAY_MS));
  const steady = start != null && start === end ? start : null;
  if (dayOffsets.size >= MAX_CACHED_DAYS) dayOffsets.clear();
  dayOffsets.set(key, steady);
  return steady;
}

/**
 * Minutes the zone runs ahead of UTC at that instant, DST included. Null when the runtime
 * cannot resolve the zone, so callers can fall back to the device clock.
 */
export function zoneOffsetMinutes(zone: string, instant: Date): number | null {
  const time = instant.getTime();
  if (Number.isNaN(time)) return null;
  const steady = steadyDayOffset(zone, Math.floor(time / DAY_MS));
  return steady ?? exactOffsetMinutes(zone, instant);
}
