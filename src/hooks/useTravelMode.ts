import { useEffect, useRef } from 'react';
import { useLocations } from '@/api/queries';
import { detectNearestLocation } from '@/hooks/useAutoLocation';
import { resolvePlace, useTravelState } from '@/hooks/useTravelDetection';
import { distanceKm } from '@/lib/geo';
import { track, trackError } from '@/lib/telemetry';
import { travelPromptKey } from '@/lib/travelMode';
import { calculatedLocation, useSettings } from '@/store/settings';

const RESYNC_DISTANCE_KM = 75;

export function useTravelMode() {
  const { data: locations } = useLocations();
  const location = useSettings((state) => state.location);
  const home = useSettings((state) => state.homeLocation);
  const setLocation = useSettings((state) => state.setLocation);
  const { signal, coords } = useTravelState();
  const applied = useRef<string | null>(null);

  const travelling = location?.mode === 'calculated';

  useEffect(() => {
    if (signal === 'unknown') return;

    if (signal === 'abroad') {
      if (!coords) return;
      const key = travelPromptKey(coords, 0);
      const moved =
        !travelling ||
        !location ||
        distanceKm(location.lat, location.lon, coords.lat, coords.lon) >= RESYNC_DISTANCE_KM;
      if (!moved || applied.current === key) return;
      applied.current = key;

      resolvePlace(coords)
        .then((place) => {
          setLocation(calculatedLocation(place.name, coords.lat, coords.lon, place));
          track('travel_mode_chosen', {
            choice: travelling ? 'moved' : 'calculated',
            country: place.countryCode ?? 'unknown',
          });
        })
        .catch((error) => trackError(error, 'travel-mode-enter'));
      return;
    }

    if (!travelling) return;
    applied.current = null;

    if (!locations) return;
    detectNearestLocation(locations)
      .then((detected) => {
        const next = detected ?? home;
        if (!next) return;
        setLocation(next);
        track('travel_mode_chosen', { choice: 'returned' });
      })
      .catch((error) => trackError(error, 'travel-mode-exit'));
  }, [signal, coords, travelling, location, locations, home, setLocation]);
}
