import { Pressable, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, ListRow, Screen, SectionHeader } from '@/components/ui';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';
import { requestNotificationPermission } from '@/lib/notifications';
import { useActiveLocation, useSettings, type AsrMethodPreference } from '@/store/settings';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const location = useActiveLocation();
  const mosque = useSettings((state) => state.mosque);
  const setMosque = useSettings((state) => state.setMosque);
  const asrMethod = useSettings((state) => state.asrMethod);
  const setAsrMethod = useSettings((state) => state.setAsrMethod);
  const themePreference = useSettings((state) => state.themePreference);
  const setThemePreference = useSettings((state) => state.setThemePreference);
  const notificationsEnabled = useSettings((state) => state.notificationsEnabled);
  const setNotificationsEnabled = useSettings((state) => state.setNotificationsEnabled);

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
        subtitle="Bønnetidene beregnes for kommunen du velger"
      />
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Sted"
          subtitle={location.name}
          leading={<Ionicons name="location-outline" size={20} color={theme.colors.primary} />}
          chevron
          onPress={() => router.push('/location-picker')}
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
        subtitle="Hanafi bruker 2x skygge, øvrige skoler 1x skygge"
      />
      <SegmentedRow<AsrMethodPreference>
        value={asrMethod}
        onChange={setAsrMethod}
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
          subtitle="Få beskjed når bønnen starter i ditt sted"
          leading={
            <Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />
          }
          trailing={
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
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
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
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
      }}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
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
