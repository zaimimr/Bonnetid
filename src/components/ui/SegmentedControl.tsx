import { useState } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { isRTL } from '@/lib/i18n';
import { AppText } from './AppText';
import { useTheme } from '@/theme';
import { opacity, radius, spacing, spring } from '@/theme/tokens';

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
  const [width, setWidth] = useState(0);
  const index = options.findIndex((option) => option.value === value);
  const segmentWidth =
    (width - spacing.xxs * 2 - spacing.xxs * (options.length - 1)) / options.length;
  const direction = isRTL() ? -1 : 1;
  const thumb = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateX: withSpring(direction * index * (segmentWidth + spacing.xxs), {
            ...spring.slide,
            reduceMotion: ReduceMotion.System,
          }),
        },
      ],
    }),
    [index, segmentWidth, direction],
  );

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
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
      {width > 0 && index >= 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: spacing.xxs,
              bottom: spacing.xxs,
              start: spacing.xxs,
              width: segmentWidth,
              borderRadius: radius.sm,
              backgroundColor: theme.colors.segmentActive,
              borderWidth: 1,
              borderColor: theme.colors.border,
            },
            thumb,
          ]}
        />
      )}
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
                alignItems: 'center',
                backgroundColor:
                  width > 0 || !isActive ? 'transparent' : theme.colors.segmentActive,
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
