import { useState } from 'react';
import { Linking, Platform, Pressable, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useLocations } from '@/api/queries';
import { detectNearestLocation } from '@/hooks/useAutoLocation';
import { AppText, Card, Divider, ListRow, Screen, SectionHeader } from '@/components/ui';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';
import { notificationsSupported, requestNotificationPermission } from '@/lib/notifications';
import {
  dynamicIslandAvailable,
  liveActivitiesEnabled,
  prayerWidgetAvailable,
} from '../../modules/prayer-widget';
import { openStoreReview } from '@/lib/review';
import { getNotificationSound } from '@/lib/notificationSounds';
import { asrMethodLabel } from '@/lib/asrMethods';
import { PRAYER_LABELS } from '@/lib/prayerSchedule';
import { useLocationAsrDefault, useMosqueAsrOverride } from '@/hooks/useEffectiveAsrMethod';
import { useRamadanStatus } from '@/hooks/useRamadanStatus';
import { track, trackError } from '@/lib/telemetry';
import { NOTIFIABLE_PRAYERS, useActiveLocation, useSettings } from '@/store/settings';

const storeName = Platform.OS === 'ios' ? 'App Store' : 'Google Play';
const lockScreenSupported =
  prayerWidgetAvailable && (Platform.OS === 'android' || liveActivitiesEnabled());
const hasIsland = Platform.OS === 'ios' && dynamicIslandAvailable();
const lockScreenTitle =
  Platform.OS === 'android' ? 'Varsel på låseskjermen' : 'Følg bønnen på låseskjermen';
const lockScreenSubtitle =
  Platform.OS === 'android'
    ? 'Vises når bønnetiden starter, med Bedt og Hopp over'
    : hasIsland
      ? 'Nedtelling på låseskjermen og i Dynamic Island'
      : 'Nedtelling på låseskjermen';
