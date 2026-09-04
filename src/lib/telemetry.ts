import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

export const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

export function initTelemetry() {
  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: SENTRY_DSN.length > 0,
    sendDefaultPii: false,
    tracesSampleRate: 1,
    enableLogs: true,
    enableNativeFramesTracking: !isRunningInExpoGo(),
    integrations: [navigationIntegration],
  });
}

export type TrackProps = Record<string, string | number | boolean>;

export function track(event: string, props?: TrackProps) {
  Sentry.addBreadcrumb({ category: 'feature', message: event, data: props, level: 'info' });
  Sentry.logger.info(event, props);
}

export function trackError(error: unknown, source: string, extra?: TrackProps) {
  Sentry.captureException(error, { tags: { source }, extra });
}

export { Sentry };
