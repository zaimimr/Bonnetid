import { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useIsFocused, useRouter } from 'expo-router';
import { Icon, type IconName } from '@/components/icons';
import { AppText, Badge, Card, Divider, enterUp, ListRow, Screen } from '@/components/ui';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { FEATURES, useAvailableFeatures } from '@/components/customization/features';
import { useSupportThread } from '@/hooks/useSupportThread';
import { FeedbackSheet } from '@/components/feedback/FeedbackSheet';
import { t } from '@/lib/i18n';

const ROW = { paddingHorizontal: spacing.md } as const;
const COLUMNS = 3;

export default function MoreScreen() {
  const router = useRouter();
  const theme = useTheme();
  const available = useAvailableFeatures();
  const isFocused = useIsFocused();
  const support = useSupportThread(isFocused);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const tiles: { key: string; icon: IconName; label: string; onPress: () => void }[] = [
    ...available.map((id) => ({
      key: id,
      icon: FEATURES[id].icon,
      label: FEATURES[id].label,
      onPress: () => router.push(FEATURES[id].href),
    })),
    {
      key: 'settings',
      icon: 'gear-six',
      label: t('more.settings'),
      onPress: () => router.push('/settings'),
    },
  ];
  const rows = Array.from({ length: Math.ceil(tiles.length / COLUMNS) }, (_, index) =>
    tiles.slice(index * COLUMNS, index * COLUMNS + COLUMNS),
  );

  return (
    <Screen scroll contentStyle={{ flexGrow: 1, paddingBottom: spacing.lg }}>
      <View style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>
        <AppText size="xxl" weight="bold" heading>
          {t('more.more')}
        </AppText>
      </View>

      <View style={{ gap: spacing.sm }}>
        {rows.map((row, rowIndex) => (
          <Animated.View
            key={row[0].key}
            entering={enterUp(rowIndex)}
            style={{ flexDirection: 'row', gap: spacing.sm }}>
            {row.map((tile) => (
              <View key={tile.key} style={{ flex: 1 }}>
                <Card
                  padding="sm"
                  rounded="xl"
                  onPress={tile.onPress}
                  style={{ alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg }}>
                  <Icon name={tile.icon} size={28} color={theme.colors.primary} />
                  <AppText size="sm" weight="medium" align="center" numberOfLines={1}>
                    {tile.label}
                  </AppText>
                </Card>
              </View>
            ))}
            {Array.from({ length: COLUMNS - row.length }, (_, index) => (
              <View key={index} style={{ flex: 1 }} />
            ))}
          </Animated.View>
        ))}
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
