import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import PostHog from 'posthog-react-native';
import { useSession } from '@/store/session';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = 'https://eu.i.posthog.com';

export const analyticsActive = POSTHOG_KEY.length > 0;

export const posthog = new PostHog(analyticsActive ? POSTHOG_KEY : 'phc_disabled', {
  host: POSTHOG_HOST,
  disabled: !analyticsActive,
  captureAppLifecycleEvents: true,
  enableSessionReplay: analyticsActive && !isRunningInExpoGo(),
  sessionReplayConfig: {
    maskAllTextInputs: false,
    maskAllImages: false,
    captureLog: false,
  },
  errorTracking: {
    autocapture: {
      uncaughtExceptions: true,
      unhandledRejections: true,
      nativeCrashes: !isRunningInExpoGo(),
      androidNdkCrashes: !isRunningInExpoGo(),
    },
  },
});

void posthog.register({ app_name: 'bonnetid' });

export type TrackProps = Record<string, string | number | boolean>;

export function appVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

export function track(event: string, props?: TrackProps) {
  posthog.capture(event, props);
}

export function trackError(error: unknown, source: string, extra?: TrackProps) {
  useSession.getState().setErrorTracked();
  posthog.captureException(error, { source, ...extra });
}
