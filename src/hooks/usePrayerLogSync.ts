import { useEffect } from 'react';
import { AppState } from 'react-native';
import { usePrayerLog } from '@/store/prayerLog';

/**
 * Marks made outside the app (widget, Live Activity, notification actions) land in the shared
 * native store; merge them in every time the app comes to the foreground.
 */
export function usePrayerLogSync() {
  const syncFromNative = usePrayerLog((state) => state.syncFromNative);

  useEffect(() => {
    syncFromNative();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncFromNative();
    });
    return () => subscription.remove();
  }, [syncFromNative]);
}
