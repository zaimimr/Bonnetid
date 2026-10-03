import { useState } from 'react';
import { View } from 'react-native';
import { useIsFocused, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Badge, Card, Divider, FeatureCard, ListRow, Screen } from '@/components/ui';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { useIsCalculatedMode, usePrayerTrackerEnabled } from '@/store/settings';
import { TasbihIcon } from '@/components/tasbih/TasbihIcon';
import { useFeature } from '@/hooks/useFeature';
import { useSupportThread } from '@/hooks/useSupportThread';
import { ReviewSheet } from '@/components/review/ReviewSheet';
import { appVersion } from '@/lib/telemetry';

const ROW = { paddingHorizontal: spacing.md } as const;

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
  const isFocused = useIsFocused();
  const support = useSupportThread(isFocused);
  const [reviewOpen, setReviewOpen] = useState(false);
  const features = [
    ...(trackerEnabled ? [TRACKER_FEATURE] : []),
    ...(calculated ? [] : [MOSQUE_FEATURE]),
    ...(duasEnabled ? [DUAS_FEATURE] : []),
    SETTINGS_FEATURE,
  ];

  return (
    <Screen scroll contentStyle={{ flexGrow: 1, paddingBottom: spacing.lg }}>
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

      <View style={{ flexGrow: 1, minHeight: spacing.xl }} />
      <Card padding="sm" rounded="xl">
        <ListRow
          title={support.hasTicket ? 'Meldinger' : 'Gi tilbakemelding'}
          leading={<Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.colors.primary} />}
          trailing={support.unread > 0 ? <Badge label={String(support.unread)} /> : undefined}
          chevron
          onPress={() => router.push('/feedback')}
          style={ROW}
        />
        <Divider />
        <ListRow
          title="Hva er nytt"
          subtitle={`Versjon ${appVersion()}`}
          leading={<Ionicons name="sparkles-outline" size={20} color={theme.colors.primary} />}
          chevron
          onPress={() => router.push('/whats-new')}
          style={ROW}
        />
        <Divider />
        <ListRow
          title="Vurder Bønnetid"
          leading={<Ionicons name="star-outline" size={20} color={theme.colors.primary} />}
          chevron
          onPress={() => setReviewOpen(true)}
          style={ROW}
        />
      </Card>
      <ReviewSheet visible={reviewOpen} onClose={() => setReviewOpen(false)} />
    </Screen>
  );
}
