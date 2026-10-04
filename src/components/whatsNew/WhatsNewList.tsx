import { Fragment } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Divider } from '@/components/ui';
import { TasbihIcon } from '@/components/tasbih/TasbihIcon';
import { useFeature } from '@/hooks/useFeature';
import type { FeatureFlag } from '@/lib/featureFlags';
import { track } from '@/lib/telemetry';
import { visibleItems, type WhatsNewEntry, type WhatsNewItem } from '@/lib/whatsNew';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';

export type WhatsNewListProps = {
  entries: WhatsNewEntry[];
  onNavigate?: () => void;
};

function WhatsNewRow({ item, onPress }: { item: WhatsNewItem; onPress?: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        opacity: pressed ? opacity.pressed : 1,
      })}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {item.icon === 'tasbih' ? (
          <TasbihIcon size={20} color={theme.colors.primary} />
        ) : (
          <Ionicons
            name={item.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={theme.colors.primary}
          />
        )}
      </View>
      <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, gap: spacing.xxs }}>
        <AppText weight="semibold">{item.title}</AppText>
        <AppText size="sm" tone="textMuted">
          {item.body}
        </AppText>
      </View>
      {onPress ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.textMuted}
          style={{ alignSelf: 'center' }}
        />
      ) : null}
    </Pressable>
  );
}

export function WhatsNewList({ entries, onNavigate }: WhatsNewListProps) {
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
        const items = visibleItems(entry.items, isEnabled, Platform.OS);
        if (items.length === 0) return null;
        return (
          <View key={entry.version} style={{ gap: spacing.md }}>
            <AppText size="lg" weight="bold" heading>
              Versjon {entry.version}
            </AppText>
            <Card padding="xs" rounded="xl">
              {items.map((item, index) => (
                <Fragment key={item.title}>
                  {index > 0 ? <Divider /> : null}
                  <WhatsNewRow
                    item={item}
                    onPress={
                      item.route
                        ? () => {
                            onNavigate?.();
                            track('whats_new_opened_item', { title: item.title });
                            router.push(item.route as Href);
                          }
                        : undefined
                    }
                  />
                </Fragment>
              ))}
            </Card>
          </View>
        );
      })}
    </View>
  );
}
