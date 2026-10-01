import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { useFontScale, scaleWidth } from '@/hooks/useFontScale';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';
import type { PrayerDay } from '@/api/types';
import type { AsrMethodPreference } from '@/store/settings';
import { asrTimeFor } from '@/lib/prayerSchedule';
import {
  formatZonedClock,
  isoDateKey,
  osloDayKey,
  parseDayKey,
  wallClockToDate,
  type PrayerTimeZone,
} from '@/lib/time';

const COLUMNS = ['Fajr', 'Sol', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const DATE_COLUMN_WIDTH = 40;
const TIME_TEXT_WIDTH = 32;
const MAX_TABLE_FONT_SCALE = 1.3;
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'O', 'T', 'F', 'L'];
const FRIDAY = 5;
const MARKER_SIZE = 5;

export type MonthPrayerTableProps = {
  days: PrayerDay[];
  asrMethod: AsrMethodPreference;
  zone?: PrayerTimeZone;
  todayDayKey?: string;
  specialDates?: ReadonlySet<string>;
  onDayPress?: (day: PrayerDay) => void;
};

export function MonthPrayerTable({
  days,
  asrMethod,
  zone = 'oslo',
  todayDayKey,
  specialDates,
  onDayPress,
}: MonthPrayerTableProps) {
  const theme = useTheme();
  const { scale } = useFontScale();
  const today = todayDayKey ?? osloDayKey();
  const [tableWidth, setTableWidth] = useState(0);
  const contentWidth = tableWidth - spacing.sm * 2 - spacing.xs * COLUMNS.length;
  const fitScale =
    tableWidth > 0 ? contentWidth / (DATE_COLUMN_WIDTH + TIME_TEXT_WIDTH * COLUMNS.length) : 1;
  const tableScale = Math.max(1, Math.min(scale, MAX_TABLE_FONT_SCALE, fitScale));
  const dateColumnWidth = scaleWidth(DATE_COLUMN_WIDTH, tableScale);
  const timeColumnStyle = { flex: 1 };

  const timesFor = (day: PrayerDay): (string | null)[] => [
    day.fajr,
    day.fajr_endtime ?? day.shuruq_sunrise,
    day.duhr,
    asrTimeFor(day, asrMethod),
    day.maghrib,
    day.isha,
  ];

  const table = (
    <View
      style={{ width: '100%' }}
      onLayout={(event) => setTableWidth(Math.round(event.nativeEvent.layout.width))}>
      <View
        style={{
          flexDirection: 'row',
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.sm,
          gap: spacing.xs,
        }}>
        <AppText
          size="xs"
          weight="medium"
          tone="textMuted"
          maxFontSizeMultiplier={tableScale}
          style={{ width: dateColumnWidth }}>
          Dato
        </AppText>
        {COLUMNS.map((column) => (
          <AppText
            key={column}
            size="xs"
            weight="medium"
            tone="textMuted"
            align="center"
            maxFontSizeMultiplier={tableScale}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            style={timeColumnStyle}>
            {column}
          </AppText>
        ))}
      </View>

      {days.map((day) => {
        const date = parseDayKey(day.date);
        const isToday = day.date === today;
        const isFriday = date.getDay() === FRIDAY;
        const isSpecial = specialDates?.has(isoDateKey(date)) ?? false;
        return (
          <Pressable
            key={day.date}
            onPress={onDayPress ? () => onDayPress(day) : undefined}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.sm,
                gap: spacing.xs,
                borderRadius: radius.md,
                backgroundColor: isToday ? theme.colors.primarySoft : 'transparent',
              },
              pressed && { opacity: opacity.pressed },
            ]}>
            <View
              style={{
                width: dateColumnWidth,
                flexDirection: 'row',
                alignItems: 'baseline',
                gap: spacing.xxs,
              }}>
              <AppText
                size="sm"
                weight={isToday || isFriday ? 'bold' : 'medium'}
                tone={isToday ? 'onPrimarySoft' : isFriday ? 'primary' : 'textPrimary'}
                maxFontSizeMultiplier={tableScale}
                tabular>
                {date.getDate()}
              </AppText>
              <AppText
                size="xs"
                tone={isFriday ? 'primary' : 'textMuted'}
                maxFontSizeMultiplier={tableScale}>
                {WEEKDAY_LETTERS[date.getDay()]}
              </AppText>
              {isSpecial && (
                <View
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    justifyContent: 'center',
                  }}>
                  <View
                    style={{
                      width: MARKER_SIZE,
                      height: MARKER_SIZE,
                      borderRadius: radius.full,
                      backgroundColor: theme.colors.accent,
                    }}
                  />
                </View>
              )}
            </View>
            {timesFor(day).map((time, index) => (
              <AppText
                key={COLUMNS[index]}
                size="xs"
                weight={isToday ? 'semibold' : 'regular'}
                tone={isToday ? 'onPrimarySoft' : index === 1 ? 'textMuted' : 'textSecondary'}
                align="center"
                tabular
                maxFontSizeMultiplier={tableScale}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={timeColumnStyle}>
                {time ? formatZonedClock(wallClockToDate(date, time, zone), zone) : '–'}
              </AppText>
            ))}
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <Card padding="sm" rounded="xl">
      {table}
    </Card>
  );
}
