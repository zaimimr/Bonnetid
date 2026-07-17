import { View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import type { HijriDay } from '@/api/types';
import { parseHijriDate } from '@/lib/hijri';
import { isoDateKey } from '@/lib/time';

const WEEKDAY_LABELS = ['man', 'tir', 'ons', 'tor', 'fre', 'lør', 'søn'];

export type MonthGridProps = {
  year: number;
  monthIndex: number;
  days: HijriDay[];
};

export function MonthGrid({ year, monthIndex, days }: MonthGridProps) {
  const theme = useTheme();
  const todayIso = isoDateKey();
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
            style={{ flex: 1 }}>
            {label}
          </AppText>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm }}>
        {cells.map((cell, index) => {
          if (!cell) return <View key={`blank-${index}`} style={{ width: '14.28%', height: 52 }} />;

          const isToday = cell.iso === todayIso;
          const isSpecial = Boolean(cell.hijri?.special_date_name);
          const hijriDay = cell.hijri ? parseHijriDate(cell.hijri.hijri_date)?.day : undefined;

          return (
            <View
              key={cell.iso}
              style={{
                width: '14.28%',
                height: 52,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View
                style={{
                  width: 40,
                  height: 44,
                  borderRadius: radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isToday
                    ? theme.colors.primary
                    : isSpecial
                      ? theme.colors.primarySoft
                      : 'transparent',
                  gap: 1,
                }}>
                <AppText
                  size="sm"
                  weight={isToday ? 'bold' : 'medium'}
                  color={
                    isToday
                      ? theme.colors.onPrimary
                      : isSpecial
                        ? theme.colors.onPrimarySoft
                        : theme.colors.textPrimary
                  }>
                  {cell.dayOfMonth}
                </AppText>
                {hijriDay != null && (
                  <AppText
                    size="xs"
                    color={
                      isToday
                        ? theme.colors.onPrimary
                        : isSpecial
                          ? theme.colors.onPrimarySoft
                          : theme.colors.textMuted
                    }>
                    {hijriDay}
                  </AppText>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
