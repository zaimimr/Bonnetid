import Constants from 'expo-constants';
import { useEffect } from 'react';
import { useSettings } from '@/store/settings';
import { requestInAppReview } from '@/lib/review';

const LAUNCHES_BEFORE_PROMPT = 4;
const PROMPT_DELAY_MS = 3000;

export function useReviewPrompt() {
  const launchCount = useSettings((state) => state.launchCount);
  const reviewRequested = useSettings((state) => state.reviewRequestedAt) != null;
  const hasLocation = useSettings((state) => state.location) != null;
  const registerLaunch = useSettings((state) => state.registerLaunch);
  const markReviewRequested = useSettings((state) => state.markReviewRequested);

  useEffect(() => {
    registerLaunch();
  }, [registerLaunch]);

  useEffect(() => {
    if (reviewRequested || !hasLocation || launchCount < LAUNCHES_BEFORE_PROMPT) return;
    const timer = setTimeout(async () => {
      const shown = await requestInAppReview();
      if (shown) markReviewRequested(Constants.expoConfig?.version ?? '0.0.0');
    }, PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [launchCount, reviewRequested, hasLocation, markReviewRequested]);
}
