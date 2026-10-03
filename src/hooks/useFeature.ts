import { useFeatureFlagResult } from 'posthog-react-native';
import { featureResultEnabled, type FeatureFlag } from '@/lib/featureFlags';
import { posthog } from '@/lib/telemetry';

export function useFeature(flag: FeatureFlag): boolean {
  return featureResultEnabled(useFeatureFlagResult(flag, posthog));
}
