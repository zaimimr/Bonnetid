import { View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, FeatureCard, Screen } from '@/components/ui';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { useIsCalculatedMode, usePrayerTrackerEnabled } from '@/store/settings';
import { TasbihIcon } from '@/components/tasbih/TasbihIcon';
import { useFeature } from '@/hooks/useFeature';

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
  title: 'Dua og dhikr',
  description: 'Duaer og tasbih til bønnen og Ramadan',
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
  const duasEnabled = useFeature('duas');
  const tasbihEnabled = useFeature('tasbih');
  const features = [
    ...(trackerEnabled ? [TRACKER_FEATURE] : []),
    ...(calculated ? [] : [MOSQUE_FEATURE]),
    ...(duasEnabled ? [DUAS_FEATURE] : []),
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
          <FeatureCard
            key={feature.title}
            icon={<Ionicons name={feature.icon} size={24} color={theme.colors.primary} />}
            title={feature.title}
            description={feature.description}
            onPress={() => router.push(feature.href)}
          />
        ))}
        {!duasEnabled && tasbihEnabled && (
          <FeatureCard
            icon={<TasbihIcon size={24} color={theme.colors.primary} />}
            title="Tasbih"
            description="Tell dhikr etter bønnen"
            onPress={() => router.push('/tasbih')}
          />
        )}
      </View>
    </Screen>
  );
}
