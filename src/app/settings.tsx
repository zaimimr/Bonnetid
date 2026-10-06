import type { ComponentProps } from 'react';
import { Linking, Platform, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { PostHogMaskView } from 'posthog-react-native';
import { AppText, Card, Divider, IconTile, ListRow, Toggle } from '@/components/ui';
import {
  OFF,
  ON,
  ROW,
  SettingsPage,
  lockScreenSupported,
  widgetJamatSupported,
} from '@/components/settings/shared';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import { track } from '@/lib/telemetry';
import { useFeature } from '@/hooks/useFeature';
import { useActiveLocation, useSettings } from '@/store/settings';
import { t } from '@/lib/i18n';

const PRIVACY_POLICY_URL = 'https://zaimimr.github.io/bonnetid-personvern/';

type IconName = ComponentProps<typeof Ionicons>['name'];

function HubRow({
  title,
  icon,
  value,
  href,
}: {
  title: string;
  icon: IconName;
  value?: string;
  href: Href;
}) {
  const router = useRouter();
  const theme = useTheme();
  return (
    <ListRow
      title={title}
      leading={
        <IconTile>
          <Ionicons name={icon} size={20} color={theme.colors.primary} />
        </IconTile>
      }
      trailing={
        value ? (
          <AppText size="sm" tone="textMuted" numberOfLines={1}>
            {value}
          </AppText>
        ) : undefined
      }
      chevron
      onPress={() => router.push(href)}
      style={ROW}
    />
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const location = useActiveLocation();
  const calculated = location.mode === 'calculated';
  const themePreference = useSettings((state) => state.themePreference);
  const analyticsEnabled = useSettings((state) => state.analyticsEnabled);
  const setAnalyticsEnabled = useSettings((state) => state.setAnalyticsEnabled);
  const notificationsEnabled = useSettings((state) => state.notificationsEnabled);
  const liveActivityEnabled = useSettings((state) => state.liveActivityEnabled);
  const widgetShowJamat = useSettings((state) => state.widgetShowJamat);
  const trackerAllowed = useFeature('prayer-tracker');
  const duasEnabled = useFeature('duas');
  const trackerEnabled = useSettings((state) => state.prayerTrackerEnabled) && trackerAllowed;

  const lockScreenRow = Platform.OS === 'ios' && lockScreenSupported;
  const widgetRow = widgetJamatSupported && !calculated;
  const themeLabel = {
    system: t({ nb: 'System', en: 'System', ar: 'النظام', ur: 'سسٹم' }),
    light: t({ nb: 'Lys', en: 'Light', ar: 'فاتح', ur: 'روشن' }),
    dark: t({ nb: 'Mørk', en: 'Dark', ar: 'داكن', ur: 'تاریک' }),
  }[themePreference];

  return (
    <SettingsPage>
      <Card padding="sm" rounded="xl">
        <PostHogMaskView>
          <HubRow
            title={t({ nb: 'Bønnetider', en: 'Prayer times', ar: 'مواقيت الصلاة', ur: 'نماز کے اوقات' })}
            icon="location-outline"
            value={location.name}
            href="/settings-prayer-times"
          />
        </PostHogMaskView>
        <Divider />
        <HubRow
          title={t({ nb: 'Varsler', en: 'Notifications', ar: 'الإشعارات', ur: 'اطلاعات' })}
          icon="notifications-outline"
          value={notificationsEnabled ? ON : OFF}
          href="/settings-notifications"
        />
        {trackerAllowed && (
          <>
            <Divider />
            <HubRow
              title={t({ nb: 'Bønnesporing', en: 'Prayer tracker', ar: 'متابعة الصلوات', ur: 'نماز ٹریکر' })}
              icon="checkmark-done-outline"
              value={trackerEnabled ? ON : OFF}
              href="/settings-tracker"
            />
          </>
        )}
        {(lockScreenRow || widgetRow) && (
          <>
            <Divider />
            <HubRow
              title={
                lockScreenRow
                  ? t({ nb: 'Låseskjerm', en: 'Lock screen', ar: 'شاشة القفل', ur: 'لاک اسکرین' })
                  : t({ nb: 'Widget', en: 'Widget', ar: 'الأداة', ur: 'ویجیٹ' })
              }
              icon={lockScreenRow ? 'timer-outline' : 'grid-outline'}
              value={(lockScreenRow ? liveActivityEnabled : widgetShowJamat) ? ON : OFF}
              href="/settings-lock-screen"
            />
          </>
        )}
        <Divider />
        <HubRow
          title={t({ nb: 'Utseende', en: 'Appearance', ar: 'المظهر', ur: 'ظاہری شکل' })}
          icon="contrast-outline"
          value={themeLabel}
          href="/settings-appearance"
        />
        {duasEnabled && (
          <>
            <Divider />
            <HubRow
              title={t({ nb: 'Duaer', en: 'Duas', ar: 'الأدعية', ur: 'دعائیں' })}
              icon="book-outline"
              href="/dua-settings"
            />
          </>
        )}
      </Card>

      <Card padding="sm" rounded="xl">
        <ListRow
          title={t({ nb: 'Islamsk Råd Norge', en: 'Islamic Council of Norway', ar: 'المجلس الإسلامي النرويجي', ur: 'اسلامک کونسل ناروے' })}
          leading={
            <IconTile>
              <Image
                source={
                  theme.scheme === 'dark'
                    ? require('../../assets/images/irn-logo-dark.png')
                    : require('../../assets/images/irn-logo.png')
                }
                style={{ width: 20, height: 22 }}
                contentFit="contain"
              />
            </IconTile>
          }
          chevron
          onPress={() => router.push('/irn')}
          style={ROW}
        />
        <Divider />
        <ListRow
          title={t({ nb: 'Hjelp oss bli bedre', en: 'Help us improve', ar: 'ساعدنا على التحسين', ur: 'بہتر بنانے میں ہماری مدد کریں' })}
          subtitle={t({ nb: 'Del nyttig data', en: 'Share useful data', ar: 'شارك بيانات مفيدة', ur: 'مفید ڈیٹا شیئر کریں' })}
          leading={
            <IconTile>
              <Ionicons name="analytics-outline" size={20} color={theme.colors.primary} />
            </IconTile>
          }
          trailing={
            <Toggle
              value={analyticsEnabled}
              onValueChange={(next) => {
                track('analytics_toggled', { enabled: next });
                setAnalyticsEnabled(next);
              }}
            />
          }
          style={ROW}
        />
        <Divider />
        <ListRow
          title={t({ nb: 'Personvern', en: 'Privacy', ar: 'الخصوصية', ur: 'رازداری' })}
          leading={
            <IconTile>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.primary} />
            </IconTile>
          }
          trailing={<Ionicons name="open-outline" size={18} color={theme.colors.textMuted} />}
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})}
          style={ROW}
        />
      </Card>

      <View style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.md }}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={{ width: 56, height: 56, borderRadius: radius.lg }}
          contentFit="contain"
        />
        <AppText weight="semibold">Bønnetid</AppText>
        <AppText size="xs" tone="textMuted">
          {t({ nb: 'Versjon', en: 'Version', ar: 'الإصدار', ur: 'ورژن' })} {Constants.expoConfig?.version ?? '1.0.0'}
        </AppText>
        <AppText size="xs" tone="textMuted">
          {t({ nb: 'Laget av Zaim Imran', en: 'Made by Zaim Imran', ar: 'من تطوير Zaim Imran', ur: 'Zaim Imran کی تیار کردہ' })}
        </AppText>
      </View>
    </SettingsPage>
  );
}
