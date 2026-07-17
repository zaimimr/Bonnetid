import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

export type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'bottom')[];
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export function Screen({
  children,
  scroll = false,
  padded = true,
  style,
  contentStyle,
  edges = ['top'],
  refreshing = false,
  onRefresh,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const base: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
  };

  const padding: ViewStyle = padded ? { paddingHorizontal: spacing.lg } : {};

  if (scroll) {
    return (
      <ScrollView
        style={[base, style]}
        contentContainerStyle={[padding, styles.scrollContent, contentStyle]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          ) : undefined
        }>
        {children}
      </ScrollView>
    );
  }

  return <View style={[base, padding, style, contentStyle]}>{children}</View>;
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
});
