import { useEffect } from 'react';
import { addNotificationOpenListener, wasOpenedFromNotification } from '@/lib/notifications';
import { useSession } from '@/store/session';

export function useNotificationOpenFlag() {
  useEffect(() => {
    const mark = useSession.getState().setOpenedFromNotification;
    let remove: (() => void) | null = null;
    let cancelled = false;
    wasOpenedFromNotification().then((opened) => {
      if (opened && !cancelled) mark();
    }).catch(() => {});
    addNotificationOpenListener(mark)
      .then((unsubscribe) => {
        if (cancelled) unsubscribe();
        else remove = unsubscribe;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      remove?.();
    };
  }, []);
}
