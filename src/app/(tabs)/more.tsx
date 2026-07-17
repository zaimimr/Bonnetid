import { View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Screen } from '@/components/ui';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

type Feature = {
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    href: '/timetable',
    icon: 'grid-outline',
    title: 'Bønnetider for måneden',
    description: 'Full tabell med alle tider, dag for dag',
  },
  {
    href: '/mosques',
    icon: 'business-outline',
    title: 'Moskeer',
    description: 'Finn moskeer i nærheten, med kart og jamat-tider',
  },
  {
    href: '/qibla',
    icon: 'compass-outline',
    title: 'Qibla',
    description: 'Kompass og kart som viser retningen mot Mekka',
  },
  {
    href: '/settings',
    icon: 'settings-outline',
    title: 'Innstillinger',
    description: 'Sted, moské, asr-metode, tema og varsler',
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Screen scroll>
      <View style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>
        <AppText size="xxl" weight="bold" heading>
          Mer
        </AppText>
      </View>

      <View style={{ gap: spacing.md }}>
        {FEATURES.map((feature) => (
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
