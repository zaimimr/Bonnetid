import { useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import type { Tabs } from 'expo-router';
import Animated, { ReduceMotion, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { isRTL } from '@/lib/i18n';
import { AppText } from '@/components/ui';
import { TabBarEditor } from '@/components/customization/TabBarEditor';
import { useHomeEdit } from '@/store/homeEdit';
import { useTheme } from '@/theme';
import { pressScale, spacing, spring } from '@/theme/tokens';

export type AppTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0] & { visible: string[] };

const PILL_WIDTH = 64;
const PILL_HEIGHT = 32;
const MAX_TAB_FONT_SCALE = 1.15;
const SLIDE = { ...spring.slide, reduceMotion: ReduceMotion.System };
const PRESS = { ...spring.press, reduceMotion: ReduceMotion.System };

function PressScale({ pressed, children }: { pressed: boolean; children: ReactNode }) {
  const style = useAnimatedStyle(
    () => ({ transform: [{ scale: withSpring(pressed ? pressScale.control : 1, PRESS) }] }),
    [pressed],
  );
  return (
    <Animated.View style={[{ alignItems: 'center', gap: spacing.xs }, style]}>
      {children}
    </Animated.View>
  );
}

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
          translateX: withSpring(
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

export function AppTabBar({ state, descriptors, navigation, insets, visible }: AppTabBarProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const editing = useHomeEdit((edit) => edit.editing);
  const routes = visible.flatMap((name) => state.routes.filter((route) => route.name === name));
  const itemWidth = width / routes.length;
  const focusedKey = state.routes[state.index]?.key;
  const highlightedKey = routes.some((route) => route.key === focusedKey)
    ? focusedKey
    : routes.at(-1)?.key;
  const pillIndex = routes.findIndex((route) => route.key === highlightedKey);

  if (editing) return <TabBarEditor bottomInset={insets.bottom} />;

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
      {itemWidth > 0 && pillIndex >= 0 && (
        <SlidingPill index={pillIndex} itemWidth={itemWidth} color={theme.colors.primarySoft} />
      )}
      {routes.map((route) => {
        const { options } = descriptors[route.key];
        const focused = route.key === focusedKey;
        const highlighted = route.key === highlightedKey;
        const color = highlighted ? theme.colors.tabBarActive : theme.colors.tabBarInactive;
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
            accessibilityState={{ selected: highlighted }}
            style={{ flex: 1, alignItems: 'center', gap: spacing.xs }}>
            {({ pressed }) => (
              <PressScale pressed={pressed}>
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
                  {options.tabBarIcon?.({ focused: highlighted, color, size: 22 })}
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
                  weight={highlighted ? 'semibold' : 'medium'}
                  color={color}
                  align="center"
                  maxFontSizeMultiplier={MAX_TAB_FONT_SCALE}
                  numberOfLines={1}>
                  {title}
                </AppText>
              </PressScale>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
