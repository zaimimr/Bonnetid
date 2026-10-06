import { useEffect } from 'react';
import { useIsFocused } from 'expo-router';
import { prayerLogKey, TRACKED_PRAYERS } from '@/lib/prayerLog';
import { reviewTrigger, type ReviewTrigger } from '@/lib/reviewTrigger';
import { requestInAppReview } from '@/lib/review';
import { appVersion, track } from '@/lib/telemetry';
import { usePrayerLog } from '@/store/prayerLog';
import { useSession } from '@/store/session';
import { useOnboardingDone, useSettings } from '@/store/settings';

const PROMPT_DELAY_MS = 2500;
const DAY_COMPLETED_DELAY_MS = 1200;

function countPrayed(): number {
  return Object.values(usePrayerLog.getState().log).filter((entry) => entry.status === 'prayed').length;
}

function triggerNow(dayCompleted: boolean, suppressed: boolean): ReviewTrigger | null {
  const settings = useSettings.getState();
  return reviewTrigger(
    {
      activeDays: settings.activeDays,
      lastRequestedAt: settings.reviewRequestedAt,
      lastRequestedVersion: settings.reviewRequestedVersion,
    },
    { now: Date.now(), appVersion: appVersion(), prayersLogged: countPrayed(), dayCompleted, suppressed },
  );
}

async function ask(trigger: ReviewTrigger) {
  if (!useSession.getState().claimInterruption('review')) return;
  const shown = await requestInAppReview();
  if (!shown) return;
  useSettings.getState().markReviewRequested(appVersion());
  track('review_prompt_requested', { trigger });
}

export function promptReviewIfDayCompleted(isoDate: string) {
  const log = usePrayerLog.getState().log;
  const completed = TRACKED_PRAYERS.every(
    (prayer) => log[prayerLogKey(isoDate, prayer)]?.status === 'prayed',
  );
  if (!completed || !useSettings.getState().onboardingDone) return;
  const session = useSession.getState();
  const trigger = triggerNow(true, session.interruption != null || session.errorTracked);
  if (trigger) setTimeout(() => ask(trigger), DAY_COMPLETED_DELAY_MS);
}

export function useReviewPrompt() {
  const focused = useIsFocused();
  const onboardingDone = useOnboardingDone();
  const activeDays = useSettings((state) => state.activeDays);
  const interruption = useSession((state) => state.interruption);
  const openedFromNotification = useSession((state) => state.openedFromNotification);
  const errorTracked = useSession((state) => state.errorTracked);

  useEffect(() => {
    if (!focused || !onboardingDone) return;
    const trigger = triggerNow(false, interruption != null || openedFromNotification || errorTracked);
    if (!trigger) return;
    const timer = setTimeout(() => ask(trigger), PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [focused, onboardingDone, activeDays, interruption, openedFromNotification, errorTracked]);
}
