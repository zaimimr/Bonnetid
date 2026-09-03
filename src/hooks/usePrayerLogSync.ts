import { useEffect } from 'react';
import { AppState } from 'react-native';
import { usePrayerLog } from '@/store/prayerLog';

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
