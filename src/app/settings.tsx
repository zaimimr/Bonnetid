import type { ComponentProps } from 'react';
import { Linking, View } from 'react-native';
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
  TRACKER_TITLE,
} from '@/components/settings/shared';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import { track } from '@/lib/telemetry';
import { useFeature } from '@/hooks/useFeature';
import { asrMethodLabel } from '@/lib/asrMethods';
import { calculationMethodLabel } from '@/lib/calculationMethods';
import { useMosqueAsrOverride } from '@/hooks/useEffectiveAsrMethod';
import { useAutoCalculationMethod } from '@/hooks/useEffectiveCalculationMethod';
import { useActiveLocation, useActiveMosque, useSettings } from '@/store/settings';
import { t } from '@/lib/i18n';

const PRIVACY_POLICY_URL = 'https://zaimimr.github.io/bonnetid-personvern/';

type IconName = ComponentProps<typeof Ionicons>['name'];

function Tile({ icon }: { icon: IconName }) {
  const theme = useTheme();
  return (
    <IconTile>
      <Ionicons name={icon} size={20} color={theme.colors.primary} />
    </IconTile>
  );
}

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
  return (
    <ListRow
      title={title}
      leading={<Tile icon={icon} />}
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
  const calculationMethod = useSettings((state) => state.calculationMethod);
  const autoCalculationMethod = useAutoCalculationMethod(location);
  const mosque = useActiveMosque();
  const asrMethod = useSettings((state) => state.asrMethod);
  const asrOverride = useMosqueAsrOverride();
  const themePreference = useSettings((state) => state.themePreference);
  const analyticsEnabled = useSettings((state) => state.analyticsEnabled);
  const setAnalyticsEnabled = useSettings((state) => state.setAnalyticsEnabled);
  const notificationsEnabled = useSettings((state) => state.notificationsEnabled);
  const trackerAllowed = useFeature('prayer-tracker');
  const duasEnabled = useFeature('duas');

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
          <ListRow
            title={t({ nb: 'Sted', en: 'Location', ar: 'الموقع', ur: 'مقام' })}
            subtitle={
              calculated
                ? t({
                    nb: `${location.name} · lokale tider, følger posisjonen din`,
                    en: `${location.name} · local times, follows your location`,
                    ar: `${location.name} · أوقات محلية، يتبع موقعك`,
                    ur: `${location.name} · مقامی اوقات، آپ کے مقام کے مطابق`,
                  })
                : t({
                    nb: `${location.name} · følger posisjonen din`,
                    en: `${location.name} · follows your location`,
                    ar: `${location.name} · يتبع موقعك`,
                    ur: `${location.name} · آپ کے مقام کے مطابق`,
                  })
            }
            leading={<Tile icon="location-outline" />}
            style={ROW}
          />
        </PostHogMaskView>
        {!calculated && (
          <>
            <Divider />
            <ListRow
              title={t({ nb: 'Min moské', en: 'My mosque', ar: 'مسجدي', ur: 'میری مسجد' })}
              subtitle={mosque?.name ?? t({ nb: 'Ikke valgt', en: 'Not selected', ar: 'غير محدد', ur: 'منتخب نہیں' })}
              leading={<Tile icon="business-outline" />}
              chevron
              onPress={() => router.push('/mosque-picker')}
              style={ROW}
            />
          </>
        )}
        <Divider />
        <ListRow
          title={t({ nb: 'Asr-metode', en: 'Asr method', ar: 'طريقة العصر', ur: 'عصر کا طریقہ' })}
          subtitle={
            asrOverride && mosque
              ? t({
                  nb: `Styres av ${mosque.name}`,
                  en: `Set by ${mosque.name}`,
                  ar: `يحددها ${mosque.name}`,
                  ur: `${mosque.name} کی طرف سے طے شدہ`,
                })
              : asrMethodLabel(asrMethod ?? 'irn')
          }
          leading={<Tile icon="partly-sunny-outline" />}
          chevron
          onPress={() => router.push('/asr-method')}
          style={ROW}
        />
        {calculated && (
          <>
            <Divider />
            <ListRow
              title={t({ nb: 'Beregningsmetode', en: 'Calculation method', ar: 'طريقة الحساب', ur: 'حساب کا طریقہ' })}
              subtitle={
                calculationMethod
                  ? calculationMethodLabel(calculationMethod)
                  : `${t({ nb: 'Automatisk', en: 'Automatic', ar: 'تلقائي', ur: 'خودکار' })} · ${calculationMethodLabel(autoCalculationMethod)}`
              }
              leading={<Tile icon="calculator-outline" />}
              chevron
              onPress={() => router.push('/calculation-method')}
              style={ROW}
            />
          </>
        )}
      </Card>

      <Card padding="sm" rounded="xl">
        <HubRow
          title={t({ nb: 'Varsler', en: 'Notifications', ar: 'الإشعارات', ur: 'اطلاعات' })}
          icon="notifications-outline"
          value={notificationsEnabled ? ON : OFF}
          href="/settings-notifications"
        />
        {(trackerAllowed || lockScreenSupported || widgetRow) && (
          <>
            <Divider />
            <HubRow
              title={TRACKER_TITLE}
              icon="checkmark-done-outline"
              href="/settings-tracker"
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
<Tile icon="analytics-outline" />
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
<Tile icon="shield-checkmark-outline" />
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
