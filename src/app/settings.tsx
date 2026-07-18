import { useState } from 'react';
import { Linking, Pressable, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useLocations } from '@/api/queries';
import { detectNearestLocation } from '@/hooks/useAutoLocation';
import { AppText, Card, ListRow, Screen, SectionHeader } from '@/components/ui';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';
import { notificationsSupported, requestNotificationPermission } from '@/lib/notifications';
import { useLocationAsrDefault, useMosqueAsrOverride } from '@/hooks/useEffectiveAsrMethod';
import { useActiveLocation, useSettings, type AsrMethodPreference } from '@/store/settings';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const location = useActiveLocation();
  const setLocation = useSettings((state) => state.setLocation);
  const { data: locations } = useLocations();
  const [locating, setLocating] = useState(false);
  const mosque = useSettings((state) => state.mosque);
  const setMosque = useSettings((state) => state.setMosque);
  const asrMethod = useSettings((state) => state.asrMethod);
  const setAsrMethod = useSettings((state) => state.setAsrMethod);
  const themePreference = useSettings((state) => state.themePreference);
  const setThemePreference = useSettings((state) => state.setThemePreference);
  const notificationsEnabled = useSettings((state) => state.notificationsEnabled);
  const setNotificationsEnabled = useSettings((state) => state.setNotificationsEnabled);
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
        title="Sted og moské"
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
        {mosque && (
          <>
            <Divider />
            <ListRow
              title="Fjern valgt moské"
              leading={<Ionicons name="close-circle-outline" size={20} color={theme.colors.danger} />}
              onPress={() => setMosque(null)}
              style={{ paddingHorizontal: spacing.md }}
            />
          </>
        )}
      </Card>

      <SectionHeader
        title="Asr-metode"
        subtitle={
          asrOverride && mosque
            ? `Styres av ${mosque.name}`
            : 'Hanafi bruker 2x skygge, øvrige skoler 1x skygge'
        }
      />
      <SegmentedRow<AsrMethodPreference>
        value={asrOverride ?? asrMethod ?? asrLocationDefault ?? 'shadow_1x'}
        onChange={setAsrMethod}
        disabled={asrOverride != null}
        options={[
          { value: 'shadow_1x', label: '1x skygge' },
          { value: 'shadow_2x', label: '2x skygge' },
        ]}
      />

      <SectionHeader title="Utseende" />
      <SegmentedRow
        value={themePreference}
        onChange={setThemePreference}
        options={[
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Lys' },
          { value: 'dark', label: 'Mørk' },
        ]}
      />

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
      </View>
    </Screen>
  );
}

function Divider() {
  const theme = useTheme();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: theme.colors.border,
        marginHorizontal: spacing.md,
      }}
    />
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
