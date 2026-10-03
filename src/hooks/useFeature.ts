import { useFeatureFlag } from 'posthog-react-native';
import { flagEnabled, type FeatureFlag } from '@/lib/featureFlags';
import { posthog } from '@/lib/telemetry';

export function useFeature(flag: FeatureFlag): boolean {
  return flagEnabled(useFeatureFlag(flag, posthog));
}
