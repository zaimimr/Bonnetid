import { useState } from 'react';
import { Linking, Pressable, Switch, View } from 'react-native';
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
import { getNotificationSound } from '@/lib/notificationSounds';
import { PRAYER_LABELS } from '@/lib/prayerSchedule';
import { useLocationAsrDefault, useMosqueAsrOverride } from '@/hooks/useEffectiveAsrMethod';
import {
  NOTIFIABLE_PRAYERS,
  useActiveLocation,
  useSettings,
  type AsrMethodPreference,
} from '@/store/settings';

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
  const toggleNotificationPrayer = useSettings((state) => state.toggleNotificationPrayer);
  const asrOverride = useMosqueAsrOverride();
  const asrLocationDefault = useLocationAsrDefault();

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
      if (detected) setLocation(detected);
    } catch {
    } finally {
      setLocating(false);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    if (!value) {
      setNotificationsEnabled(false);
      return;
    }
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
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
        <ListRow
          title="Asr-metode"
          subtitle={
            asrOverride && mosque
              ? `Styres av ${mosque.name}`
              : 'Hanafi bruker 2x skygge, øvrige skoler 1x skygge'
          }
          leading={<Ionicons name="partly-sunny-outline" size={20} color={theme.colors.primary} />}
          style={{ paddingHorizontal: spacing.md }}
        />
        <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
          <SegmentedRow<AsrMethodPreference>
            value={asrOverride ?? asrMethod ?? asrLocationDefault ?? 'shadow_1x'}
            onChange={setAsrMethod}
            disabled={asrOverride != null}
            options={[
              { value: 'shadow_1x', label: '1x skygge' },
              { value: 'shadow_2x', label: '2x skygge' },
            ]}
          />
        </View>
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
                <AppText size="sm" tone="textMuted">
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
                      onValueChange={() => toggleNotificationPrayer(prayer)}
                      trackColor={{ true: theme.colors.primary, false: theme.colors.borderStrong }}
                      thumbColor={theme.colors.surface}
                    />
                  }
                  style={{ paddingHorizontal: spacing.md }}
                />
              </View>
            ))}
          </>
        )}
      </Card>

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
            onChange={setThemePreference}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Lys' },
              { value: 'dark', label: 'Mørk' },
            ]}
          />
        </View>
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
              tone={isActive ? 'textPrimary' : 'textMuted'}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
