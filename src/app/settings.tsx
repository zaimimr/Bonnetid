import { ActivityIndicator, Linking, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Icon, type IconName } from '@/components/icons';
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
import { useLocationStatus, type LocationIssue } from '@/hooks/useLocationStatus';
import { useActiveLocation, useActiveMosque, useSettings } from '@/store/settings';
import { t } from '@/lib/i18n';

const PRIVACY_POLICY_URL = 'https://zaimimr.github.io/bonnetid-personvern/';

const LOCATION_ISSUE_TEXT: Record<LocationIssue, string> = {
  denied: t('settings.locationDenied'),
  servicesOff: t('settings.locationServicesOff'),
  approximate: t('settings.locationApproximate'),
};

function Tile({ icon }: { icon: IconName }) {
  const theme = useTheme();
  return (
    <IconTile>
      <Icon name={icon} size={20} color={theme.colors.primary} />
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
  const locationStatus = useLocationStatus();
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
    system: t('settings.system'),
    light: t('settings.light'),
    dark: t('settings.dark'),
  }[themePreference];

  return (
    <SettingsPage>
      <Card padding="sm" rounded="xl">
        <PostHogMaskView>
          <ListRow
            title={t('settings.location')}
            subtitle={
              locationStatus.refreshing
                ? t('settings.locationUpdating')
                : locationStatus.issue
                  ? LOCATION_ISSUE_TEXT[locationStatus.issue]
                  : calculated
                    ? t('settings.localTimesFollowsYour', { name: location.name })
                    : t('settings.followsYourLocation', { name: location.name })
            }
            leading={<Tile icon="map-pin" />}
            trailing={
              locationStatus.refreshing ? (
                <ActivityIndicator color={theme.colors.textMuted} />
              ) : locationStatus.issue ? (
                <Icon
                  name="warning-circle"
                  size={22}
                  color={locationStatus.issue === 'denied' ? theme.colors.danger : theme.colors.notice}
                />
              ) : undefined
            }
            onPress={locationStatus.refresh}
            style={ROW}
          />
        </PostHogMaskView>
        {!calculated && (
          <>
            <Divider />
            <ListRow
              title={t('settings.myMosque')}
              subtitle={mosque?.name ?? t('settings.notSelected')}
              leading={<Tile icon="mosque" />}
              chevron
              onPress={() => router.push('/mosque-picker')}
              style={ROW}
            />
          </>
        )}
        <Divider />
        <ListRow
          title={t('settings.asrMethod')}
          subtitle={
            asrOverride && mosque
              ? t('settings.setBy', { name: mosque.name })
              : asrMethodLabel(asrMethod ?? 'irn')
          }
          leading={<Tile icon="cloud-sun" />}
          chevron
          onPress={() => router.push('/asr-method')}
          style={ROW}
        />
        {calculated && (
          <>
            <Divider />
            <ListRow
              title={t('settings.calculationMethod')}
              subtitle={
                calculationMethod
                  ? calculationMethodLabel(calculationMethod)
                  : `${t('settings.automatic')} · ${calculationMethodLabel(autoCalculationMethod)}`
              }
              leading={<Tile icon="calculator" />}
              chevron
              onPress={() => router.push('/calculation-method')}
              style={ROW}
            />
          </>
        )}
      </Card>

      <Card padding="sm" rounded="xl">
        <HubRow
          title={t('settings.notifications')}
          icon="bell-simple"
          value={notificationsEnabled ? ON : OFF}
          href="/settings-notifications"
        />
        {(trackerAllowed || lockScreenSupported || widgetRow) && (
          <>
            <Divider />
            <HubRow
              title={TRACKER_TITLE}
              icon="prayer-tracker"
              href="/settings-tracker"
            />
          </>
        )}
        <Divider />
        <HubRow
          title={t('settings.appearance')}
          icon="circle-half"
          value={themeLabel}
          href="/settings-appearance"
        />
        {duasEnabled && (
          <>
            <Divider />
            <HubRow
              title={t('settings.duas')}
              icon="book-open"
              href="/dua-settings"
            />
          </>
        )}
      </Card>

      <Card padding="sm" rounded="xl">
        <ListRow
          title={t('settings.islamicCouncilOfNorway')}
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
          title={t('settings.helpUsImprove')}
          subtitle={t('settings.shareUsefulData')}
          leading={
<Tile icon="chart-line" />
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
          title={t('settings.privacy')}
          leading={
<Tile icon="shield-check" />
          }
          trailing={<Icon name="arrow-square-out" size={18} color={theme.colors.textMuted} />}
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
          {t('settings.version')} {Constants.expoConfig?.version ?? '1.0.0'}
        </AppText>
        <AppText size="xs" tone="textMuted">
          {t('settings.madeByZaimImran')}
        </AppText>
      </View>
    </SettingsPage>
  );
}
