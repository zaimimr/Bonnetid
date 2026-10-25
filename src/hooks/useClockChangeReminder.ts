import { useEffect, useMemo, useRef } from 'react';
import { zoneFor } from '@/hooks/usePrayerMonth';
import { clockChangeReminders } from '@/lib/clockChange';
import {
  cancelClockChangeNotifications,
  scheduleClockChangeReminders,
} from '@/lib/clockChangeNotifications';
import { osloDateKey, osloWallClockToDate } from '@/lib/time';
import { useActiveLocation, useSettings } from '@/store/settings';

export function useClockChangeReminder(now: Date) {
  const notificationsEnabled = useSettings((state) => state.notificationsEnabled);
  const location = useActiveLocation();
  const inNorway = zoneFor(location) === 'oslo';
  const todayIso = osloDateKey(now);
  const reminders = useMemo(
    () =>
      notificationsEnabled && inNorway
        ? clockChangeReminders(osloWallClockToDate(todayIso, '00:00'))
        : [],
    [notificationsEnabled, inNorway, todayIso],
  );
  const syncKey = reminders.map((reminder) => `${reminder.eveIso}|${reminder.body}`).join(',');

  const lastSyncKey = useRef<string | null>(null);

  useEffect(() => {
    if (syncKey === lastSyncKey.current) return;
    lastSyncKey.current = syncKey;

    if (reminders.length === 0) {
      cancelClockChangeNotifications().catch(() => {});
      return;
    }
    scheduleClockChangeReminders(reminders).catch(() => {});
  }, [syncKey, reminders]);
}
