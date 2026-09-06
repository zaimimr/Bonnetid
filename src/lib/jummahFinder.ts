import { distanceKm } from './geo';
import { isoDateIsFriday, osloWallClockToDate } from './time';

export const JUMMAH_AVERAGE_SPEED_KMH = 30;
export const JUMMAH_ROAD_DETOUR_FACTOR = 1.35;
export const JUMMAH_ARRIVAL_BUFFER_MINUTES = 5;
export const JUMMAH_SAFETY_MARGIN_MINUTES = 5;
export const JUMMAH_DURATION_MINUTES = 45;
export const JUMMAH_TOO_FAR_MINUTES = 120;

const MINUTE_MS = 60_000;

export type JummahOrigin = {
  lat: number;
  lon: number;
};

export type JummahMosqueInput = {
  orgNr: string;
  name: string;
  address: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
  jummahTimes: string[];
};

export type JummahSlot = {
  time: string;
  startsAt: Date;
};

export type JummahCandidate = {
  orgNr: string;
  name: string;
  address: string | null;
  city: string | null;
  distanceKm: number | null;
  travelMinutes: number | null;
  slots: JummahSlot[];
};

export type JummahReach =
  | 'reachable'
  | 'tight'
  | 'started'
  | 'late'
  | 'finished'
  | 'far'
  | 'unknown';

export type RankedJummah = JummahCandidate & {
  slot: JummahSlot | null;
  laterSlots: JummahSlot[];
  reach: JummahReach;
  minutesUntilStart: number | null;
  minutesToSpare: number | null;
};

export type JummahRankOptions = {
  averageSpeedKmh?: number;
  detourFactor?: number;
  arrivalBufferMinutes?: number;
  safetyMarginMinutes?: number;
  durationMinutes?: number;
  tooFarMinutes?: number;
};

export function estimateTravelMinutes(
  straightLineKm: number,
  options: JummahRankOptions = {},
): number {
  const speed = options.averageSpeedKmh ?? JUMMAH_AVERAGE_SPEED_KMH;
  const detour = options.detourFactor ?? JUMMAH_ROAD_DETOUR_FACTOR;
  const buffer = options.arrivalBufferMinutes ?? JUMMAH_ARRIVAL_BUFFER_MINUTES;
  return Math.round((straightLineKm * detour * 60) / speed) + buffer;
}

export function buildJummahCandidates(
  mosques: JummahMosqueInput[],
  origin: JummahOrigin | null,
  isoDate: string,
  options: JummahRankOptions = {},
): JummahCandidate[] {
  const candidates: JummahCandidate[] = [];

  for (const mosque of mosques) {
    const slots: JummahSlot[] = [];
    const seen = new Set<string>();
    for (const time of mosque.jummahTimes) {
      const startsAt = osloWallClockToDate(isoDate, time);
      if (Number.isNaN(startsAt.getTime()) || seen.has(time)) continue;
      seen.add(time);
      slots.push({ time, startsAt });
    }
    if (slots.length === 0) continue;
    slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

    const hasCoords = mosque.lat != null && mosque.lon != null;
    const straightLineKm =
      origin && hasCoords
        ? distanceKm(origin.lat, origin.lon, Number(mosque.lat), Number(mosque.lon))
        : null;

    candidates.push({
      orgNr: mosque.orgNr,
      name: mosque.name,
      address: mosque.address,
      city: mosque.city,
      distanceKm: straightLineKm,
      travelMinutes: straightLineKm == null ? null : estimateTravelMinutes(straightLineKm, options),
      slots,
    });
  }

  return candidates;
}

const REACH_ORDER: Record<JummahReach, number> = {
  reachable: 0,
  tight: 1,
  started: 2,
  unknown: 3,
  late: 4,
  finished: 5,
  far: 6,
};

