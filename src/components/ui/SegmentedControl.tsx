import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';

const MAX_SEGMENT_FONT_SCALE = 1.4;

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedControlProps<T extends string> = {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  style,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: theme.colors.surfaceSunken,
          borderRadius: radius.md,
          padding: spacing.xxs,
          gap: spacing.xxs,
          opacity: disabled ? opacity.disabled : 1,
        },
        style,
      ]}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isActive, disabled }}
            style={({ pressed }) => [
              {
                flex: 1,
                paddingVertical: spacing.md,
                borderRadius: radius.sm,
                backgroundColor: isActive ? theme.colors.segmentActive : 'transparent',
                alignItems: 'center',
                borderWidth: isActive ? 1 : 0,
                borderColor: theme.colors.border,
              },
              pressed && { opacity: opacity.pressed },
            ]}>
            <AppText
              size="sm"
              weight={isActive ? 'semibold' : 'regular'}
              tone={isActive ? 'textPrimary' : 'textMuted'}
              align="center"
              maxFontSizeMultiplier={MAX_SEGMENT_FONT_SCALE}
              numberOfLines={1}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
