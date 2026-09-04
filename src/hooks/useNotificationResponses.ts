import { useEffect } from 'react';
import { addPrayerActionListener, consumeLastPrayerAction } from '@/lib/notifications';
import { prayerLogKey } from '@/lib/prayerLog';
import { usePrayerLog } from '@/store/prayerLog';

export function useNotificationResponses() {
  const setStatus = usePrayerLog((state) => state.setStatus);

  useEffect(() => {
    let remove: (() => void) | null = null;
    let cancelled = false;

    const handle = (
      isoDate: string,
      prayer: string,
      status: 'prayed' | 'skipped',
      shownAt: number | null,
    ) => {
      const existing = usePrayerLog.getState().log[prayerLogKey(isoDate, prayer)];
      if (existing && shownAt != null && existing.at > shownAt) return;
      setStatus(isoDate, prayer, status);
    };

    addPrayerActionListener(handle)
      .then((unsubscribe) => {
        if (cancelled) unsubscribe();
        else remove = unsubscribe;
      })
      .catch(() => {});
    const consume = () => {
      if (cancelled) return;
      consumeLastPrayerAction(handle).catch(() => {});
    };
    let stopHydration: (() => void) | null = null;
    if (usePrayerLog.persist.hasHydrated()) consume();
    else stopHydration = usePrayerLog.persist.onFinishHydration(consume);

    return () => {
      cancelled = true;
      stopHydration?.();
      remove?.();
    };
  }, [setStatus]);
}
