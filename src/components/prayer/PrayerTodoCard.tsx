import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card } from '@/components/ui';
import { useFontScale } from '@/hooks/useFontScale';
import { usePrayerMark } from '@/hooks/usePrayerMark';
import { usePrayerTodo } from '@/hooks/usePrayerTodo';
import { formatTimeOfDay } from '@/lib/prayerReminders';
import type { PrayerEntry } from '@/lib/prayerSchedule';
import { isoDateKey } from '@/lib/time';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius, spacing } from '@/theme/tokens';

export type PrayerTodoCardProps = {
  now: Date;
  todaySchedule: PrayerEntry[];
};

export function PrayerTodoCard({ now, todaySchedule }: PrayerTodoCardProps) {
  const theme = useTheme();
  const { isStacked } = useFontScale();
  const markPrayer = usePrayerMark();
  const pending = usePrayerTodo(now, todaySchedule);
  const todayIso = isoDateKey(now);

  if (pending.length === 0) return null;

  return (
    <Card padding="sm" rounded="xl">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xs,
        }}>
        <Ionicons name="ellipse-outline" size={16} color={theme.colors.textMuted} />
        <AppText size="sm" weight="semibold" tone="textSecondary">
          Husk å be
        </AppText>
      </View>

      {pending.map((item, index) => (
        <TodoRow
          key={`${item.isoDate}-${item.entry.name}`}
          entry={item.entry}
          isYesterday={item.isoDate !== todayIso}
          now={now}
          stacked={isStacked}
          last={index === pending.length - 1}
          onMark={(status) => markPrayer(item.isoDate, item.entry.name, status)}
        />
      ))}
    </Card>
  );
}

function TodoRow({
  entry,
  isYesterday,
  now,
  stacked,
  last,
  onMark,
}: {
  entry: PrayerEntry;
  isYesterday: boolean;
  now: Date;
  stacked: boolean;
  last: boolean;
  onMark: (status: 'prayed' | 'skipped') => void;
}) {
  const theme = useTheme();
  const expired = entry.end != null && now.getTime() >= entry.end.date.getTime();
  const window = entry.end
    ? expired
      ? 'Tiden er over'
      : `Går ut kl. ${formatTimeOfDay(entry.end.date)}`
    : 'Tiden er over';
  const note = isYesterday ? `I går · ${window}` : window;

  const actions = (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <TodoAction
        text="Bedt"
        accessibilityLabel={`Marker ${entry.label} som bedt`}
        background={theme.colors.primarySoft}
        color={theme.colors.onPrimarySoft}
        onPress={() => onMark('prayed')}
      />
      <TodoAction
        text="Hopp over"
        accessibilityLabel={`Hopp over ${entry.label}`}
        background={theme.colors.surfaceSunken}
        color={theme.colors.textSecondary}
        onPress={() => onMark('skipped')}
      />
    </View>
  );

  return (
    <View
      style={{
        gap: spacing.sm,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.colors.border,
      }}>
      <View
        style={{
          flexDirection: stacked ? 'column' : 'row',
          alignItems: stacked ? 'flex-start' : 'center',
          gap: spacing.md,
        }}>
        <View style={{ flex: stacked ? undefined : 1, gap: spacing.xxs }}>
          <AppText weight="medium">{entry.label}</AppText>
          <AppText size="sm" weight={expired ? 'medium' : 'regular'} tone="textMuted">
            {note}
          </AppText>
        </View>
        {actions}
      </View>
    </View>
  );
}

function TodoAction({
  text,
  accessibilityLabel,
  background,
  color,
  onPress,
}: {
  text: string;
  accessibilityLabel: string;
  background: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        {
          minHeight: 36,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: background,
        },
        pressed && { opacity: opacity.pressed },
      ]}>
      <AppText size="sm" weight="semibold" color={color} maxFontSizeMultiplier={1.4} numberOfLines={1}>
        {text}
      </AppText>
    </Pressable>
  );
}