const widgetJamatSupported = Platform.OS === 'android' && prayerWidgetAvailable;
const ROW = { paddingHorizontal: spacing.md } as const;

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const location = useActiveLocation();
  const setLocation = useSettings((state) => state.setLocation);
  const { data: locations } = useLocations();
  const [locating, setLocating] = useState(false);
  const mosque = useSettings((state) => state.mosque);
  const asrMethod = useSettings((state) => state.asrMethod);
  const themePreference = useSettings((state) => state.themePreference);
  const setThemePreference = useSettings((state) => state.setThemePreference);
  const notificationsEnabled = useSettings((state) => state.notificationsEnabled);
  const setNotificationsEnabled = useSettings((state) => state.setNotificationsEnabled);
  const notificationSound = useSettings((state) => state.notificationSound);
  const notificationPrayers = useSettings((state) => state.notificationPrayers);
  const liveActivityEnabled = useSettings((state) => state.liveActivityEnabled);
  const widgetShowJamat = useSettings((state) => state.widgetShowJamat);
  const setWidgetShowJamat = useSettings((state) => state.setWidgetShowJamat);
  const setLiveActivityEnabled = useSettings((state) => state.setLiveActivityEnabled);
  const endReminderEnabled = useSettings((state) => state.endReminderEnabled);
  const setEndReminderEnabled = useSettings((state) => state.setEndReminderEnabled);
  const trackerEnabled = useSettings((state) => state.prayerTrackerEnabled);
  const setTrackerEnabled = useSettings((state) => state.setPrayerTrackerEnabled);
  const asrOverride = useMosqueAsrOverride();
  const asrLocationDefault = useLocationAsrDefault();
  const ramadanRemindersEnabled = useSettings((state) => state.ramadanRemindersEnabled);
  const setRamadanRemindersEnabled = useSettings((state) => state.setRamadanRemindersEnabled);
  const ramadan = useRamadanStatus(new Date());
  const showRamadan = ramadan.isRamadan || ramadan.daysUntilRamadan != null;

  const detectLocation = async () => {
    if (!locations || locating) return;
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted && !permission.canAskAgain) {
      Linking.openSettings().catch(() => {});
      return;
    }
    setLocating(true);
    try {
      const detected = await detectNearestLocation(locations);
      if (detected) {
        setLocation(detected);
        track('location_detected', { iso: detected.iso, source: 'settings' });
      }
    } catch (error) {
      trackError(error, 'location-detect');
    } finally {
      setLocating(false);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    if (!value) {
      setNotificationsEnabled(false);
      track('notifications_toggled', { enabled: false });
      return;
    }
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    track('notifications_toggled', { enabled: granted });
  };

  const toggleLockScreen = async (value: boolean) => {
    if (!value || Platform.OS !== 'android') {
      setLiveActivityEnabled(value);
      return;
    }
    const granted = await requestNotificationPermission();
    setLiveActivityEnabled(granted);
  };

  const chosenPrayers = NOTIFIABLE_PRAYERS.filter((prayer) => notificationPrayers[prayer]);
  const prayerSummary =
    chosenPrayers.length === NOTIFIABLE_PRAYERS.length
      ? 'Alle bønner'
      : chosenPrayers.length === 0
        ? 'Ingen valgt'
        : chosenPrayers.map((prayer) => PRAYER_LABELS[prayer]).join(', ');

  return (
    <Screen scroll edges={[]}>
      <SectionHeader title="Bønnetider" subtitle="Stedet finnes automatisk fra posisjonen din" />
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Sted"
          subtitle={locating ? 'Finner posisjonen din…' : location.name}
          leading={<Ionicons name="location-outline" size={20} color={theme.colors.primary} />}
          trailing={<Ionicons name="navigate-outline" size={18} color={theme.colors.primary} />}
          onPress={detectLocation}
          style={ROW}
        />
        <Divider />
        <ListRow
          title="Min moské"
          subtitle={mosque?.name ?? 'Ikke valgt'}
          leading={<Ionicons name="business-outline" size={20} color={theme.colors.primary} />}
          chevron
          onPress={() => router.push('/mosque-picker')}
          style={ROW}
        />
        <Divider />
        <ListRow
          title="Asr-metode"
          subtitle={
            asrOverride && mosque
              ? `Styres av ${mosque.name}`
              : asrMethodLabel(asrMethod ?? asrLocationDefault ?? 'shadow_1x')
          }
          leading={<Ionicons name="partly-sunny-outline" size={20} color={theme.colors.primary} />}
          chevron
          onPress={() => router.push('/asr-method')}
          style={ROW}
        />
      </Card>

      <SectionHeader title="Varsler" />
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Varsle ved bønnetid"
          subtitle={
            notificationsSupported
              ? 'Beskjed når bønnen begynner'
              : 'Ikke tilgjengelig i Expo Go på Android'
          }
          leading={<Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />}
          trailing={
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              disabled={!notificationsSupported}
              trackColor={{ true: theme.colors.primary, false: theme.colors.borderStrong }}
              thumbColor={theme.colors.surface}
            />
          }
          style={ROW}
        />
        {notificationsEnabled && (
          <>
            <Divider />
            <ListRow
              title="Bønner"
              subtitle={prayerSummary}
              leading={<Ionicons name="list-outline" size={20} color={theme.colors.primary} />}
              chevron
              onPress={() => router.push('/notification-prayers')}
              style={ROW}
            />
            <Divider />
            <ListRow
              title="Varsellyd"
              subtitle={getNotificationSound(notificationSound).label}
              leading={
                <Ionicons name="musical-notes-outline" size={20} color={theme.colors.primary} />
              }
              chevron
              onPress={() => router.push('/notification-sound')}
              style={ROW}
            />
            {showRamadan && (
              <>
                <Divider />
                <ListRow
                  title="Suhoor-påminnelse"
                  subtitle="45 minutter før Fajr i Ramadan"
                  leading={<Ionicons name="moon-outline" size={20} color={theme.colors.primary} />}
                  trailing={
                    <Switch
                      value={ramadanRemindersEnabled}
                      onValueChange={setRamadanRemindersEnabled}
                      disabled={!notificationsSupported}
                      trackColor={{ true: theme.colors.primary, false: theme.colors.borderStrong }}
                      thumbColor={theme.colors.surface}
                    />
                  }
                  style={ROW}
                />
              </>
            )}
          </>
        )}
      </Card>

      <SectionHeader title="Bønnesporing" />
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Marker bønner"
          subtitle="Hold oversikt over bønnene dine"
          leading={
            <Ionicons name="checkmark-done-outline" size={20} color={theme.colors.primary} />
          }
          trailing={
            <Switch
              value={trackerEnabled}
              onValueChange={setTrackerEnabled}
              trackColor={{ true: theme.colors.primary, false: theme.colors.borderStrong }}
              thumbColor={theme.colors.surface}
            />
          }
          style={ROW}
        />
        {trackerEnabled && notificationsEnabled && (
          <>
            <Divider />
            <ListRow
              title="Påminnelse før tiden går ut"
              subtitle="30 minutter før bønnetiden er over, hvis du ikke har markert bønnen"
              leading={<Ionicons name="hourglass-outline" size={20} color={theme.colors.primary} />}
              trailing={
                <Switch
                  value={endReminderEnabled}
                  onValueChange={setEndReminderEnabled}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.borderStrong }}
                  thumbColor={theme.colors.surface}
                />
              }
              style={ROW}
            />
          </>
        )}
        {lockScreenSupported && (Platform.OS !== 'android' || trackerEnabled) && (
          <>
            <Divider />
            <ListRow
              title={lockScreenTitle}
              subtitle={lockScreenSubtitle}
              leading={<Ionicons name="timer-outline" size={20} color={theme.colors.primary} />}
              trailing={
                <Switch
                  value={liveActivityEnabled}
                  onValueChange={toggleLockScreen}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.borderStrong }}
                  thumbColor={theme.colors.surface}
                />
              }
              style={ROW}
            />
          </>
        )}
        {widgetJamatSupported && (
          <>
            <Divider />
            <ListRow
              title="Jamaat-tider i widgeten"
              subtitle={mosque ? mosque.name : 'Velg en moské først'}
              leading={<Ionicons name="people-outline" size={20} color={theme.colors.primary} />}
              trailing={
                <Switch
                  value={widgetShowJamat}
                  onValueChange={setWidgetShowJamat}
                  disabled={mosque == null}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.borderStrong }}
                  thumbColor={theme.colors.surface}
                />
              }
              style={ROW}
            />
          </>
        )}
      </Card>

      <SectionHeader title="Utseende" />
      <Card padding="sm" rounded="xl">
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          <AppText weight="medium">Tema</AppText>
          <SegmentedRow
            value={themePreference}
            onChange={(preference) => {
              setThemePreference(preference);
              track('theme_changed', { theme: preference });
            }}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Lys' },
              { value: 'dark', label: 'Mørk' },
            ]}
          />
        </View>
      </Card>

      <SectionHeader title="Om appen" />
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Vurder Bønnetid"
          subtitle={`Gi appen stjerner i ${storeName}`}
          leading={<Ionicons name="star-outline" size={20} color={theme.colors.primary} />}
          trailing={<Ionicons name="open-outline" size={18} color={theme.colors.textMuted} />}
          onPress={() => openStoreReview()}
          style={ROW}
        />
        <Divider />
        <ListRow
          title="Islamsk Råd Norge"
          subtitle="Om samarbeidet og prosjektet bak appen"
          leading={
            <Image
              source={
                theme.scheme === 'dark'
                  ? require('../../assets/images/irn-logo-dark.png')
                  : require('../../assets/images/irn-logo.png')
              }
              style={{ width: 20, height: 22 }}
              contentFit="contain"
            />
          }
          chevron
          onPress={() => router.push('/irn')}
          style={ROW}
        />
      </Card>

      <View style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.xl }}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={{ width: 56, height: 56, borderRadius: radius.lg }}
          contentFit="contain"
        />
        <AppText weight="semibold">Bønnetid</AppText>
        <AppText size="xs" tone="textMuted">
          Versjon {Constants.expoConfig?.version ?? '1.0.0'}
        </AppText>
        <AppText size="xs" tone="textMuted">
          Laget av Zaim Imran
        </AppText>
      </View>
    </Screen>
  );
}

function SegmentedRow<T extends string>({
  value,
  onChange,
  options,
  disabled = false,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceSunken,
        borderRadius: radius.md,
        padding: spacing.xxs,
        gap: spacing.xxs,
        opacity: disabled ? opacity.disabled : 1,
      }}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              {
                flex: 1,
                paddingVertical: spacing.md,
                borderRadius: radius.sm,
                backgroundColor: isActive ? theme.colors.surface : 'transparent',
                alignItems: 'center',
                borderWidth: isActive ? 1 : 0,
                borderColor: theme.colors.border,
              },
              pressed && { opacity: opacity.pressed },
            ]}>
            <AppText
              size="sm"
              weight={isActive ? 'semibold' : 'regular'}
              tone={isActive ? 'textPrimary' : 'textMuted'}
              align="center"
              maxFontSizeMultiplier={1.4}
              numberOfLines={1}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
