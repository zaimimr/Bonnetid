export type DailyTotals = Record<string, Record<string, number>>;

export const KEEP_DAYS = 60;

export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function daysBefore(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - days);
}

export function addDaily(daily: DailyTotals, key: string, now: Date): DailyTotals {
  const today = dayKey(now);
  const oldest = dayKey(daysBefore(now, KEEP_DAYS - 1));
  const next: DailyTotals = {};
  for (const [day, counts] of Object.entries(daily)) {
    if (day >= oldest) next[day] = counts;
  }
  const counts = next[today] ?? {};
  next[today] = { ...counts, [key]: (counts[key] ?? 0) + 1 };
  return next;
}

function sum(counts: Record<string, number> | undefined): number {
  return Object.values(counts ?? {}).reduce((total, value) => total + value, 0);
}

export function todayCount(daily: DailyTotals, now: Date, key?: string): number {
  const counts = daily[dayKey(now)];
  return key ? (counts?.[key] ?? 0) : sum(counts);
}

export function weekCount(daily: DailyTotals, now: Date): number {
  let total = 0;
  for (let offset = 0; offset < 7; offset++) total += sum(daily[dayKey(daysBefore(now, offset))]);
  return total;
}

export function allTimeCount(totals: Record<string, number>): number {
  return sum(totals);
}

export function rankedTotals(totals: Record<string, number>): [string, number][] {
  return Object.entries(totals)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
}
