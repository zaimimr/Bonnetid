import { useState } from 'react';
import { Platform, Pressable, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
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
import { calculationMethodLabel } from '@/lib/calculationMethods';
import { PRAYER_LABELS } from '@/lib/prayerSchedule';
import { useLocationAsrDefault, useMosqueAsrOverride } from '@/hooks/useEffectiveAsrMethod';
import { resolvePlaceName, useTravelState } from '@/hooks/useTravelDetection';
import { track, trackError } from '@/lib/telemetry';
import {
  calculatedLocation,
  DEFAULT_LOCATION,
  NOTIFIABLE_PRAYERS,
  VOLUNTARY_FAST_KINDS,
  useActiveLocation,
  useActiveMosque,
  useHomeLocation,
  useSettings,
} from '@/store/settings';

const lockScreenSupported =
  prayerWidgetAvailable && (Platform.OS === 'android' || liveActivitiesEnabled());
const hasIsland = Platform.OS === 'ios' && dynamicIslandAvailable();
const lockScreenTitle =
  Platform.OS === 'android' ? 'Varsel på låseskjermen' : 'Nedtelling på låseskjermen';
const lockScreenSubtitle = hasIsland ? 'Også i Dynamic Island' : undefined;
const widgetJamatSupported = Platform.OS === 'android' && prayerWidgetAvailable;
const ROW = { paddingHorizontal: spacing.md } as const;

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const location = useActiveLocation();
  const setLocation = useSettings((state) => state.setLocation);
  const homeLocation = useHomeLocation();
  const calculationMethod = useSettings((state) => state.calculationMethod);
  const travel = useTravelState();
  const [switching, setSwitching] = useState(false);
  const calculated = location.mode === 'calculated';
  const mosque = useActiveMosque();
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
  const dhulHijjahRemindersEnabled = useSettings((state) => state.dhulHijjahRemindersEnabled);
  const voluntaryFasts = useSettings((state) => state.voluntaryFasts);

  const switchToCalculated = async () => {
    if (!travel.coords || switching) return;
    setSwitching(true);
    try {
      const name = await resolvePlaceName(travel.coords);
      setLocation(calculatedLocation(name, travel.coords.lat, travel.coords.lon));
      track('travel_mode_chosen', { choice: 'calculated' });
    } catch (error) {
      trackError(error, 'travel-mode-settings');
    } finally {
      setSwitching(false);
    }
  };

  const switchToNorway = () => {
    const target = homeLocation ?? DEFAULT_LOCATION;
    setLocation(target);
    track('travel_mode_chosen', { choice: 'norway' });
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

  const chosenFasts = [
    ramadanRemindersEnabled,
    dhulHijjahRemindersEnabled,
    ...VOLUNTARY_FAST_KINDS.map((kind) => voluntaryFasts[kind]),
  ].filter(Boolean).length;
  const fastingSummary =
    chosenFasts === 0
      ? 'Ingen påminnelser'
      : chosenFasts === 1
        ? '1 påminnelse er på'
        : `${chosenFasts} påminnelser er på`;

  const chosenPrayers = NOTIFIABLE_PRAYERS.filter((prayer) => notificationPrayers[prayer]);
  const prayerSummary =
    chosenPrayers.length === NOTIFIABLE_PRAYERS.length
      ? 'Alle bønner'
      : chosenPrayers.length === 0
        ? 'Ingen valgt'
        : chosenPrayers.map((prayer) => PRAYER_LABELS[prayer]).join(', ');

  return (
    <Screen scroll edges={[]}>
      <SectionHeader title="Bønnetider" />
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Sted"
          subtitle={calculated ? `${location.name} · lokale tider` : location.name}
          leading={<Ionicons name="location-outline" size={20} color={theme.colors.primary} />}
          chevron
          onPress={() => router.push('/location-picker')}
          style={ROW}
        />
        {!calculated && (
          <>
            <Divider />
            <ListRow
              title="Min moské"
              subtitle={mosque?.name ?? 'Ikke valgt'}
              leading={<Ionicons name="business-outline" size={20} color={theme.colors.primary} />}
              chevron
              onPress={() => router.push('/mosque-picker')}
              style={ROW}
            />
          </>
        )}
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
        {calculated && (
          <>
            <Divider />
            <ListRow
              title="Beregningsmetode"
              subtitle={calculationMethodLabel(calculationMethod)}
              leading={<Ionicons name="calculator-outline" size={20} color={theme.colors.primary} />}
              chevron
              onPress={() => router.push('/calculation-method')}
              style={ROW}
            />
          </>
        )}
      </Card>

      <SectionHeader title="Reisemodus" />
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Norsk tid"
          subtitle={
            homeLocation
              ? `${homeLocation.name}, vist i din lokale klokke`
              : 'Bønnetider fra en norsk by'
          }
          leading={<Ionicons name="flag-outline" size={20} color={theme.colors.primary} />}
          trailing={
            calculated ? undefined : (
              <Ionicons name="checkmark" size={22} color={theme.colors.primary} />
            )
          }
          onPress={calculated ? switchToNorway : undefined}
          style={ROW}
        />
        <Divider />
        <ListRow
          title="Lokale tider"
          subtitle={
            switching
              ? 'Finner posisjonen din…'
              : travel.coords
                ? 'Regnes ut der du er nå. Uten jamaat og moskeer'
                : 'Krever tilgang til posisjon'
          }
          leading={<Ionicons name="navigate-outline" size={20} color={theme.colors.primary} />}
          trailing={
            calculated ? (
              <Ionicons name="checkmark" size={22} color={theme.colors.primary} />
            ) : undefined
          }
          onPress={calculated || !travel.coords ? undefined : () => void switchToCalculated()}
          style={ROW}
        />
      </Card>

      <SectionHeader title="Varsler" />
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Varsle ved bønnetid"
          subtitle={notificationsSupported ? undefined : 'Ikke tilgjengelig i Expo Go på Android'}
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
            <Divider />
            <ListRow
              title="Faste og merkedager"
              subtitle={fastingSummary}
              leading={<Ionicons name="moon-outline" size={20} color={theme.colors.primary} />}
              chevron
              onPress={() => router.push('/fasting-reminders')}
              style={ROW}
            />
          </>
        )}
      </Card>

      <SectionHeader title="Bønnesporing" />
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Marker bønner"
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
              subtitle="30 minutter før tiden er ute"
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
        {widgetJamatSupported && !calculated && (
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
          leading={<Ionicons name="star-outline" size={20} color={theme.colors.primary} />}
          trailing={<Ionicons name="open-outline" size={18} color={theme.colors.textMuted} />}
          onPress={() => openStoreReview()}
          style={ROW}
        />
        <Divider />
        <ListRow
          title="Islamsk Råd Norge"
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
