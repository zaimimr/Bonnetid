import type { PrayerEntry, PrayerName } from './prayerSchedule';

export const MIDNIGHT_MARK = 'midnight';

export type TimelineMarkName = PrayerName | typeof MIDNIGHT_MARK;

export type TimelineMark = {
  name: TimelineMarkName;
  label: string;
  at: Date;
  fraction: number;
  isPrayer: boolean;
};

export type DayTimeline = {
  dayStart: Date;
  dayLength: number;
  marks: TimelineMark[];
};

function fractionWithinDay(at: Date, dayStart: Date, length: number): number | null {
  const value = (at.getTime() - dayStart.getTime()) / length;
  if (Number.isNaN(value) || value < 0 || value > 1) return null;
  return value;
}

export function buildDayTimeline(schedule: PrayerEntry[], dayStart: Date): DayTimeline | null {
  if (schedule.length === 0 || Number.isNaN(dayStart.getTime())) return null;

  const nextDayStart = new Date(dayStart);
  nextDayStart.setDate(nextDayStart.getDate() + 1);
  const dayLength = nextDayStart.getTime() - dayStart.getTime();
  if (dayLength <= 0) return null;

  const marks: TimelineMark[] = [];

  for (const entry of schedule) {
    const fraction = fractionWithinDay(entry.date, dayStart, dayLength);
    if (fraction == null) continue;
    marks.push({
      name: entry.name,
      label: entry.label,
      at: entry.date,
      fraction,
      isPrayer: entry.isPrayer,
    });
  }

  const isha = schedule.find((entry) => entry.name === 'isha');
  if (isha?.end) {
    const fraction = fractionWithinDay(isha.end.date, dayStart, dayLength);
    if (fraction != null) {
      marks.push({
        name: MIDNIGHT_MARK,
        label: isha.end.label,
        at: isha.end.date,
        fraction,
        isPrayer: false,
      });
    }
  }

  if (marks.length === 0) return null;

  marks.sort((left, right) => left.at.getTime() - right.at.getTime());
  return { dayStart, dayLength, marks };
}

export function fractionOfDay(timeline: DayTimeline, at: Date): number {
  const value = (at.getTime() - timeline.dayStart.getTime()) / timeline.dayLength;
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 1);
}

function rank(mark: TimelineMark, highlightAt: Date | null): number {
  if (highlightAt && mark.at.getTime() === highlightAt.getTime()) return 0;
  if (mark.name === MIDNIGHT_MARK) return 3;
  return mark.isPrayer ? 1 : 2;
}

export function placeableMarks(
  marks: TimelineMark[],
  minGap: number,
  highlightAt: Date | null,
): TimelineMark[] {
  const byPriorityThenTime = [...marks].sort((left, right) => {
    const difference = rank(left, highlightAt) - rank(right, highlightAt);
    if (difference !== 0) return difference;
    return left.at.getTime() - right.at.getTime();
  });

  const placed: TimelineMark[] = [];
  for (const mark of byPriorityThenTime) {
    const overlapsAlreadyPlaced = placed.some(
      (other) => Math.abs(other.fraction - mark.fraction) < minGap,
    );
    if (overlapsAlreadyPlaced) continue;
    placed.push(mark);
  }

  return placed.sort((left, right) => left.at.getTime() - right.at.getTime());
}
