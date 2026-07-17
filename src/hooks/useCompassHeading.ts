import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type CompassState = {
  heading: number | null;
  accuracy: number | null;
  permissionDenied: boolean;
};

export function useCompassHeading(): CompassState {
  const [state, setState] = useState<CompassState>({
    heading: null,
    accuracy: null,
    permissionDenied: false,
  });

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    async function subscribe() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!cancelled) setState((current) => ({ ...current, permissionDenied: true }));
        return;
      }

      subscription = await Location.watchHeadingAsync((reading) => {
        const heading = reading.trueHeading >= 0 ? reading.trueHeading : reading.magHeading;
        if (!cancelled) {
          setState({ heading, accuracy: reading.accuracy, permissionDenied: false });
        }
      });
    }

    subscribe().catch(() => {});
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return state;
}
