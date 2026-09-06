import { Pressable, View } from 'react-native';
import { AppText, IconButton } from '@/components/ui';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius, spacing } from '@/theme/tokens';

export type MonthNavProps = {
  title: string;
  subtitle?: string;
  onPrev: () => void;
  onNext: () => void;
  onToday?: () => void;
};

export function MonthNav({ title, subtitle, onPrev, onNext, onToday }: MonthNavProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        rowGap: spacing.sm,
        columnGap: spacing.md,
      }}>
      <View style={{ gap: spacing.xxs, flexShrink: 1 }}>
        <AppText size="xxl" weight="bold" heading>
          {title}
        </AppText>
        {subtitle ? (
          <AppText size="sm" tone="textMuted">
            {subtitle}
          </AppText>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        {onToday && (
          <Pressable
            onPress={onToday}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Gå til denne måneden"
            style={({ pressed }) => [
              {
                minHeight: 44,
                justifyContent: 'center',
                paddingHorizontal: spacing.md,
                borderRadius: radius.full,
                backgroundColor: theme.colors.primarySoft,
              },
              pressed && { opacity: opacity.pressed },
            ]}>
            <AppText size="sm" weight="semibold" tone="onPrimarySoft">
              I dag
            </AppText>
          </Pressable>
        )}
        <IconButton name="chevron-back" accessibilityLabel="Forrige måned" onPress={onPrev} />
        <IconButton name="chevron-forward" accessibilityLabel="Neste måned" onPress={onNext} />
      </View>
    </View>
  );
}
