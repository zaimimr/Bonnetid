import { View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Screen } from '@/components/ui';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import { useIsCalculatedMode, usePrayerTrackerEnabled } from '@/store/settings';

type Feature = {
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

const TRACKER_FEATURE: Feature = {
  href: '/tracker',
  icon: 'checkmark-done-outline',
  title: 'Bønnesporing',
  description: 'Marker bønner som bedt, og se uken din',
};

const MOSQUE_FEATURE: Feature = {
  href: '/mosques',
  icon: 'business-outline',
  title: 'Moskeer',
  description: 'Finn moskeer i nærheten, med kart og jamaat-tider',
};

const DUAS_FEATURE: Feature = {
  href: '/duas',
  icon: 'book-outline',
  title: 'Duaer',
  description: 'Duaer til adhan, bønnen og Ramadan',
};

const SETTINGS_FEATURE: Feature = {
  href: '/settings',
  icon: 'settings-outline',
  title: 'Innstillinger',
  description: 'Sted, moské, asr-metode, tema og varsler',
};

export default function MoreScreen() {
  const router = useRouter();
  const theme = useTheme();
  const trackerEnabled = usePrayerTrackerEnabled();
  const calculated = useIsCalculatedMode();
  const features = [
    ...(trackerEnabled ? [TRACKER_FEATURE] : []),
    ...(calculated ? [] : [MOSQUE_FEATURE]),
    DUAS_FEATURE,
    SETTINGS_FEATURE,
  ];

  return (
    <Screen scroll>
      <View style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>
        <AppText size="xxl" weight="bold" heading>
          Mer
        </AppText>
      </View>

      <View style={{ gap: spacing.md }}>
        {features.map((feature) => (
          <Card key={feature.title} rounded="xl" onPress={() => router.push(feature.href)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: radius.md,
                  backgroundColor: theme.colors.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name={feature.icon} size={24} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1, gap: spacing.xxs }}>
                <AppText weight="semibold">{feature.title}</AppText>
                <AppText size="sm" tone="textMuted">
                  {feature.description}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
