import { useEffect, useMemo, useRef } from 'react';
import { usePrayerTimes } from '@/api/queries';
import { useHijriLookahead } from '@/hooks/useHijriSeason';
import {
  fastOccasionsFrom,
  mergeFastingReminders,
  occasionFastingReminders,
  ramadanFastingReminders,
  type FastingReminder,
  type FastToggles,
  type RamadanFastingDay,
} from '@/lib/fasting';
import { RAMADAN_SEASON, seasonDayNumbers } from '@/lib/hijriSeason';
import {
  cancelFastingNotifications,
  scheduleFastingReminders,
} from '@/lib/fastingNotifications';
import {
  formatLocalClock,
  isoDateKey,
  osloDateKey,
  osloDayStart,
  osloWallClockToDate,
  parseDayKey,
} from '@/lib/time';
import { useActiveLocation, useSettings } from '@/store/settings';

export function useFastingReminders(now: Date) {
  const notificationsEnabled = useSettings((state) => state.notificationsEnabled);
  const ramadanEnabled = useSettings((state) => state.ramadanRemindersEnabled);
  const arafahEnabled = useSettings((state) => state.dhulHijjahRemindersEnabled);
  const voluntaryFasts = useSettings((state) => state.voluntaryFasts);
  const location = useActiveLocation();

  const today = osloDayStart(now);
  const todayIso = osloDateKey(now);
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const currentMonth = usePrayerTimes(location.iso, today.getFullYear(), today.getMonth() + 1);
  const nextMonth = usePrayerTimes(
    location.iso,
    nextMonthStart.getFullYear(),
    nextMonthStart.getMonth() + 1,
  );
  const hijriRows = useHijriLookahead(now);

  const toggles = useMemo<FastToggles>(
    () => ({
      arafah: notificationsEnabled && arafahEnabled,
      ashura: notificationsEnabled && voluntaryFasts.ashura,
      whiteDays: notificationsEnabled && voluntaryFasts.whiteDays,
      mondayThursday: notificationsEnabled && voluntaryFasts.mondayThursday,
    }),
    [notificationsEnabled, arafahEnabled, voluntaryFasts],
  );

  const reminders = useMemo<FastingReminder[]>(() => {
    const suhoorEnabled = notificationsEnabled && ramadanEnabled;
    const ramadanDays = suhoorEnabled
      ? seasonDayNumbers(hijriRows, RAMADAN_SEASON)
      : new Map<string, number>();
    const fastingDays: RamadanFastingDay[] = [];
    const seenDates = new Set<string>();

    if (ramadanDays.size > 0) {
      for (const row of [...(currentMonth.data ?? []), ...(nextMonth.data ?? [])]) {
        if (!row.fajr) continue;
        const dayStart = parseDayKey(row.date);
        const isoDate = isoDateKey(dayStart);
        if (seenDates.has(isoDate)) continue;
        const dayOfRamadan = ramadanDays.get(isoDate);
        if (dayOfRamadan == null) continue;
        const fajrAt = osloWallClockToDate(dayStart, row.fajr);
        if (Number.isNaN(fajrAt.getTime())) continue;
        seenDates.add(isoDate);
        fastingDays.push({
          isoDate,
          dayOfRamadan,
          fajrAt,
          fajrClock: formatLocalClock(fajrAt),
        });
      }
    }

    const occasions = fastOccasionsFrom(hijriRows, toggles, todayIso);

    return mergeFastingReminders(
      ramadanFastingReminders(fastingDays, location.name),
      occasionFastingReminders(occasions),
    );
  }, [
    notificationsEnabled,
    ramadanEnabled,
    hijriRows,
    toggles,
    todayIso,
    currentMonth.data,
    nextMonth.data,
    location.name,
  ]);

  const lastSyncKey = useRef('');

  useEffect(() => {
    const syncKey = [
      todayIso,
      location.iso,
      location.name,
      reminders.length,
      reminders.map((reminder) => reminder.isoDate).join(','),
    ].join('|');
    if (syncKey === lastSyncKey.current) return;
    lastSyncKey.current = syncKey;

    if (reminders.length === 0) {
      cancelFastingNotifications().catch(() => {});
      return;
    }

    scheduleFastingReminders(reminders).catch(() => {});
  }, [todayIso, location.iso, location.name, reminders]);
}
