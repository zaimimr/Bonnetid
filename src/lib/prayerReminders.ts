import { statusOf, type PrayerLog } from './prayerLog';
import type { PrayerEntry, PrayerName } from './prayerSchedule';

export const REMINDER_LEAD_MINUTES = 30;
export const SHORT_WINDOW_MINUTES = 45;

const MINUTE_MS = 60 * 1000;

export type ScheduleDay = {
  isoDate: string;
  schedule: PrayerEntry[];
};

export type PrayerReminder = {
  isoDate: string;
  prayer: PrayerName;
  label: string;
  fireAt: Date;
  endLabel: string;
  endClock: string;
};

export function formatTimeOfDay(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function reminderFireDate(entry: PrayerEntry): Date | null {
  if (!entry.end) return null;
  const start = entry.date.getTime();
  const end = entry.end.date.getTime();
  if (end <= start) return null;
  const window = end - start;
  const fireAt =
    window < SHORT_WINDOW_MINUTES * MINUTE_MS
      ? start + Math.round(window / 2)
      : end - REMINDER_LEAD_MINUTES * MINUTE_MS;
  return new Date(fireAt);
}

export function buildPrayerReminders(
  days: ScheduleDay[],
  log: PrayerLog,
  now: Date,
  isEnabled: (prayer: PrayerName) => boolean = () => true,
): PrayerReminder[] {
  const time = now.getTime();
  const reminders: PrayerReminder[] = [];

  for (const day of days) {
    for (const entry of day.schedule) {
      const end = entry.end;
      if (!entry.isPrayer || !end || !isEnabled(entry.name)) continue;
      if (statusOf(log, day.isoDate, entry.name) !== null) continue;
      const fireAt = reminderFireDate(entry);
      if (!fireAt || fireAt.getTime() <= time) continue;
      reminders.push({
        isoDate: day.isoDate,
        prayer: entry.name,
        label: entry.label,
        fireAt,
        endLabel: end.label,
        endClock: formatTimeOfDay(end.date),
      });
    }
  }

  return reminders.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}

export function reminderTitle(label: string): string {
  return `Har du bedt ${label}?`;
}

export function reminderBody(reminder: PrayerReminder): string {
  return `${reminder.label} går ut kl. ${reminder.endClock} (${reminder.endLabel})`;
}
