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
import { liveActivitiesEnabled, prayerWidgetAvailable } from '../../modules/prayer-widget';
import { openStoreReview } from '@/lib/review';
import { getNotificationSound } from '@/lib/notificationSounds';
import { PRAYER_LABELS } from '@/lib/prayerSchedule';
import { useLocationAsrDefault, useMosqueAsrOverride } from '@/hooks/useEffectiveAsrMethod';
import { useRamadanStatus } from '@/hooks/useRamadanStatus';
import { track, trackError } from '@/lib/telemetry';
import {
  NOTIFIABLE_PRAYERS,
  useActiveLocation,
  useSettings,
  type AsrMethodPreference,
} from '@/store/settings';

const storeName = Platform.OS === 'ios' ? 'App Store' : 'Google Play';
const lockScreenSupported =
  prayerWidgetAvailable && (Platform.OS === 'android' || liveActivitiesEnabled());
const lockScreenSubtitle =
  Platform.OS === 'android'
    ? 'Varsel på låseskjermen når bønnetiden starter, med Bedt / Hopp over'
    : 'Nedtelling på låseskjermen og i Dynamic Island mens appen er åpnet';
const widgetJamatSupported = Platform.OS === 'android' && prayerWidgetAvailable;

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const location = useActiveLocation();
  const setLocation = useSettings((state) => state.setLocation);
  const { data: locations } = useLocations();
  const [locating, setLocating] = useState(false);
  const mosque = useSettings((state) => state.mosque);
  const asrMethod = useSettings((state) => state.asrMethod);
  const setAsrMethod = useSettings((state) => state.setAsrMethod);
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
  const toggleNotificationPrayer = useSettings((state) => state.toggleNotificationPrayer);
  const endReminderEnabled = useSettings((state) => state.endReminderEnabled);
  const setEndReminderEnabled = useSettings((state) => state.setEndReminderEnabled);
  const trackerEnabled = useSettings((state) => state.prayerTrackerEnabled);
  const setTrackerEnabled = useSettings((state) => state.setPrayerTrackerEnabled);
  const asrOverride = useMosqueAsrOverride();
  const asrLocationDefault = useLocationAsrDefault();
  const ramadanRemindersEnabled = useSettings((state) => state.ramadanRemindersEnabled);
  const setRamadanRemindersEnabled = useSettings((state) => state.setRamadanRemindersEnabled);
  const ramadan = useRamadanStatus(new Date());
  const showRamadanSection = ramadan.isRamadan || ramadan.daysUntilRamadan != null;

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

  return (
    <Screen scroll edges={[]}>
      <SectionHeader
        title="Bønnetider"
        subtitle="Stedet finnes automatisk fra posisjonen din"
      />
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Sted"
          subtitle={locating ? 'Finner posisjonen din…' : location.name}
          leading={<Ionicons name="location-outline" size={20} color={theme.colors.primary} />}
          trailing={<Ionicons name="navigate-outline" size={18} color={theme.colors.primary} />}
          onPress={detectLocation}
          style={{ paddingHorizontal: spacing.md }}
        />
        <Divider />
        <ListRow
          title="Min moské"
          subtitle={mosque?.name ?? 'Ikke valgt'}
          leading={<Ionicons name="business-outline" size={20} color={theme.colors.primary} />}
          chevron
          onPress={() => router.push('/mosque-picker')}
          style={{ paddingHorizontal: spacing.md }}
        />
        <Divider />
        <AsrMethodDropdown
          value={asrOverride ?? asrMethod ?? asrLocationDefault ?? 'shadow_1x'}
          onChange={(method) => {
            setAsrMethod(method);
            track('asr_method_changed', { method });
          }}
          overrideNote={asrOverride && mosque ? `Styres av ${mosque.name}` : null}
        />
      </Card>

      <SectionHeader title="Varsler" />
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Varsle ved bønnetid"
          subtitle={
            notificationsSupported
              ? 'Få beskjed når bønnen starter i ditt sted'
              : 'Ikke tilgjengelig i Expo Go på Android'
          }
          leading={
            <Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />
          }
          trailing={
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              disabled={!notificationsSupported}
              trackColor={{ true: theme.colors.primary, false: theme.colors.borderStrong }}
              thumbColor={theme.colors.surface}
            />
          }
          style={{ paddingHorizontal: spacing.md }}
        />
        {notificationsEnabled && (
          <>
            <Divider />
            <ListRow
              title="Varsellyd"
              leading={
                <Ionicons name="musical-notes-outline" size={20} color={theme.colors.primary} />
              }
              trailing={
                <AppText size="sm" tone="textMuted" numberOfLines={1}>
                  {getNotificationSound(notificationSound).label}
                </AppText>
              }
              chevron
              onPress={() => router.push('/notification-sound')}
              style={{ paddingHorizontal: spacing.md }}
            />
            {NOTIFIABLE_PRAYERS.map((prayer) => (
              <View key={prayer}>
                <Divider />
                <ListRow
                  title={PRAYER_LABELS[prayer]}
                  trailing={
                    <Switch
                      value={notificationPrayers[prayer]}
                      onValueChange={() => {
                        toggleNotificationPrayer(prayer);
                        track('notification_prayer_toggled', {
                          prayer,
                          enabled: !notificationPrayers[prayer],
                        });
                      }}
                      trackColor={{ true: theme.colors.primary, false: theme.colors.borderStrong }}
                      thumbColor={theme.colors.surface}
                    />
                  }
                  style={{ paddingHorizontal: spacing.md }}
                />
              </View>
            ))}
            {trackerEnabled && (
              <>
                <Divider />
                <ListRow
                  title="Påminnelse før tiden går ut"
                  subtitle="30 minutter før bønnetiden er over, hvis du ikke har markert bønnen som bedt"
                  leading={
                    <Ionicons name="hourglass-outline" size={20} color={theme.colors.primary} />
                  }
                  trailing={
                    <Switch
                      value={endReminderEnabled}
                      onValueChange={setEndReminderEnabled}
                      trackColor={{ true: theme.colors.primary, false: theme.colors.borderStrong }}
                      thumbColor={theme.colors.surface}
                    />
                  }
                  style={{ paddingHorizontal: spacing.md }}
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
          leading={<Ionicons name="checkmark-done-outline" size={20} color={theme.colors.primary} />}
          trailing={
            <Switch
              value={trackerEnabled}
              onValueChange={setTrackerEnabled}
              trackColor={{ true: theme.colors.primary, false: theme.colors.borderStrong }}
              thumbColor={theme.colors.surface}
            />
          }
          style={{ paddingHorizontal: spacing.md }}
        />
      </Card>

      {showRamadanSection && (
        <>
          <SectionHeader title="Ramadan" />
          <Card padding="sm" rounded="xl">
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
              style={{ paddingHorizontal: spacing.md }}
            />
          </Card>
        </>
      )}

      {lockScreenSupported && (Platform.OS !== 'android' || trackerEnabled) && (
        <>
          <SectionHeader title="Låseskjerm" />
          <Card padding="sm" rounded="xl">
            <ListRow
              title="Følg neste bønn"
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
              style={{ paddingHorizontal: spacing.md }}
            />
          </Card>
        </>
      )}

      {widgetJamatSupported && (
        <>
          <SectionHeader title="Widget" />
          <Card padding="sm" rounded="xl">
            <ListRow
              title="Vis jamat-tider"
              subtitle={
                mosque
                  ? `Widgeten viser jamat-tidene til ${mosque.name} under bønnetidene`
                  : 'Velg en moské for å vise jamat-tider i widgeten'
              }
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
              style={{ paddingHorizontal: spacing.md }}
            />
          </Card>
        </>
      )}

      <SectionHeader title="Utseende" />
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Tema"
          leading={<Ionicons name="contrast-outline" size={20} color={theme.colors.primary} />}
          style={{ paddingHorizontal: spacing.md }}
        />
        <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
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
          subtitle={`Gi appen stjerner og tilbakemelding i ${storeName}`}
          leading={<Ionicons name="star-outline" size={20} color={theme.colors.primary} />}
          trailing={<Ionicons name="open-outline" size={18} color={theme.colors.textMuted} />}
          onPress={() => openStoreReview()}
          style={{ paddingHorizontal: spacing.md }}
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

      <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl }}>
        <Image
          source={
            theme.scheme === 'dark'
              ? require('../../assets/images/irn-logo-dark.png')
              : require('../../assets/images/irn-logo.png')
          }
          style={{ width: 44, height: 49 }}
          contentFit="contain"
        />
        <AppText size="xs" tone="textMuted" align="center">
          Data og støtte fra Islamsk Råd Norge
        </AppText>
      </View>
    </Screen>
  );
}

const ASR_METHOD_OPTIONS: { value: AsrMethodPreference; label: string; description: string }[] = [
  { value: 'irn', label: 'IRN standard', description: 'Standardmetoden fra IRN' },
  { value: 'shadow_1x', label: '1x skygge', description: 'Øvrige lovskoler' },
  { value: 'shadow_2x', label: '2x skygge', description: 'Hanafi' },
  { value: 'wusta', label: 'Wusta', description: 'Midtpunkt mellom soltider og solnedgang' },
];

function AsrMethodDropdown({
  value,
  onChange,
  overrideNote,
}: {
  value: AsrMethodPreference;
  onChange: (value: AsrMethodPreference) => void;
  overrideNote: string | null;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const disabled = overrideNote != null;
  const current = ASR_METHOD_OPTIONS.find((option) => option.value === value);
  const expanded = open && !disabled;

  return (
    <View>
      <ListRow
        title="Asr-metode"
        subtitle={overrideNote ?? undefined}
        leading={<Ionicons name="partly-sunny-outline" size={20} color={theme.colors.primary} />}
        trailing={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <AppText size="sm" tone="textMuted" numberOfLines={1}>
              {current?.label}
            </AppText>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.colors.textMuted}
            />
          </View>
        }
        onPress={disabled ? undefined : () => setOpen((prev) => !prev)}
        style={{ paddingHorizontal: spacing.md }}
      />
      {expanded &&
        ASR_METHOD_OPTIONS.map((option) => {
          const isActive = option.value === value;
          return (
            <View key={option.value}>
              <Divider />
              <ListRow
                title={option.label}
                subtitle={option.description}
                trailing={
                  isActive ? (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  ) : undefined
                }
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={{ paddingHorizontal: spacing.md }}
              />
            </View>
          );
        })}
    </View>
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
