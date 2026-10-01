import { Pressable, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { useFontScale, scaleWidth } from '@/hooks/useFontScale';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';
import type { HijriDay } from '@/api/types';
import { parseHijriDate } from '@/lib/hijri';
import { isoDateKey, osloDateKey } from '@/lib/time';
import type { CalendarPrimary } from '@/store/settings';

const WEEKDAY_LABELS = ['man', 'tir', 'ons', 'tor', 'fre', 'lør', 'søn'];
const CELL_HEIGHT = 56;
const DAY_HEIGHT = 48;
const DAY_WIDTH = 40;
const WIDE_DAY_WIDTH = 56;
const MAX_GRID_FONT_SCALE = 1.25;
const MARKER_SIZE = 5;

type GridCell = {
  iso: string;
  primary: number;
  secondary: number | undefined;
  hijri: HijriDay | undefined;
};

function gregorianCells(year: number, monthIndex: number, days: HijriDay[]): GridCell[] {
  const byDate = new Map(days.map((day) => [day.gregorian_date, day]));
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    const iso = isoDateKey(new Date(year, monthIndex, index + 1));
    const hijri = byDate.get(iso);
    return {
      iso,
      primary: index + 1,
      secondary: hijri ? parseHijriDate(hijri.hijri_date)?.day : undefined,
      hijri,
    };
  });
}

function hijriCells(days: HijriDay[]): GridCell[] {
  return days.flatMap((day) => {
    const hijriDay = parseHijriDate(day.hijri_date)?.day;
    if (hijriDay == null) return [];
    return [
      {
        iso: day.gregorian_date,
        primary: hijriDay,
        secondary: Number(day.gregorian_date.slice(8, 10)),
        hijri: day,
      },
    ];
  });
}

function isoWeekdayIndex(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number);
  return (new Date(year, month - 1, day).getDay() + 6) % 7;
}

export type MonthGridProps = {
  year: number;
  monthIndex: number;
  days: HijriDay[];
  calendar?: CalendarPrimary;
  todayIso?: string;
  onDayPress?: (iso: string, day: HijriDay | undefined) => void;
};

export function MonthGrid({
  year,
  monthIndex,
  days,
  calendar = 'gregorian',
  todayIso: todayIsoOverride,
  onDayPress,
}: MonthGridProps) {
  const theme = useTheme();
  const { scale } = useFontScale();
  const { isWide } = useResponsive();
  const gridScale = Math.min(scale, MAX_GRID_FONT_SCALE);
  const dayWidth = scaleWidth(isWide ? WIDE_DAY_WIDTH : DAY_WIDTH, gridScale);
  const cellHeight = scaleWidth(CELL_HEIGHT, gridScale);
  const dayHeight = scaleWidth(DAY_HEIGHT, gridScale);
  const todayIso = todayIsoOverride ?? osloDateKey();
  const monthCells =
    calendar === 'hijri' ? hijriCells(days) : gregorianCells(year, monthIndex, days);
  const leadingBlanks = monthCells.length > 0 ? isoWeekdayIndex(monthCells[0].iso) : 0;

  const cells: (GridCell | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...monthCells,
  ];

  return (
    <Card rounded="xl" padding="md">
      <View style={{ flexDirection: 'row' }}>
        {WEEKDAY_LABELS.map((label) => (
          <AppText
            key={label}
            size="xs"
            weight="medium"
            tone="textMuted"
            align="center"
            maxFontSizeMultiplier={MAX_GRID_FONT_SCALE}
            numberOfLines={1}
            style={{ flex: 1 }}>
            {label}
          </AppText>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm }}>
        {cells.map((cell, index) => {
          if (!cell)
            return <View key={`blank-${index}`} style={{ width: '14.28%', height: cellHeight }} />;

          const isToday = cell.iso === todayIso;
          const isSpecial = Boolean(cell.hijri?.special_date_name);
          const label = isSpecial
            ? `${cell.primary}. ${cell.hijri?.special_date_name}`
            : String(cell.primary);

          return (
            <Pressable
              key={cell.iso}
              onPress={onDayPress ? () => onDayPress(cell.iso, cell.hijri) : undefined}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: isToday }}
              style={({ pressed }) => [
                {
                  width: '14.28%',
                  height: cellHeight,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                pressed && { opacity: opacity.pressed },
              ]}>
              <View
                style={{
                  width: dayWidth,
                  height: dayHeight,
                  borderRadius: radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isToday ? theme.colors.primary : 'transparent',
                  gap: 1,
                }}>
                <AppText
                  size="sm"
                  weight={isToday ? 'bold' : 'medium'}
                  color={isToday ? theme.colors.onPrimary : theme.colors.textPrimary}
                  maxFontSizeMultiplier={MAX_GRID_FONT_SCALE}>
                  {cell.primary}
                </AppText>
                {cell.secondary != null && (
                  <AppText
                    size="xs"
                    color={isToday ? theme.colors.onPrimary : theme.colors.textMuted}
                    maxFontSizeMultiplier={MAX_GRID_FONT_SCALE}>
                    {cell.secondary}
                  </AppText>
                )}
                <View
                  style={{
                    width: MARKER_SIZE,
                    height: MARKER_SIZE,
                    borderRadius: radius.full,
                    marginTop: 1,
                    backgroundColor: isSpecial
                      ? isToday
                        ? theme.colors.onPrimary
                        : theme.colors.accent
                      : 'transparent',
                  }}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}
