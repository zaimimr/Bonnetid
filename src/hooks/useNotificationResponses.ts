import { useEffect } from 'react';
import { addPrayerActionListener, consumeLastPrayerAction } from '@/lib/notifications';
import { usePrayerLog } from '@/store/prayerLog';

export function useNotificationResponses() {
  const setStatus = usePrayerLog((state) => state.setStatus);

  useEffect(() => {
    let remove: (() => void) | null = null;
    let cancelled = false;

    const handle = (isoDate: string, prayer: string, status: 'prayed' | 'skipped') => {
      setStatus(isoDate, prayer, status);
    };

    addPrayerActionListener(handle)
      .then((unsubscribe) => {
        if (cancelled) unsubscribe();
        else remove = unsubscribe;
      })
      .catch(() => {});
    consumeLastPrayerAction(handle).catch(() => {});

    return () => {
      cancelled = true;
      remove?.();
    };
  }, [setStatus]);
}
