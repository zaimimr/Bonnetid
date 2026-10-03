import { View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button } from '@/components/ui';
import { useFeature } from '@/hooks/useFeature';
import type { FeatureFlag } from '@/lib/featureFlags';
import { track } from '@/lib/telemetry';
import { visibleItems, type WhatsNewEntry } from '@/lib/whatsNew';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

export type WhatsNewListProps = {
  entries: WhatsNewEntry[];
  onNavigate?: () => void;
};

export function WhatsNewList({ entries, onNavigate }: WhatsNewListProps) {
  const theme = useTheme();
  const router = useRouter();
  const flags = {
    duas: useFeature('duas'),
    tasbih: useFeature('tasbih'),
    'mosque-donation': useFeature('mosque-donation'),
    'qibla-ar': useFeature('qibla-ar'),
    'prayer-tracker': useFeature('prayer-tracker'),
  } satisfies Record<FeatureFlag, boolean>;
  const isEnabled = (flag: FeatureFlag) => flags[flag];

  return (
    <View style={{ gap: spacing.xl }}>
      {entries.map((entry) => {
        const items = visibleItems(entry.items, isEnabled);
        if (items.length === 0) return null;
        return (
          <View key={entry.version} style={{ gap: spacing.lg }}>
            <AppText size="sm" tone="textMuted">
              Versjon {entry.version}
            </AppText>
            {items.map((item) => (
              <View key={item.title} style={{ flexDirection: 'row', gap: spacing.md }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.md,
                    backgroundColor: theme.colors.primarySoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, gap: spacing.xs }}>
                  <AppText weight="semibold">{item.title}</AppText>
                  <AppText size="sm" tone="textMuted">
                    {item.body}
                  </AppText>
                  {item.route && (
                    <Button
                      label="Prøv nå"
                      variant="secondary"
                      size="sm"
                      style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}
                      onPress={() => {
                        onNavigate?.();
                        track('whats_new_opened_item', { title: item.title });
                        router.push(item.route as Href);
                      }}
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}
