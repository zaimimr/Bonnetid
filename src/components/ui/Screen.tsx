import type { PropsWithChildren, ReactNode, Ref } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVerticalFold } from '@/hooks/useWindowGeometry';
import { useResponsive } from '@/hooks/useResponsive';
import { EidBanner } from '@/components/eid/EidBanner';
import { TravelBanner } from '@/components/travel/TravelBanner';
import { isRTL } from '@/lib/i18n';
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
  scrollRef?: Ref<ScrollView>;
  aside?: ReactNode;
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
  scrollRef,
  aside,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, contentMaxWidth } = useResponsive();
  const fold = useVerticalFold();
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

  const side = padded ? spacing.lg : 0;

  const inner: ViewStyle = {
    width: '100%',
    maxWidth: cap,
    alignSelf: 'center',
    flexGrow: 1,
  };

  const rtl = isRTL();
  const column = (content: ReactNode, left: number, right: number, primary: boolean) => {
    const padding: ViewStyle = {
      paddingStart: side + (rtl ? right : left),
      paddingEnd: side + (rtl ? left : right),
    };
    return scroll ? (
      <ScrollView
        ref={primary ? scrollRef : undefined}
        style={[base, style]}
        contentContainerStyle={[padding, styles.scrollContent, contentStyle]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          primary && onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          ) : undefined
        }>
        <View style={inner}>{content}</View>
      </ScrollView>
    ) : (
      <View style={[base, padding, style, contentStyle]}>
        <View style={[inner, { flex: 1 }]}>{content}</View>
      </View>
    );
  };

  const body = fold ? (
    <View style={styles.panes}>
      <View style={{ width: rtl ? width - fold.end : fold.start }}>
        {column(children, rtl ? 0 : insets.left, rtl ? insets.right : 0, true)}
      </View>
      <View style={{ width: rtl ? fold.start : width - fold.end, marginStart: fold.end - fold.start }}>
        {aside != null && column(aside, rtl ? insets.left : 0, rtl ? 0 : insets.right, false)}
      </View>
    </View>
  ) : (
    column(
      <>
        {children}
        {aside}
      </>,
      insets.left,
      insets.right,
      true,
    )
  );

  return (
    <View style={shell}>
      <TravelBanner />
      <EidBanner />
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  panes: {
    flex: 1,
    flexDirection: 'row',
  },
});
