import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { promptReviewIfDayCompleted } from '@/hooks/useReviewPrompt';
import { cancelPrayerReminder } from '@/lib/notifications';
import type { PrayerStatus } from '@/lib/prayerLog';
import { usePrayerLog } from '@/store/prayerLog';

export type MarkPrayer = (isoDate: string, prayer: string, status: PrayerStatus | null) => void;

export function usePrayerMark(): MarkPrayer {
  const setStatus = usePrayerLog((state) => state.setStatus);

  return useCallback(
    (isoDate, prayer, status) => {
      setStatus(isoDate, prayer, status);
      cancelPrayerReminder(isoDate, prayer).catch(() => {});
      if (status === 'prayed') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        promptReviewIfDayCompleted(isoDate);
      } else {
        Haptics.selectionAsync().catch(() => {});
      }
    },
    [setStatus],
  );
}
