import { useEffect, useRef } from 'react';
import { usePrayerTimes } from '@/api/queries';
import { buildDaySchedule, type PrayerEntry } from '@/lib/prayerSchedule';
import {
  cancelAllPrayerNotifications,
  schedulePrayerNotifications,
} from '@/lib/notifications';
import { parseDayKey } from '@/lib/time';
import { useEffectiveAsrMethod } from '@/hooks/useEffectiveAsrMethod';
import { NOTIFIABLE_PRAYERS, useActiveLocation, useSettings } from '@/store/settings';

export function useNotificationScheduler() {
  const enabled = useSettings((state) => state.notificationsEnabled);
  const sound = useSettings((state) => state.notificationSound);
  const notificationPrayers = useSettings((state) => state.notificationPrayers);
  const asrMethod = useEffectiveAsrMethod();
  const location = useActiveLocation();

  const today = new Date();
  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const currentMonth = usePrayerTimes(location.iso, today.getFullYear(), today.getMonth() + 1);
  const nextMonth = usePrayerTimes(location.iso, nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1);

  const lastSyncKey = useRef('');

  useEffect(() => {
    const dataReady = currentMonth.data != null;
    if (!dataReady) return;

    const prayersKey = NOTIFIABLE_PRAYERS.filter((prayer) => notificationPrayers[prayer]).join(',');
    const syncKey = [
      enabled,
      sound,
      prayersKey,
      location.iso,
      asrMethod,
      currentMonth.dataUpdatedAt,
      nextMonth.dataUpdatedAt,
    ].join('|');
    if (syncKey === lastSyncKey.current) return;
    lastSyncKey.current = syncKey;

    if (!enabled) {
      cancelAllPrayerNotifications().catch(() => {});
      return;
    }

    const days = [...(currentMonth.data ?? []), ...(nextMonth.data ?? [])];
    const entries: PrayerEntry[] = days
      .flatMap((day) => buildDaySchedule(day, parseDayKey(day.date), asrMethod))
      .filter((entry) => entry.name === 'fajr_endtime' || notificationPrayers[entry.name]);

    schedulePrayerNotifications(entries, location.name, sound).catch(() => {});
  }, [
    enabled,
    sound,
    notificationPrayers,
    asrMethod,
    location.iso,
    location.name,
    currentMonth.data,
    currentMonth.dataUpdatedAt,
    nextMonth.data,
    nextMonth.dataUpdatedAt,
  ]);
}
