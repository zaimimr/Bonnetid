import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { AppText, Screen } from '@/components/ui';
import { requestNotificationPermission } from '@/lib/notifications';
import { t } from '@/lib/i18n';
import { useSettings } from '@/store/settings';
import { spacing } from '@/theme/tokens';
import {
  dynamicIslandAvailable,
  liveActivitiesEnabled,
  prayerWidgetAvailable,
} from '../../../modules/prayer-widget';

export const lockScreenSupported =
  prayerWidgetAvailable && (Platform.OS === 'android' || liveActivitiesEnabled());
export const hasIsland = Platform.OS === 'ios' && dynamicIslandAvailable();
export const widgetJamatSupported = Platform.OS === 'android' && prayerWidgetAvailable;

export const ROW = { paddingHorizontal: spacing.md } as const;

export const ON = t({ nb: 'På', en: 'On', ar: 'مفعّل', ur: 'آن' });
export const TRACKER_TITLE = t({
  nb: 'Bønnesporing og låseskjerm',
  en: 'Prayer tracker and lock screen',
  ar: 'متابعة الصلوات وشاشة القفل',
  ur: 'نماز ٹریکر اور لاک اسکرین',
});
export const OFF = t({ nb: 'Av', en: 'Off', ar: 'متوقف', ur: 'آف' });

export function useLockScreenToggle() {
  const setLiveActivityEnabled = useSettings((state) => state.setLiveActivityEnabled);
  return async (value: boolean) => {
    if (!value || Platform.OS !== 'android') {
      setLiveActivityEnabled(value);
      return;
    }
    const granted = await requestNotificationPermission();
    setLiveActivityEnabled(granted);
  };
}

export function SettingsPage({ children }: { children: ReactNode }) {
  return (
    <Screen scroll edges={[]}>
      <View style={{ gap: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.xl }}>
        {children}
      </View>
    </Screen>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
      <AppText size="sm" weight="semibold" tone="textSecondary">
        {label}
      </AppText>
      {children}
    </View>
  );
}
