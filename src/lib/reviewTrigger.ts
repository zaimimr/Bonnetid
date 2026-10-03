export type ReviewTrigger = 'prayers_logged' | 'active_days' | 'mosque_return';

export type ReviewHistory = {
  activeDays: string[];
  mosqueSelectedOn: string | null;
  lastRequestedAt: number | null;
  lastRequestedVersion: string | null;
};

export type ReviewContext = {
  today: string;
  now: number;
  appVersion: string;
  prayersLogged: number;
  suppressed: boolean;
};

export const PRAYERS_FOR_REVIEW = 5;
export const DAYS_FOR_REVIEW = 7;
export const REASK_AFTER_MS = 120 * 24 * 60 * 60 * 1000;
const MAX_ACTIVE_DAYS = 30;

export function localDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addActiveDay(days: string[], today: string): string[] {
  return [...new Set([...days, today])].sort().slice(-MAX_ACTIVE_DAYS);
}

function mayAsk(history: ReviewHistory, context: ReviewContext): boolean {
  if (history.lastRequestedAt == null) return true;
  return (
    context.now - history.lastRequestedAt >= REASK_AFTER_MS &&
    history.lastRequestedVersion !== context.appVersion
  );
}

export function reviewTrigger(history: ReviewHistory, context: ReviewContext): ReviewTrigger | null {
  if (context.suppressed || !mayAsk(history, context)) return null;
  if (context.prayersLogged >= PRAYERS_FOR_REVIEW) return 'prayers_logged';
  if (history.activeDays.length >= DAYS_FOR_REVIEW) return 'active_days';
  if (history.mosqueSelectedOn != null && history.mosqueSelectedOn < context.today) return 'mosque_return';
  return null;
}
