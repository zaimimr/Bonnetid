import { Pressable, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { useFontScale, scaleWidth } from '@/hooks/useFontScale';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';
import type { HijriDay } from '@/api/types';
import { parseHijriDate } from '@/lib/hijri';
import { isoDateKey, osloDateKey } from '@/lib/time';

const WEEKDAY_LABELS = ['man', 'tir', 'ons', 'tor', 'fre', 'lør', 'søn'];
const CELL_HEIGHT = 52;
const DAY_HEIGHT = 44;
const DAY_WIDTH = 40;
const WIDE_DAY_WIDTH = 56;
const MAX_GRID_FONT_SCALE = 1.25;

export type MonthGridProps = {
  year: number;
  monthIndex: number;
  days: HijriDay[];
  selectedIso?: string | null;
  onDayPress?: (iso: string, day: HijriDay | undefined) => void;
};

export function MonthGrid({ year, monthIndex, days, selectedIso, onDayPress }: MonthGridProps) {
  const theme = useTheme();
  const { scale } = useFontScale();
  const { isWide } = useResponsive();
  const gridScale = Math.min(scale, MAX_GRID_FONT_SCALE);
  const dayWidth = scaleWidth(isWide ? WIDE_DAY_WIDTH : DAY_WIDTH, gridScale);
  const cellHeight = scaleWidth(CELL_HEIGHT, gridScale);
  const dayHeight = scaleWidth(DAY_HEIGHT, gridScale);
  const todayIso = osloDateKey();
  const byDate = new Map(days.map((day) => [day.gregorian_date, day]));

  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

  const cells: ({ dayOfMonth: number; iso: string; hijri: HijriDay | undefined } | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(year, monthIndex, index + 1);
      const iso = isoDateKey(date);
      return { dayOfMonth: index + 1, iso, hijri: byDate.get(iso) };
    }),
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
          const isSelected = cell.iso === selectedIso;
          const isSpecial = Boolean(cell.hijri?.special_date_name);
          const hijriDay = cell.hijri ? parseHijriDate(cell.hijri.hijri_date)?.day : undefined;

          const textColor = isToday
            ? theme.colors.onPrimary
            : isSpecial
              ? theme.colors.onPrimarySoft
              : theme.colors.textPrimary;

          return (
            <Pressable
              key={cell.iso}
              onPress={onDayPress ? () => onDayPress(cell.iso, cell.hijri) : undefined}
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
                  backgroundColor: isToday
                    ? theme.colors.primary
                    : isSpecial
                      ? theme.colors.primarySoft
                      : 'transparent',
                  borderWidth: isSelected ? 2 : 0,
                  borderColor: theme.colors.accent,
                  gap: 1,
                }}>
                <AppText
                  size="sm"
                  weight={isToday || isSelected ? 'bold' : 'medium'}
                  color={textColor}
                  maxFontSizeMultiplier={MAX_GRID_FONT_SCALE}>
                  {cell.dayOfMonth}
                </AppText>
                {hijriDay != null && (
                  <AppText
                    size="xs"
                    color={isToday ? theme.colors.onPrimary : isSpecial ? theme.colors.onPrimarySoft : theme.colors.textMuted}
                    maxFontSizeMultiplier={MAX_GRID_FONT_SCALE}>
                    {hijriDay}
                  </AppText>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}
