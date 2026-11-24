import type { PrayerName } from './prayerSchedule.ts';

export type NightKind = 'normal' | 'twilight' | 'midnightSun';

const DAY_MS = 86_400_000;
const TWILIGHT_DEPTH = -18;
const HORIZON = -0.833;

function dayOfYear(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number);
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / DAY_MS);
}

function declination(isoDate: string): number {
  const gamma = (2 * Math.PI * (dayOfYear(isoDate) - 1)) / 365;
  const radians =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  return (radians * 180) / Math.PI;
}

export function nightKind(lat: number, isoDate: string): NightKind {
  const lowest = Math.abs(lat) + Math.sign(lat || 1) * declination(isoDate) - 90;
  if (lowest > HORIZON) return 'midnightSun';
  if (lowest > TWILIGHT_DEPTH) return 'twilight';
  return 'normal';
}

const AFFECTED: Record<NightKind, PrayerName[]> = {
  normal: [],
  twilight: ['fajr', 'isha'],
  midnightSun: ['fajr', 'maghrib', 'isha'],
};

export function lowSunPrayers(kind: NightKind): PrayerName[] {
  return AFFECTED[kind];
}
