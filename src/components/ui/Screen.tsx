import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '@/hooks/useResponsive';
import { TravelBanner } from '@/components/travel/TravelBanner';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

export type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'bottom')[];
  maxWidth?: number | null;
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
  maxWidth,
  refreshing = false,
  onRefresh,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { contentMaxWidth } = useResponsive();
  const cap = maxWidth === null ? undefined : (maxWidth ?? contentMaxWidth);

  const shell: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: edges.includes('top') ? insets.top : 0,
  };

  const base: ViewStyle = {
    flex: 1,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
  };

  const padding: ViewStyle = {
    paddingLeft: (padded ? spacing.lg : 0) + insets.left,
    paddingRight: (padded ? spacing.lg : 0) + insets.right,
  };

  const inner: ViewStyle = {
    width: '100%',
    maxWidth: cap,
    alignSelf: 'center',
  };

  const body = scroll ? (
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
      <View style={inner}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[base, padding, style, contentStyle]}>
      <View style={[inner, { flex: 1 }]}>{children}</View>
    </View>
  );

  return (
    <View style={shell}>
      <TravelBanner />
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
});
