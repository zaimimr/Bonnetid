import { useState } from 'react';
import { View } from 'react-native';
import { useIsFocused, useRouter } from 'expo-router';
import { Icon } from '@/components/icons';
import { AppText, Badge, Card, Divider, FeatureCard, ListRow, Screen } from '@/components/ui';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { FEATURES, useAvailableFeatures } from '@/components/customization/features';
import { useSupportThread } from '@/hooks/useSupportThread';
import { FeedbackSheet } from '@/components/feedback/FeedbackSheet';
import { t } from '@/lib/i18n';

const ROW = { paddingHorizontal: spacing.md } as const;

export default function MoreScreen() {
  const router = useRouter();
  const theme = useTheme();
  const available = useAvailableFeatures();
  const isFocused = useIsFocused();
  const support = useSupportThread(isFocused);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <Screen scroll contentStyle={{ flexGrow: 1, paddingBottom: spacing.lg }}>
      <View style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>
        <AppText size="xxl" weight="bold" heading>
          {t('more.more')}
        </AppText>
      </View>

      <View style={{ gap: spacing.md }}>
        {available.map((id) => (
          <FeatureCard
            key={id}
            icon={<Icon name={FEATURES[id].icon} size={24} color={theme.colors.primary} />}
            title={FEATURES[id].title}
            onPress={() => router.push(FEATURES[id].href)}
          />
        ))}
        <FeatureCard
          icon={<Icon name="gear-six" size={24} color={theme.colors.primary} />}
          title={t('more.settings')}
          onPress={() => router.push('/settings')}
        />
      </View>

      <View style={{ flexGrow: 1, minHeight: spacing.xl }} />
      <Card padding="sm" rounded="xl">
        <ListRow
          title={t('more.sendFeedback')}
          leading={<Icon name="chat-circle-dots" size={20} color={theme.colors.primary} />}
          trailing={support.unread > 0 ? <Badge label={String(support.unread)} /> : undefined}
          chevron
          onPress={() => setFeedbackOpen(true)}
          style={ROW}
        />
        <Divider />
        <ListRow
          title={t('more.whatSNew')}
          leading={<Icon name="sparkle" size={20} color={theme.colors.primary} />}
          chevron
          onPress={() => router.push('/whats-new')}
          style={ROW}
        />
      </Card>
      <FeedbackSheet
        visible={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        hasTicket={support.hasTicket}
        unread={support.unread}
      />
    </Screen>
  );
}
