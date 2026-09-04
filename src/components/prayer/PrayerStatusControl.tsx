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

export type PrayerActionButtonProps = {
  label: string;
  marked: boolean;
  onPress: () => void;
};

export function PrayerActionButton({ label, marked, onPress }: PrayerActionButtonProps) {
  const theme = useTheme();

  return (
    <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
      <Pressable
        onPress={onPress}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityLabel={
          marked ? `Fjern markeringen for ${label}` : `Marker ${label} som bedt`
        }
        style={({ pressed }) => [
          {
            minHeight: 44,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.xs,
            paddingHorizontal: spacing.lg,
            borderRadius: radius.md,
            backgroundColor: marked ? theme.colors.surface : theme.colors.primary,
            borderWidth: marked ? 1 : 0,
            borderColor: theme.colors.borderStrong,
          },
          pressed && { opacity: opacity.pressed },
        ]}>
        <Ionicons
          name={marked ? 'arrow-undo-outline' : 'checkmark'}
          size={18}
          color={marked ? theme.colors.textSecondary : theme.colors.onPrimary}
        />
        <AppText
          size="sm"
          weight="semibold"
          color={marked ? theme.colors.textSecondary : theme.colors.onPrimary}
          maxFontSizeMultiplier={1.4}>
          {marked ? 'Angre' : 'Bedt'}
        </AppText>
      </Pressable>
    </View>
  );
}
