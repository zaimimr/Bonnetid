import { useEffect, useRef } from 'react';
import { usePrayerTimes } from '@/api/queries';
import { buildDaySchedule, type PrayerEntry } from '@/lib/prayerSchedule';
import {
  cancelAllPrayerNotifications,
  schedulePrayerNotifications,
} from '@/lib/notifications';
import { parseDayKey } from '@/lib/time';
import { useActiveLocation, useSettings } from '@/store/settings';

export function useNotificationScheduler() {
  const enabled = useSettings((state) => state.notificationsEnabled);
  const asrMethod = useSettings((state) => state.asrMethod);
  const location = useActiveLocation();

  const today = new Date();
  const nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  const currentMonth = usePrayerTimes(location.pk, today.getFullYear(), today.getMonth() + 1);
  const nextMonth = usePrayerTimes(location.pk, nextWeek.getFullYear(), nextWeek.getMonth() + 1);

  const lastSyncKey = useRef('');

  useEffect(() => {
    const dataReady = currentMonth.data != null;
    if (!dataReady) return;

    const syncKey = [
      enabled,
      location.pk,
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
    const entries: PrayerEntry[] = days.flatMap((day) =>
      buildDaySchedule(day, parseDayKey(day.date), asrMethod),
    );

    schedulePrayerNotifications(entries, location.name).catch(() => {});
  }, [
    enabled,
    asrMethod,
    location.pk,
    location.name,
    currentMonth.data,
    currentMonth.dataUpdatedAt,
    nextMonth.data,
    nextMonth.dataUpdatedAt,
  ]);
}
