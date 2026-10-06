import { Pressable, View } from 'react-native';
import { t } from '@/lib/i18n';
import { AppText, Card } from '@/components/ui';
import type { WeekCell, WeekColumn } from '@/lib/prayerLog';
import { weekdayName } from '@/lib/hijri';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';

const WEEKDAY_LABELS = t('prayer.weekdayLabels', { returnObjects: true });
const DOT_SIZE = 9;

export type WeekOverviewProps = {
  columns: WeekColumn[];
  selectedIso: string;
  onSelect: (isoDate: string) => void;
};

export function WeekOverview({ columns, selectedIso, onSelect }: WeekOverviewProps) {
  const theme = useTheme();

  return (
    <Card padding="sm" rounded="xl">
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
        <AppText size="sm" tone="textMuted">
          {t('prayer.thisWeek')}
        </AppText>
      </View>
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: spacing.xs,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
        }}>
        {columns.map((column, index) => {
          const selected = column.isoDate === selectedIso;
          return (
            <Pressable
              key={column.isoDate}
              onPress={() => onSelect(column.isoDate)}
              disabled={column.isFuture}
              accessibilityRole="button"
              accessibilityLabel={`${weekdayName((index + 1) % 7)}${t('prayer.separator')}${describe(column)}`}
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                {
                  flex: 1,
                  alignItems: 'center',
                  gap: spacing.md,
                  paddingVertical: spacing.md,
                  borderRadius: radius.lg,
                  backgroundColor: selected ? theme.colors.primarySoft : 'transparent',
                },
                pressed && { opacity: opacity.pressed },
              ]}>
              <AppText
                size="sm"
                weight={column.isToday ? 'bold' : 'regular'}
                tone={selected ? 'onPrimarySoft' : 'textMuted'}
                maxFontSizeMultiplier={1.3}>
                {WEEKDAY_LABELS[index]}
              </AppText>
              <View style={{ gap: spacing.xs }}>
                {column.cells.map((cell) => (
                  <Dot key={cell.prayer} cell={cell} />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

function describe(column: WeekColumn): string {
  if (column.isFuture)
    return t('prayer.notStarted');
  const prayed = column.cells.filter((cell) => cell.status === 'prayed').length;
  const started = column.cells.filter((cell) => cell.started).length;
  if (started === 0)
    return t('prayer.noPrayersYet');
  return t('prayer.ofPrayed', { prayed, started });
}

function Dot({ cell }: { cell: WeekCell }) {
  const theme = useTheme();
  const prayed = cell.status === 'prayed';

  return (
    <View
      style={{
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: radius.full,
        backgroundColor: prayed
          ? theme.colors.primary
          : cell.started
            ? 'transparent'
            : theme.colors.surfaceSunken,
        borderWidth: prayed || !cell.started ? 0 : 1,
        borderColor: theme.colors.borderStrong,
      }}
    />
  );
}
