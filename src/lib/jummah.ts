import { isoDateIsFriday, osloTimeToLocalClock, osloWallClockToDate } from './time.ts';

const MINUTE_MS = 60_000;

/** How long after the last congregation the Friday prayer still stands in for Dhuhr. */
export const JUMMAH_GRACE_MINUTES = 30;

type JummahEntry = { jummah: string };

export type JummahSlot = {
  /** Local wall clock of the first congregation, the time every surface prints. */
  at: string;
  /** When the slot goes back to being an ordinary Dhuhr. */
  endsAt: Date;
};

export function jummahSlotFor(isoDate: string, jummah: JummahEntry[]): JummahSlot | null {
  if (!isoDateIsFriday(isoDate)) return null;

  const first = jummah[0]?.jummah;
  const last = jummah[jummah.length - 1]?.jummah;
  if (!first || !last) return null;

  const lastInstant = osloWallClockToDate(isoDate, last);
  if (Number.isNaN(lastInstant.getTime())) return null;

  return {
    at: osloTimeToLocalClock(isoDate, first) ?? first,
    endsAt: new Date(lastInstant.getTime() + JUMMAH_GRACE_MINUTES * MINUTE_MS),
  };
}

export function jummahSlotIsOpen(slot: JummahSlot | null, now?: Date | null): boolean {
  if (!slot) return false;
  if (!now) return true;
  return now.getTime() < slot.endsAt.getTime();
}
