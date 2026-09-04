import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius, spacing } from '@/theme/tokens';

export const STATUS_MARK_SIZE = 14;

export type PrayerStatusMarkProps = {
  label: string;
};

export function PrayerStatusMark({ label }: PrayerStatusMarkProps) {
  const theme = useTheme();

  return (
    <Ionicons
      name="checkmark"
      size={STATUS_MARK_SIZE}
      color={theme.colors.textMuted}
      accessibilityLabel={`${label} er markert som bedt`}
    />
  );
}

export type PrayerPrayedButtonProps = {
  label: string;
  onPress: () => void;
};

export function PrayerPrayedButton({ label, onPress }: PrayerPrayedButtonProps) {
  const theme = useTheme();

  return (
    <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
      <Pressable
        onPress={onPress}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityLabel={`Marker ${label} som bedt`}
        style={({ pressed }) => [
          {
            alignSelf: 'flex-start',
            minHeight: 44,
            minWidth: 140,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.xs,
            paddingHorizontal: spacing.lg,
            borderRadius: radius.full,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.primary,
          },
          pressed && { opacity: opacity.pressed },
        ]}>
        <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
        <AppText size="sm" weight="semibold" tone="primary" maxFontSizeMultiplier={1.4}>
          Bedt
        </AppText>
      </Pressable>
    </View>
  );
}
