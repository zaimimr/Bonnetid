import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useTheme } from '@/theme';
import { hitSlop, opacity, spacing } from '@/theme/tokens';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  chevron = false,
  style,
}: ListRowProps) {
  const theme = useTheme();

  const content = (
    <>
      {leading && <View style={{ marginRight: spacing.md }}>{leading}</View>}
      <View style={{ flex: 1, gap: spacing.xxs }}>
        <AppText weight="medium" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText size="sm" tone="textMuted" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing && (
        <View style={{ marginLeft: spacing.md, flexShrink: 1, alignItems: 'flex-end' }}>
          {trailing}
        </View>
      )}
      {chevron && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.textMuted}
          style={{ marginLeft: spacing.sm }}
        />
      )}
    </>
  );

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: 44,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        hitSlop={hitSlop}
        style={({ pressed }) => [rowStyle, pressed && { opacity: opacity.pressed }, style]}>
        {content}
      </Pressable>
    );
  }

  return <View style={[rowStyle, style]}>{content}</View>;
}
