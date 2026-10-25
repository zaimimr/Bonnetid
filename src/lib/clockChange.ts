import { t } from './i18n.ts';
import { osloDateKey, osloWallClockToDate, upcomingOsloClockChanges } from './time.ts';

const HOUR_MS = 60 * 60 * 1000;
const EVENING_CLOCK = '20:00';
export const CLOCK_CHANGE_LOOKAHEAD = 4;

export type ClockChangeReminder = {
  eveIso: string;
  fireAt: Date;
  title: string;
  body: string;
};

export function clockChangeReminders(
  now: Date,
  count: number = CLOCK_CHANGE_LOOKAHEAD,
): ClockChangeReminder[] {
  return upcomingOsloClockChanges(now, count + 1)
    .map((change) => {
      const eveIso = osloDateKey(new Date(change.at.getTime() - 12 * HOUR_MS));
      return {
        eveIso,
        fireAt: osloWallClockToDate(eveIso, EVENING_CLOCK),
        title: t('notifications.clockChangeTitle'),
        body:
          change.direction === 'forward'
            ? t('notifications.clockChangeForward')
            : t('notifications.clockChangeBack'),
      };
    })
    .filter((reminder) => reminder.fireAt.getTime() > now.getTime())
    .slice(0, count);
}
