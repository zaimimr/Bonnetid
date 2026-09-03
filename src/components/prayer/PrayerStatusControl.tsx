import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius, spacing } from '@/theme/tokens';
import type { PrayerStatus } from '@/lib/prayerLog';

export const STATUS_CONTROL_SIZE = 30;

export type PrayerStatusControlProps = {
  label: string;
  status: PrayerStatus | null;
  expanded: boolean;
  onPress: () => void;
};

export function PrayerStatusControl({
  label,
  status,
  expanded,
  onPress,
}: PrayerStatusControlProps) {
  const theme = useTheme();

  const accessibilityLabel =
    status === 'prayed'
      ? `${label} er markert som bedt`
      : status === 'skipped'
        ? `${label} er hoppet over`
        : `Marker ${label} som bedt`;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded }}
      style={({ pressed }) => [
        {
          width: STATUS_CONTROL_SIZE,
          height: STATUS_CONTROL_SIZE,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            status === 'prayed'
              ? theme.colors.primary
              : status === 'skipped'
                ? theme.colors.surfaceSunken
                : 'transparent',
          borderWidth: status === 'prayed' ? 0 : 1.5,
          borderColor: status === 'skipped' ? theme.colors.border : theme.colors.borderStrong,
        },
        pressed && { opacity: opacity.pressed },
      ]}>
      {status === 'prayed' && (
        <Ionicons name="checkmark" size={18} color={theme.colors.onPrimary} />
      )}
      {status === 'skipped' && (
        <Ionicons name="remove" size={16} color={theme.colors.textMuted} />
      )}
    </Pressable>
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
          onPress={() => onSelect('prayed')}
        />
        <ChoiceSegment
          text="Hopp over"
          active={status === 'skipped'}
          accessibilityLabel={`Hopp over ${label}`}
          onPress={() => onSelect('skipped')}
        />
      </View>
      <Pressable
        onPress={() => onSelect(null)}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityLabel={`Fjern markeringen for ${label}`}
        style={({ pressed }) => [
          { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
          pressed && { opacity: opacity.pressed },
        ]}>
        <AppText size="sm" weight="medium" tone="textMuted" maxFontSizeMultiplier={1.4}>
          Fjern
        </AppText>
      </Pressable>
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
