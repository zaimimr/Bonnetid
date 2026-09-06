import { useMemo } from 'react';
import { useMosques } from '@/api/queries';
import { isInsideNorway } from '@/hooks/useAutoLocation';
import { useNow } from '@/hooks/useNow';
import { useUserCoords } from '@/hooks/useUserCoords';
import { distanceKm } from '@/lib/geo';
import {
  buildJummahCandidates,
  isJummahDay,
  nextFridayIso,
  rankJummah,
  rankJummahByDistance,
  type JummahMosqueInput,
  type RankedJummah,
} from '@/lib/jummahFinder';
import { osloDateKey } from '@/lib/time';
import { useActiveLocation } from '@/store/settings';

const TICK_MS = 30_000;
const NEARBY_RADIUS_KM = 25;

export type JummahFinderState = {
  ranked: RankedJummah[];
  isFriday: boolean;
  isoDate: string;
  hasLocation: boolean;
  isAbroad: boolean;
  locationName: string;
  mosqueCount: number;
  withJummahCount: number;
  nearbyWithoutJummahCount: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

export function useJummahFinder(): JummahFinderState {
  const now = useNow(TICK_MS);
  const coords = useUserCoords();
  const activeLocation = useActiveLocation();
  const { data: mosques, isLoading, isError, refetch } = useMosques();

  const todayIso = osloDateKey(now);
  const isFriday = isJummahDay(todayIso);
  const isoDate = isFriday ? todayIso : nextFridayIso(todayIso);

  const hasLocation = coords.source === 'gps';
  const isAbroad = hasLocation && !isInsideNorway(coords.lat, coords.lon);

  const inputs: JummahMosqueInput[] = useMemo(
    () =>
      (mosques ?? []).map((mosque) => ({
        orgNr: mosque.org_nr,
        name: mosque.name,
        address: mosque.address,
        city: mosque.post?.city ?? null,
        lat: mosque.lat,
        lon: mosque.lon,
        jummahTimes: mosque.jummah.map((entry) => entry.jummah),
      })),
    [mosques],
  );

  const candidates = useMemo(
    () => buildJummahCandidates(inputs, { lat: coords.lat, lon: coords.lon }, isoDate),
    [inputs, coords.lat, coords.lon, isoDate],
  );

  const minuteKey = Math.floor(now.getTime() / 60_000);
  const bucketedNow = useMemo(() => new Date(minuteKey * 60_000), [minuteKey]);

  const ranked = useMemo(
    () => (isFriday ? rankJummah(candidates, bucketedNow) : rankJummahByDistance(candidates)),
    [candidates, bucketedNow, isFriday],
  );

  const nearbyWithoutJummahCount = useMemo(() => {
    const withJummah = new Set(candidates.map((candidate) => candidate.orgNr));
    return inputs.filter((mosque) => {
      if (withJummah.has(mosque.orgNr)) return false;
      if (mosque.lat == null || mosque.lon == null) return false;
      return (
        distanceKm(coords.lat, coords.lon, Number(mosque.lat), Number(mosque.lon)) <=
        NEARBY_RADIUS_KM
      );
    }).length;
  }, [inputs, candidates, coords.lat, coords.lon]);

  return {
    ranked,
    isFriday,
    isoDate,
    hasLocation,
    isAbroad,
    locationName: activeLocation.name,
    mosqueCount: inputs.length,
    withJummahCount: candidates.length,
    nearbyWithoutJummahCount,
    isLoading,
    isError,
    refetch,
  };
}
