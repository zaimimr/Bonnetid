import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { t } from '@/lib/i18n';
import { AppText, Card } from '@/components/ui';
import { useFontScale, scaleWidth } from '@/hooks/useFontScale';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';
import type { PrayerDay } from '@/api/types';
import type { AsrMethodPreference, CalendarPrimary } from '@/store/settings';
import { asrTimeFor, PRAYER_LABELS } from '@/lib/prayerSchedule';
import {
  formatZonedClock,
  isoDateKey,
  osloDayKey,
  parseDayKey,
  wallClockToDate,
  type PrayerTimeZone,
} from '@/lib/time';

const COLUMNS = [
  PRAYER_LABELS.fajr,
  t('prayer.sun'),
  PRAYER_LABELS.duhr,
  PRAYER_LABELS.asr,
  PRAYER_LABELS.maghrib,
  PRAYER_LABELS.isha,
];
const DATE_COLUMN_WIDTH = 30;
const TIME_TEXT_WIDTH = 40;
const WEEKDAY_LETTERS = t('prayer.weekdayLetters', { returnObjects: true });
const FRIDAY = 5;

export type MonthPrayerTableProps = {
  days: PrayerDay[];
  asrMethod: AsrMethodPreference;
  zone?: PrayerTimeZone;
  todayDayKey?: string;
  specialDates?: ReadonlySet<string>;
  calendar?: CalendarPrimary;
  onDayPress?: (day: PrayerDay) => void;
};

function hijriDayNumber(day: PrayerDay): number | null {
  const value = Number(day.hijri_date.split('-')[0]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function MonthPrayerTable({
  days,
  asrMethod,
  zone = 'oslo',
  todayDayKey,
  specialDates,
  calendar = 'gregorian',
  onDayPress,
}: MonthPrayerTableProps) {
  const theme = useTheme();
  const { scale } = useFontScale();
  const today = todayDayKey ?? osloDayKey();
  const [tableWidth, setTableWidth] = useState(0);
  const contentWidth = tableWidth - spacing.xs * 2 - spacing.xxs * COLUMNS.length;
  const fitScale =
    tableWidth > 0 ? contentWidth / (DATE_COLUMN_WIDTH + TIME_TEXT_WIDTH * COLUMNS.length) : 1;
  const tableScale = Math.max(1, Math.min(scale, fitScale));
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
          paddingHorizontal: spacing.xs,
          gap: spacing.xxs,
        }}>
        <AppText
          size="xs"
          weight="medium"
          tone="textMuted"
          maxFontSizeMultiplier={tableScale}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={{ width: dateColumnWidth }}>
          {t('prayer.date')}
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
                paddingHorizontal: spacing.xs,
                gap: spacing.xxs,
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
                weight={isToday || isFriday || isSpecial ? 'bold' : 'medium'}
                tone={
                  isSpecial
                    ? 'accent'
                    : isToday
                      ? 'onPrimarySoft'
                      : isFriday
                        ? 'primary'
                        : 'textPrimary'
                }
                maxFontSizeMultiplier={tableScale}
                tabular>
                {calendar === 'hijri' ? (hijriDayNumber(day) ?? date.getDate()) : date.getDate()}
              </AppText>
              <AppText
                size="xs"
                tone={isSpecial ? 'accent' : isFriday ? 'primary' : 'textMuted'}
                maxFontSizeMultiplier={tableScale}>
                {WEEKDAY_LETTERS[date.getDay()]}
              </AppText>
            </View>
            {timesFor(day).map((time, index) => (
              <AppText
                key={COLUMNS[index]}
                size="sm"
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
    <Card padding="xs" rounded="xl">
      {table}
    </Card>
  );
}
