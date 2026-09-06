import { Pressable, View } from 'react-native';
import { AppText, IconButton } from '@/components/ui';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius, spacing } from '@/theme/tokens';

const CONTROL_SIZE = 44;

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
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: spacing.md,
      }}>
      <View
        style={{
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: 0,
          minWidth: 0,
          gap: spacing.xxs,
          minHeight: CONTROL_SIZE,
          justifyContent: 'center',
        }}>
        <AppText size="xl" weight="bold" heading numberOfLines={1}>
          {title}
        </AppText>
        <AppText size="sm" tone="textMuted" numberOfLines={1}>
          {subtitle ?? ' '}
        </AppText>
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.sm,
          alignItems: 'center',
          height: CONTROL_SIZE,
        }}>
        {onToday && (
          <Pressable
            onPress={onToday}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Gå til denne måneden"
            style={({ pressed }) => [
              {
                height: CONTROL_SIZE,
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
