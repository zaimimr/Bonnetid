import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius, spacing } from '@/theme/tokens';
import type { PrayerStatus } from '@/lib/prayerLog';

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

export type PrayerStatusChoiceProps = {
  label: string;
  status: PrayerStatus | null;
  onSelect: (status: PrayerStatus | null) => void;
};

export function PrayerStatusChoice({ label, status, onSelect }: PrayerStatusChoiceProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
      }}>
      <View
        style={{
          flexDirection: 'row',
          flex: 1,
          minWidth: 180,
          backgroundColor: theme.colors.surfaceSunken,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: spacing.xxs,
          gap: spacing.xxs,
        }}>
        <ChoiceSegment
          text="Bedt"
          active={status === 'prayed'}
          accessibilityLabel={`Marker ${label} som bedt`}
          onPress={() => onSelect(status === 'prayed' ? null : 'prayed')}
        />
        <ChoiceSegment
          text="Hopp over"
          active={status === 'skipped'}
          accessibilityLabel={`Hopp over ${label}`}
          onPress={() => onSelect(status === 'skipped' ? null : 'skipped')}
        />
      </View>
    </View>
  );
}

function ChoiceSegment({
  text,
  active,
  accessibilityLabel,
  onPress,
}: {
  text: string;
  active: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        {
          flex: 1,
          minHeight: 36,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.sm,
          borderRadius: radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? theme.colors.surface : 'transparent',
          borderWidth: active ? 1 : 0,
          borderColor: theme.colors.border,
        },
        pressed && { opacity: opacity.pressed },
      ]}>
      <AppText
        size="sm"
        weight={active ? 'semibold' : 'regular'}
        tone={active ? 'textPrimary' : 'textSecondary'}
        align="center"
        maxFontSizeMultiplier={1.4}
        numberOfLines={2}>
        {text}
      </AppText>
    </Pressable>
  );
}
