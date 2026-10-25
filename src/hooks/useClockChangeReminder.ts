import { useEffect, useRef } from 'react';
import { zoneFor } from '@/hooks/usePrayerMonth';
import { clockChangeReminder } from '@/lib/clockChange';
import {
  cancelClockChangeNotifications,
  scheduleClockChangeReminder,
} from '@/lib/clockChangeNotifications';
import { useActiveLocation, useSettings } from '@/store/settings';

export function useClockChangeReminder(now: Date) {
  const notificationsEnabled = useSettings((state) => state.notificationsEnabled);
  const location = useActiveLocation();
  const inNorway = zoneFor(location) === 'oslo';
  const reminder = notificationsEnabled && inNorway ? clockChangeReminder(now) : null;
  const syncKey = reminder ? `${reminder.eveIso}|${reminder.body}` : '';

  const lastSyncKey = useRef<string | null>(null);

  useEffect(() => {
    if (syncKey === lastSyncKey.current) return;
    lastSyncKey.current = syncKey;

    if (!reminder) {
      cancelClockChangeNotifications().catch(() => {});
      return;
    }
    scheduleClockChangeReminder(reminder).catch(() => {});
  }, [syncKey, reminder]);
}
