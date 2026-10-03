import { useEffect } from 'react';
import { posthog } from '@/lib/telemetry';
import { useActiveLocation, useActiveMosque, useIsCalculatedMode, useSettings } from '@/store/settings';

export function useAnalyticsContext() {
  const location = useActiveLocation();
  const calculated = useIsCalculatedMode();
  const hasMosque = useActiveMosque() != null;
  const enabled = useSettings((state) => state.analyticsEnabled);
  const timesMode = calculated ? 'calculated' : hasMosque ? 'mosque' : 'kommune';

  useEffect(() => {
    if (enabled) void posthog.optIn();
    else void posthog.optOut();
  }, [enabled]);

  useEffect(() => {
    void posthog.register({
      kommune: location.name,
      times_mode: timesMode,
      travel_mode: calculated,
    });
  }, [location.name, timesMode, calculated]);
}
