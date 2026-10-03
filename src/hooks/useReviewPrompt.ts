import { useEffect } from 'react';
import { useIsFocused } from 'expo-router';
import { localDayKey, reviewTrigger } from '@/lib/reviewTrigger';
import { requestInAppReview } from '@/lib/review';
import { appVersion, track } from '@/lib/telemetry';
import { usePrayerLog } from '@/store/prayerLog';
import { useSession } from '@/store/session';
import { useOnboardingDone, useSettings } from '@/store/settings';

const PROMPT_DELAY_MS = 2500;

export function useReviewPrompt() {
  const focused = useIsFocused();
  const onboardingDone = useOnboardingDone();
  const activeDays = useSettings((state) => state.activeDays);
  const mosqueSelectedOn = useSettings((state) => state.mosqueSelectedOn);
  const lastRequestedAt = useSettings((state) => state.reviewRequestedAt);
  const lastRequestedVersion = useSettings((state) => state.reviewRequestedVersion);
  const markReviewRequested = useSettings((state) => state.markReviewRequested);
  const prayersLogged = usePrayerLog(
    (state) => Object.values(state.log).filter((entry) => entry.status === 'prayed').length,
  );
  const interruption = useSession((state) => state.interruption);
  const openedFromNotification = useSession((state) => state.openedFromNotification);
  const errorTracked = useSession((state) => state.errorTracked);

  useEffect(() => {
    if (!focused || !onboardingDone) return;
    const now = Date.now();
    const trigger = reviewTrigger(
      { activeDays, mosqueSelectedOn, lastRequestedAt, lastRequestedVersion },
      {
        today: localDayKey(new Date(now)),
        now,
        appVersion: appVersion(),
        prayersLogged,
        suppressed: interruption != null || openedFromNotification || errorTracked,
      },
    );
    if (!trigger) return;
    const timer = setTimeout(async () => {
      if (!useSession.getState().claimInterruption('review')) return;
      const shown = await requestInAppReview();
      if (!shown) return;
      markReviewRequested(appVersion());
      track('review_prompt_requested', { trigger });
    }, PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [
    focused,
    onboardingDone,
    activeDays,
    mosqueSelectedOn,
    lastRequestedAt,
    lastRequestedVersion,
    prayersLogged,
    interruption,
    openedFromNotification,
    errorTracked,
    markReviewRequested,
  ]);
}
