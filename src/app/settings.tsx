import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
  AppText,
  Card,
  Divider,
  ListRow,
  Screen,
  SectionHeader,
  SegmentedControl,
  Toggle,
} from '@/components/ui';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
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
import { track } from '@/lib/telemetry';
import {
  NOTIFIABLE_PRAYERS,
  VOLUNTARY_FAST_KINDS,
  useActiveLocation,
  useActiveMosque,
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
  const calculationMethod = useSettings((state) => state.calculationMethod);
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
          subtitle={
            calculated
              ? `${location.name} · lokale tider, følger posisjonen din`
              : `${location.name} · følger posisjonen din`
          }
          leading={<Ionicons name="location-outline" size={20} color={theme.colors.primary} />}
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


      <SectionHeader title="Varsler" />
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Varsle ved bønnetid"
          subtitle={notificationsSupported ? undefined : 'Ikke tilgjengelig i Expo Go på Android'}
          leading={<Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />}
          trailing={
            <Toggle
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              disabled={!notificationsSupported}
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
            <Toggle
              value={trackerEnabled}
              onValueChange={setTrackerEnabled}
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
                <Toggle
                  value={endReminderEnabled}
                  onValueChange={setEndReminderEnabled}
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
                <Toggle
                  value={liveActivityEnabled}
                  onValueChange={toggleLockScreen}
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
                <Toggle
                  value={widgetShowJamat}
                  onValueChange={setWidgetShowJamat}
                  disabled={mosque == null}
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
          <SegmentedControl
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

