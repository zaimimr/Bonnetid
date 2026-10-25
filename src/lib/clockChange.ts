import { t } from './i18n.ts';
import { nextOsloClockChange, osloDateKey, osloWallClockToDate } from './time.ts';

const HOUR_MS = 60 * 60 * 1000;
const EVENING_CLOCK = '20:00';

export type ClockChangeReminder = {
  eveIso: string;
  fireAt: Date;
  title: string;
  body: string;
};

export function clockChangeReminder(now: Date): ClockChangeReminder | null {
  const change = nextOsloClockChange(now);
  if (!change) return null;
  const eveIso = osloDateKey(new Date(change.at.getTime() - 12 * HOUR_MS));
  const fireAt = osloWallClockToDate(eveIso, EVENING_CLOCK);
  if (Number.isNaN(fireAt.getTime()) || fireAt.getTime() <= now.getTime()) return null;
  return {
    eveIso,
    fireAt,
    title: t('notifications.clockChangeTitle'),
    body:
      change.direction === 'forward'
        ? t('notifications.clockChangeForward')
        : t('notifications.clockChangeBack'),
  };
}
