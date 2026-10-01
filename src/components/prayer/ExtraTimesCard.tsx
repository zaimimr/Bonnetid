import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card } from '@/components/ui';
import type { ExtraTime, ExtraTimeName } from '@/lib/extraTimes';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';

const ICONS: Record<ExtraTimeName, keyof typeof Ionicons.glyphMap> = {
  duha: 'sunny-outline',
  midnight: 'moon-outline',
  tahajjud: 'star-outline',
};

export function ExtraTimesCard({ times }: { times: ExtraTime[] }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [held, setHeld] = useState<ExtraTimeName | null>(null);

  return (
    <View style={{ gap: spacing.md }}>
      {expanded && (
        <Card padding="sm" rounded="xl">
          {times.map((entry, index) => (
            <Pressable
              key={entry.name}
              onLongPress={() => setHeld(entry.name)}
              onPressOut={() => setHeld(null)}
              accessibilityHint={entry.note}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderBottomWidth: index === times.length - 1 ? 0 : 1,
                borderBottomColor: theme.colors.border,
              }}>
              <Ionicons name={ICONS[entry.name]} size={20} color={theme.colors.textMuted} />
              <View style={{ flex: 1, gap: spacing.xxs }}>
                <AppText weight="medium">{entry.label}</AppText>
                {held === entry.name && (
                  <AppText size="xs" tone="textMuted">
                    {entry.note}
                  </AppText>
                )}
              </View>
              <AppText weight="medium" tabular>
                {entry.time}
              </AppText>
            </Pressable>
          ))}
        </Card>
      )}

      <Pressable
        onPress={() => setExpanded((current) => !current)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={({ pressed }) => [
          {
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.lg,
            borderRadius: radius.full,
            backgroundColor: theme.colors.primarySoft,
            minHeight: 44,
          },
          pressed && { opacity: opacity.pressed },
        ]}>
        <AppText size="sm" weight="semibold" tone="onPrimarySoft">
          {expanded ? 'Vis færre tider' : 'Vis flere tider'}
        </AppText>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.colors.onPrimarySoft}
        />
      </Pressable>
    </View>
  );
}
