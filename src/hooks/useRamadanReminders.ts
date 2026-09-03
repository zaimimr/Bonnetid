import { useEffect, useMemo, useRef } from 'react';
import { usePrayerTimes } from '@/api/queries';
import { useHijriLookahead } from '@/hooks/useRamadanStatus';
import { ramadanDayNumbers, ramadanStatusFrom } from '@/lib/ramadan';
import {
  cancelRamadanNotifications,
  scheduleSuhoorReminders,
  type SuhoorReminder,
} from '@/lib/ramadanNotifications';
import {
  formatLocalClock,
  isoDateKey,
  osloDateKey,
  osloWallClockToDate,
  parseDayKey,
} from '@/lib/time';
import { useActiveLocation, useSettings } from '@/store/settings';

export function useRamadanReminders() {
  const enabled = useSettings((state) => state.ramadanRemindersEnabled);
  const location = useActiveLocation();

  const today = useMemo(() => new Date(), []);
  const nextMonthStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + 1, 1),
    [today],
  );

  const currentMonth = usePrayerTimes(location.iso, today.getFullYear(), today.getMonth() + 1);
  const nextMonth = usePrayerTimes(
    location.iso,
    nextMonthStart.getFullYear(),
    nextMonthStart.getMonth() + 1,
  );
  const hijriRows = useHijriLookahead(today);

  const todayIso = osloDateKey(today);

  const reminders = useMemo<SuhoorReminder[]>(() => {
    const status = ramadanStatusFrom(hijriRows, todayIso);
    if (!status.isRamadan && status.daysUntilRamadan == null) return [];

    const ramadanDays = ramadanDayNumbers(hijriRows);
    if (ramadanDays.size === 0) return [];

    const rows = [...(currentMonth.data ?? []), ...(nextMonth.data ?? [])];
    const built: SuhoorReminder[] = [];
    for (const row of rows) {
      if (!row.fajr) continue;
      const dayStart = parseDayKey(row.date);
      const isoDate = isoDateKey(dayStart);
      const dayOfRamadan = ramadanDays.get(isoDate);
      if (dayOfRamadan == null) continue;
      const fajrAt = osloWallClockToDate(dayStart, row.fajr);
      if (Number.isNaN(fajrAt.getTime())) continue;
      built.push({ isoDate, dayOfRamadan, fajrAt, fajrClock: formatLocalClock(fajrAt) });
    }
    return built;
  }, [hijriRows, todayIso, currentMonth.data, nextMonth.data]);

  const lastSyncKey = useRef('');

  useEffect(() => {
    const syncKey = [
      enabled,
      location.iso,
      location.name,
      reminders.length,
      reminders[0]?.isoDate ?? '',
      reminders[reminders.length - 1]?.isoDate ?? '',
    ].join('|');
    if (syncKey === lastSyncKey.current) return;
    lastSyncKey.current = syncKey;

    if (!enabled || reminders.length === 0) {
      cancelRamadanNotifications().catch(() => {});
      return;
    }

    scheduleSuhoorReminders(reminders, location.name).catch(() => {});
  }, [enabled, location.iso, location.name, reminders]);
}
