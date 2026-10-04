import { useMemo } from 'react';
import { useMosques } from '@/api/queries';
import type { Mosque } from '@/api/types';
import type { EidHeroPrayer } from '@/components/prayer/NextPrayerHero';
import { useSharedPosition } from '@/hooks/useTravelDetection';
import { heroEidSource, nearbyEidMosques, type EidMode } from '@/lib/eidMode';
import { eidPrayerTitle } from '@/lib/hijri';
import { formatZonedClock } from '@/lib/time';
import { useActiveLocation } from '@/store/settings';

export function useEidPrayers(
  mode: EidMode | null,
  myMosque: Mosque | null,
  now: Date,
): { hero: EidHeroPrayer | null; nearby: Mosque[] } {
  const { data: mosques } = useMosques();
  const location = useActiveLocation();
  const { coords } = useSharedPosition();
  const lat = coords?.lat ?? location.lat;
  const lon = coords?.lon ?? location.lon;

  const nearby = useMemo(
    () => (mode ? nearbyEidMosques(mosques ?? [], { lat, lon }) : []),
    [mode, mosques, lat, lon],
  );

  const hero = useMemo(() => {
    if (!mode) return null;
    const source = heroEidSource(myMosque, nearby, mode.eidIso, now);
    if (!source) return null;
    return {
      title: eidPrayerTitle(mode.eid),
      mosqueName: source.mosque.name,
      times: source.prayers.map((date) => formatZonedClock(date, 'oslo')),
      next: source.prayers.find((date) => date.getTime() > now.getTime()) ?? null,
    };
  }, [mode, myMosque, nearby, now]);

  return { hero, nearby };
}
