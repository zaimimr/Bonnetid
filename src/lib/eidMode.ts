import type { HijriDay, Mosque } from '../api/types.ts';
import { distanceKm } from './geo.ts';
import { parseHijriDate, type EidPeriod } from './hijri.ts';
import { osloWallClockToDate } from './time.ts';

export const EVE_FALLBACK_TIME = '18:00';
export const EID_PRAYER_GRACE_MS = 30 * 60 * 1000;
const NEARBY_LIMIT = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

export type EidMode = {
  eid: EidPeriod;
  phase: 'eve' | 'day';
  eidIso: string;
};

function eidOn(rows: HijriDay[], isoDate: string): EidPeriod | null {
  const row = rows.find((candidate) => candidate.gregorian_date === isoDate);
  const hijri = row ? parseHijriDate(row.hijri_date) : null;
  if (!hijri) return null;
  if (hijri.month === 10 && hijri.day === 1) return 'fitr';
  if (hijri.month === 12 && hijri.day === 10) return 'adha';
  return null;
}

export function nextIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day) + DAY_MS).toISOString().slice(0, 10);
}

export function eidModeAt(
  rows: HijriDay[],
  todayIso: string,
  now: Date,
  maghribToday: Date | null,
): EidMode | null {
  const today = eidOn(rows, todayIso);
  if (today) return { eid: today, phase: 'day', eidIso: todayIso };

  const tomorrowIso = nextIsoDate(todayIso);
  const tomorrow = eidOn(rows, tomorrowIso);
  if (!tomorrow) return null;

  const eveStart = maghribToday ?? osloWallClockToDate(todayIso, EVE_FALLBACK_TIME);
  if (now.getTime() < eveStart.getTime()) return null;
  return { eid: tomorrow, phase: 'eve', eidIso: tomorrowIso };
}

export type EidPrayerSource = {
  mosque: Mosque;
  prayers: Date[];
};

function hasEidTimes(mosque: Mosque): boolean {
  return mosque.show_eid && mosque.eid_prayers.length > 0;
}

export function eidPrayerInstants(mosque: Mosque, eidIso: string): Date[] {
  return mosque.eid_prayers
    .map((time) => osloWallClockToDate(eidIso, time))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
}

export function nearbyEidMosques(
  mosques: Mosque[],
  origin: { lat: number; lon: number } | null,
  limit: number = NEARBY_LIMIT,
): Mosque[] {
  const withTimes = mosques.filter(hasEidTimes);
  if (!origin) return withTimes.slice(0, limit);
  const distance = (mosque: Mosque) =>
    mosque.lat == null || mosque.lon == null
      ? Number.POSITIVE_INFINITY
      : distanceKm(origin.lat, origin.lon, mosque.lat, mosque.lon);
  return [...withTimes].sort((a, b) => distance(a) - distance(b)).slice(0, limit);
}

export function heroEidSource(
  myMosque: Mosque | null,
  nearby: Mosque[],
  eidIso: string,
  now: Date,
): EidPrayerSource | null {
  const candidates = myMosque && hasEidTimes(myMosque) ? [myMosque] : nearby.slice(0, 1);
  const mosque = candidates[0];
  if (!mosque) return null;
  const prayers = eidPrayerInstants(mosque, eidIso);
  const last = prayers[prayers.length - 1];
  if (!last || now.getTime() > last.getTime() + EID_PRAYER_GRACE_MS) return null;
  return { mosque, prayers };
}
