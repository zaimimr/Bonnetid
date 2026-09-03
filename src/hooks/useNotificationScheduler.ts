import { useEffect, useRef } from 'react';
import { usePrayerTimes } from '@/api/queries';
import { buildDaySchedule, type PrayerName } from '@/lib/prayerSchedule';
import {
  cancelPrayerNotifications,
  syncPrayerNotifications,
  type ScheduledPrayer,
} from '@/lib/notifications';
import { buildPrayerReminders, type ScheduleDay } from '@/lib/prayerReminders';
import { isoDateKey, parseDayKey } from '@/lib/time';
import { useEffectiveAsrMethod } from '@/hooks/useEffectiveAsrMethod';
import { usePrayerLog } from '@/store/prayerLog';
import { NOTIFIABLE_PRAYERS, useActiveLocation, useSettings } from '@/store/settings';

export function useNotificationScheduler() {
  const enabled = useSettings((state) => state.notificationsEnabled);
  const sound = useSettings((state) => state.notificationSound);
  const notificationPrayers = useSettings((state) => state.notificationPrayers);
  const endReminderEnabled = useSettings((state) => state.endReminderEnabled);
  const log = usePrayerLog((state) => state.log);
  const asrMethod = useEffectiveAsrMethod();
  const location = useActiveLocation();

  const today = new Date();
  const todayIso = isoDateKey(today);
  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const currentMonth = usePrayerTimes(location.iso, today.getFullYear(), today.getMonth() + 1);
  const nextMonth = usePrayerTimes(location.iso, nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1);

  const lastSyncKey = useRef('');

  useEffect(() => {
    const dataReady = currentMonth.data != null;
    if (!dataReady) return;

    const prayersKey = NOTIFIABLE_PRAYERS.filter((prayer) => notificationPrayers[prayer]).join(',');
    const marksKey = Object.entries(log)
      .filter(([key]) => key >= todayIso)
      .map(([key, entry]) => `${key}:${entry.status}`)
      .sort()
      .join(',');
    const syncKey = [
      enabled,
      sound,
      prayersKey,
      endReminderEnabled,
      marksKey,
      todayIso,
      location.iso,
      asrMethod,
      currentMonth.dataUpdatedAt,
      nextMonth.dataUpdatedAt,
    ].join('|');
    if (syncKey === lastSyncKey.current) return;
    lastSyncKey.current = syncKey;

    if (!enabled) {
      cancelPrayerNotifications().catch(() => {});
      return;
    }

    const now = new Date();
    const days: ScheduleDay[] = [...(currentMonth.data ?? []), ...(nextMonth.data ?? [])].map(
      (day) => {
        const dayStart = parseDayKey(day.date);
        return {
          isoDate: isoDateKey(dayStart),
          schedule: buildDaySchedule(day, dayStart, asrMethod),
        };
      },
    );

    const isEnabled = (prayer: PrayerName) =>
      prayer !== 'fajr_endtime' && notificationPrayers[prayer];

    const adhan: ScheduledPrayer[] = days.flatMap((day) =>
      day.schedule
        .filter(
          (entry) =>
            entry.isPrayer && isEnabled(entry.name) && entry.date.getTime() > now.getTime(),
        )
        .map((entry) => ({ isoDate: day.isoDate, entry })),
    );

    const reminders = endReminderEnabled
      ? buildPrayerReminders(days, log, now, isEnabled)
      : [];

    syncPrayerNotifications({
      adhan,
      reminders,
      locationName: location.name,
      soundKey: sound,
    }).catch(() => {});
  }, [
    enabled,
    sound,
    notificationPrayers,
    endReminderEnabled,
    log,
    todayIso,
    asrMethod,
    location.iso,
    location.name,
    currentMonth.data,
    currentMonth.dataUpdatedAt,
    nextMonth.data,
    nextMonth.dataUpdatedAt,
  ]);
}
