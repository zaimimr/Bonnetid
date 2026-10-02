import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useTheme } from '@/theme';
import { hitSlop, opacity, spacing } from '@/theme/tokens';

export type InlineLinkProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export function InlineLink({ label, icon, onPress }: InlineLinkProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="link"
      hitSlop={hitSlop}
      onPress={onPress}
      style={({ pressed }) => ({
        marginTop: spacing.sm,
        minHeight: 44,
        justifyContent: 'center',
        alignSelf: 'flex-start',
        opacity: pressed ? opacity.pressed : 1,
      })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Ionicons name={icon} size={16} color={theme.colors.primary} />
        <AppText size="sm" weight="semibold" tone="primary" style={{ flexShrink: 1 }}>
          {label}
        </AppText>
        <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
      </View>
    </Pressable>
  );
}
