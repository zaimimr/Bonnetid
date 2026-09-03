import { useEffect } from 'react';
import { AppState } from 'react-native';
import { usePrayerLog } from '@/store/prayerLog';

export function usePrayerLogSync(now: Date) {
  const syncFromNative = usePrayerLog((state) => state.syncFromNative);

  useEffect(() => {
    syncFromNative();
  }, [syncFromNative, now]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncFromNative();
    });
    return () => subscription.remove();
  }, [syncFromNative]);
}
