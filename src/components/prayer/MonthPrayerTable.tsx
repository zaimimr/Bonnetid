import { Pressable, ScrollView, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { useFontScale, scaleWidth } from '@/hooks/useFontScale';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';
import type { PrayerDay } from '@/api/types';
import type { AsrMethodPreference } from '@/store/settings';
import { asrTimeFor } from '@/lib/prayerSchedule';
import { isoDateKey, osloDayKey, osloTimeToLocalClock, parseDayKey } from '@/lib/time';

const COLUMNS = ['Fajr', 'Sol', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const DATE_COLUMN_WIDTH = 40;
const TIME_COLUMN_WIDTH = 52;
const MAX_TABLE_FONT_SCALE = 1.3;
const SCROLL_FROM_SCALE = 1.15;
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'O', 'T', 'F', 'L'];
const FRIDAY = 5;
const MARKER_SIZE = 5;

export type MonthPrayerTableProps = {
  days: PrayerDay[];
  asrMethod: AsrMethodPreference;
  todayDayKey?: string;
  specialDates?: ReadonlySet<string>;
  onDayPress?: (day: PrayerDay) => void;
};

export function MonthPrayerTable({
  days,
  asrMethod,
  todayDayKey,
  specialDates,
  onDayPress,
}: MonthPrayerTableProps) {
  const theme = useTheme();
  const { scale } = useFontScale();
  const today = todayDayKey ?? osloDayKey();
  const tableScale = Math.min(scale, MAX_TABLE_FONT_SCALE);
  const dateColumnWidth = scaleWidth(DATE_COLUMN_WIDTH, tableScale);
  const scrolls = scale >= SCROLL_FROM_SCALE;
  const timeColumnStyle = scrolls
    ? { width: scaleWidth(TIME_COLUMN_WIDTH, tableScale) }
    : { flex: 1 };

  const timesFor = (day: PrayerDay): (string | null)[] => [
    day.fajr,
    day.shuruq_sunrise,
    day.duhr,
    asrTimeFor(day, asrMethod),
    day.maghrib,
    day.isha,
  ];

  const table = (
    <View style={scrolls ? undefined : { width: '100%' }}>
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
          maxFontSizeMultiplier={MAX_TABLE_FONT_SCALE}
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
            maxFontSizeMultiplier={MAX_TABLE_FONT_SCALE}
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
                maxFontSizeMultiplier={MAX_TABLE_FONT_SCALE}
                tabular>
                {date.getDate()}
              </AppText>
              <AppText
                size="xs"
                tone={isFriday ? 'primary' : 'textMuted'}
                maxFontSizeMultiplier={MAX_TABLE_FONT_SCALE}>
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
                maxFontSizeMultiplier={MAX_TABLE_FONT_SCALE}
                numberOfLines={1}
                style={timeColumnStyle}>
                {time ? (osloTimeToLocalClock(date, time) ?? time) : '–'}
              </AppText>
            ))}
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <Card padding="sm" rounded="xl">
      {scrolls ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {table}
        </ScrollView>
      ) : (
        table
      )}
    </Card>
  );
}
