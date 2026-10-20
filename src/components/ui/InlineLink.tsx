import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '@/components/icons';
import { AppText } from './AppText';
import { mirrored } from './rtl';
import { useTheme } from '@/theme';
import { hitSlop, opacity, spacing } from '@/theme/tokens';

export type InlineLinkProps = {
  label: string;
  icon: IconName;
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
        <Icon name={icon} size={16} color={theme.colors.primary} />
        <AppText size="sm" weight="semibold" tone="primary" style={{ flexShrink: 1 }}>
          {label}
        </AppText>
        <Icon name="caret-right" size={14} color={theme.colors.primary} style={mirrored} />
      </View>
    </Pressable>
  );
}
