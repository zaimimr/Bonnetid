import { useState, type ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import type { Tabs } from 'expo-router';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { isRTL } from '@/lib/i18n';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { duration, spacing } from '@/theme/tokens';

export type AppTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0];

const PILL_WIDTH = 64;
const PILL_HEIGHT = 32;
const MAX_TAB_FONT_SCALE = 1.15;
const SLIDE = {
  duration: duration.normal,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
};

function SlidingPill({
  index,
  itemWidth,
  color,
}: {
  index: number;
  itemWidth: number;
  color: string;
}) {
  const direction = isRTL() ? -1 : 1;
  const style = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateX: withTiming(
            direction * (index * itemWidth + (itemWidth - PILL_WIDTH) / 2),
            SLIDE,
          ),
        },
      ],
    }),
    [index, itemWidth, direction],
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: spacing.md,
          start: 0,
          width: PILL_WIDTH,
          height: PILL_HEIGHT,
          borderRadius: PILL_HEIGHT / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function AppTabBar({ state, descriptors, navigation, insets }: AppTabBarProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const itemWidth = width / state.routes.length;

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.tabBarBackground,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: spacing.md,
        paddingBottom: Math.max(insets.bottom, spacing.md),
      }}>
      {itemWidth > 0 && (
        <SlidingPill index={state.index} itemWidth={itemWidth} color={theme.colors.primarySoft} />
      )}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? theme.colors.tabBarActive : theme.colors.tabBarInactive;
        const title = options.title ?? route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            accessibilityRole="tab"
            accessibilityLabel={title}
            accessibilityState={{ selected: focused }}
            style={{ flex: 1, alignItems: 'center', gap: spacing.xs }}>
            {({ pressed }) => (
              <>
                <View
                  style={{
                    width: PILL_WIDTH,
                    height: PILL_HEIGHT,
                    borderRadius: PILL_HEIGHT / 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                      borderRadius: PILL_HEIGHT / 2,
                      backgroundColor: theme.colors.pressedLayer,
                      opacity: pressed ? 1 : 0,
                    }}
                  />
                  {options.tabBarIcon?.({ focused, color, size: 22 })}
                  {options.tabBarBadge !== undefined && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 4,
                        end: 16,
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.colors.primary,
                      }}
                    />
                  )}
                </View>
                <AppText
                  size="xs"
                  weight={focused ? 'semibold' : 'medium'}
                  color={color}
                  align="center"
                  maxFontSizeMultiplier={MAX_TAB_FONT_SCALE}
                  numberOfLines={1}>
                  {title}
                </AppText>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
