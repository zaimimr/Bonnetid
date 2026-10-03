import { useEffect } from 'react';
import { useSegments } from 'expo-router';
import { posthog } from '@/lib/telemetry';

export function useScreenTracking() {
  const segments = useSegments();
  const screen = segments.filter((segment) => !segment.startsWith('(')).join('/') || 'index';

  useEffect(() => {
    posthog.screen(screen);
  }, [screen]);
}