function classify(
  slot: JummahSlot,
  now: Date,
  travelMinutes: number | null,
  options: JummahRankOptions,
): JummahReach {
  const duration = options.durationMinutes ?? JUMMAH_DURATION_MINUTES;
  const margin = options.safetyMarginMinutes ?? JUMMAH_SAFETY_MARGIN_MINUTES;
  const tooFar = options.tooFarMinutes ?? JUMMAH_TOO_FAR_MINUTES;
  const start = slot.startsAt.getTime();
  const elapsed = now.getTime() - start;

  if (elapsed >= duration * MINUTE_MS) return 'finished';
  if (elapsed >= 0) return 'started';
  if (travelMinutes == null) return 'unknown';
  if (travelMinutes > tooFar) return 'far';

  const arrivalAfterStart = travelMinutes * MINUTE_MS + elapsed;
  if (arrivalAfterStart <= -margin * MINUTE_MS) return 'reachable';
  if (arrivalAfterStart <= 0) return 'tight';
  if (arrivalAfterStart < duration * MINUTE_MS) return 'late';
  return 'finished';
}

function pickSlot(
  candidate: JummahCandidate,
  now: Date,
  options: JummahRankOptions,
): { slot: JummahSlot; reach: JummahReach; index: number } | null {
  if (candidate.slots.length === 0) return null;

  let best: { slot: JummahSlot; reach: JummahReach; index: number } | null = null;
  for (let index = 0; index < candidate.slots.length; index += 1) {
    const slot = candidate.slots[index];
    const reach = classify(slot, now, candidate.travelMinutes, options);
    if (!best || REACH_ORDER[reach] < REACH_ORDER[best.reach]) {
      best = { slot, reach, index };
    }
  }
  return best;
}

export function rankJummah(
  candidates: JummahCandidate[],
  now: Date,
  options: JummahRankOptions = {},
): RankedJummah[] {
  const ranked: RankedJummah[] = [];

  for (const candidate of candidates) {
    const picked = pickSlot(candidate, now, options);
    if (!picked) continue;

    const untilMs = picked.slot.startsAt.getTime() - now.getTime();
    ranked.push({
      ...candidate,
      slot: picked.slot,
      laterSlots: candidate.slots.slice(picked.index + 1),
      reach: picked.reach,
      minutesUntilStart: Math.round(untilMs / MINUTE_MS),
      minutesToSpare:
        candidate.travelMinutes == null || untilMs < 0
          ? null
          : Math.round(untilMs / MINUTE_MS) - candidate.travelMinutes,
    });
  }

  return ranked.sort((a, b) => {
    const byReach = REACH_ORDER[a.reach] - REACH_ORDER[b.reach];
    if (byReach !== 0) return byReach;

    const distanceA = a.distanceKm ?? Infinity;
    const distanceB = b.distanceKm ?? Infinity;
    if (distanceA !== distanceB) return distanceA - distanceB;

    const bySlot = (a.slot?.startsAt.getTime() ?? 0) - (b.slot?.startsAt.getTime() ?? 0);
    if (bySlot !== 0) return bySlot;

    return a.name.localeCompare(b.name, 'nb');
  });
}

export function rankJummahByDistance(candidates: JummahCandidate[]): RankedJummah[] {
  return candidates
    .map((candidate) => ({
      ...candidate,
      slot: candidate.slots[0] ?? null,
      laterSlots: candidate.slots.slice(1),
      reach: 'unknown' as JummahReach,
      minutesUntilStart: null,
      minutesToSpare: null,
    }))
    .sort((a, b) => {
      const distanceA = a.distanceKm ?? Infinity;
      const distanceB = b.distanceKm ?? Infinity;
      if (distanceA !== distanceB) return distanceA - distanceB;
      return a.name.localeCompare(b.name, 'nb');
    });
}

export function isJummahDay(isoDate: string): boolean {
  return isoDateIsFriday(isoDate);
}

export function nextFridayIso(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if ([year, month, day].some(Number.isNaN)) return isoDate;
  const date = new Date(Date.UTC(year, month - 1, day));
  const shift = (5 - date.getUTCDay() + 7) % 7;
  date.setUTCDate(date.getUTCDate() + shift);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}
