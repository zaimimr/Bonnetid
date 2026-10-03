import { useEffect } from 'react';
import { posthog } from '@/lib/telemetry';
import {
  useActiveLocation,
  useActiveMosque,
  useIsCalculatedMode,
  useSettings,
  useSettingsHydrated,
} from '@/store/settings';

export function useAnalyticsContext() {
  const location = useActiveLocation();
  const calculated = useIsCalculatedMode();
  const hasMosque = useActiveMosque() != null;
  const enabled = useSettings((state) => state.analyticsEnabled);
  const hydrated = useSettingsHydrated();
  const timesMode = calculated ? 'calculated' : hasMosque ? 'mosque' : 'kommune';

  useEffect(() => {
    if (!hydrated) return;
    if (enabled) void posthog.optIn();
    else void posthog.optOut();
  }, [hydrated, enabled]);

  useEffect(() => {
    void posthog.register({
      kommune: location.name,
      times_mode: timesMode,
      travel_mode: calculated,
    });
  }, [location.name, timesMode, calculated]);
}
