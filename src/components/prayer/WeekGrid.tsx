import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card } from '@/components/ui';
import { scaleWidth, useFontScale } from '@/hooks/useFontScale';
import { PRAYER_LABELS, type PrayerEntry, type PrayerName } from '@/lib/prayerSchedule';
import {
  TRACKED_PRAYERS,
  weekColumns,
  weekDayKeys,
  type PrayerStatus,
  type WeekColumn,
} from '@/lib/prayerLog';
import { osloDateKey } from '@/lib/time';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius, spacing } from '@/theme/tokens';
import { usePrayerLog } from '@/store/prayerLog';

const WEEKDAY_LABELS = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];
const WEEKDAY_NAMES = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag'];
const LABEL_COLUMN = 76;
const ROW_HEIGHT = 46;
const DOT_SIZE = 26;
const MAX_LABEL_SCALE = 1.2;
const MINUTE_MS = 60 * 1000;

export type WeekGridProps = {
  now: Date;
  todaySchedule: PrayerEntry[];
  onToggle: (isoDate: string, prayer: PrayerName, next: PrayerStatus | null) => void;
};

export function WeekGrid({ now, todaySchedule, onToggle }: WeekGridProps) {
  const theme = useTheme();
  const { scale } = useFontScale();
  const log = usePrayerLog((state) => state.log);

  const minute = Math.floor(now.getTime() / MINUTE_MS);
  const at = useMemo(() => new Date(minute * MINUTE_MS), [minute]);
  const todayIso = osloDateKey(at);
  const columns = useMemo(
    () => weekColumns(weekDayKeys(at), todayIso, todaySchedule, log, at),
    [at, todayIso, todaySchedule, log],
  );

  const labelWidth = scaleWidth(LABEL_COLUMN, scale);

  return (
    <Card padding="sm" rounded="xl">
      <View style={{ flexDirection: 'row', paddingHorizontal: spacing.sm }}>
        <View style={{ width: labelWidth }} />
        {columns.map((column, index) => (
          <DayHeading key={column.isoDate} column={column} index={index} />
        ))}
      </View>

      {TRACKED_PRAYERS.map((prayer, rowIndex) => (
        <View
          key={prayer}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: ROW_HEIGHT,
            paddingHorizontal: spacing.sm,
            borderTopWidth: rowIndex === 0 ? 1 : 0,
            borderBottomWidth: 1,
            borderTopColor: theme.colors.border,
            borderBottomColor: theme.colors.border,
          }}>
          <AppText
            size="sm"
            weight="medium"
            numberOfLines={1}
            maxFontSizeMultiplier={MAX_LABEL_SCALE}
            style={{ width: labelWidth }}>
            {PRAYER_LABELS[prayer]}
          </AppText>
          {columns.map((column, index) => {
            const cell = column.cells.find((item) => item.prayer === prayer);
            return (
              <View
                key={column.isoDate}
                style={{
                  flex: 1,
                  alignSelf: 'stretch',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: column.isToday ? theme.colors.primarySoft : 'transparent',
                }}>
                {cell && (
                  <DayCell
                    prayer={prayer}
                    weekday={WEEKDAY_NAMES[index]}
                    status={cell.status}
                    started={cell.started}
                    isToday={column.isToday}
                    onPress={() =>
                      onToggle(column.isoDate, prayer, cell.status === 'prayed' ? null : 'prayed')
                    }
                  />
                )}
              </View>
            );
          })}
        </View>
      ))}
    </Card>
  );
}

function DayHeading({ column, index }: { column: WeekColumn; index: number }) {
  const theme = useTheme();
  const prayed = column.cells.filter((cell) => cell.status === 'prayed').length;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        gap: spacing.xxs,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xs,
        backgroundColor: column.isToday ? theme.colors.primarySoft : 'transparent',
      }}
      accessibilityLabel={`${WEEKDAY_NAMES[index]}, ${prayed} av 5 bedt`}>
      <AppText
        size="xs"
        weight={column.isToday ? 'bold' : 'medium'}
        tone={column.isToday ? 'onPrimarySoft' : 'textMuted'}
        maxFontSizeMultiplier={MAX_LABEL_SCALE}>
        {WEEKDAY_LABELS[index]}
      </AppText>
      <AppText
        size="xs"
        tone={column.isToday ? 'onPrimarySoft' : 'textMuted'}
        maxFontSizeMultiplier={MAX_LABEL_SCALE}
        tabular>
        {Number(column.isoDate.slice(8, 10))}
      </AppText>
    </View>
  );
}

function DayCell({
  prayer,
  weekday,
  status,
  started,
  isToday,
  onPress,
}: {
  prayer: PrayerName;
  weekday: string;
  status: PrayerStatus | null;
  started: boolean;
  isToday: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const prayed = status === 'prayed';

  return (
    <Pressable
      onPress={onPress}
      disabled={!started}
      hitSlop={hitSlop}
      accessibilityRole="checkbox"
      accessibilityLabel={`${PRAYER_LABELS[prayer]} ${weekday}`}
      accessibilityState={{ checked: prayed, disabled: !started }}
      style={({ pressed }) => [
        {
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: prayed ? theme.colors.primary : 'transparent',
          borderWidth: prayed ? 0 : 1.5,
          borderColor: started
            ? isToday
              ? theme.colors.primary
              : theme.colors.borderStrong
            : theme.colors.border,
          opacity: started ? 1 : opacity.disabled,
        },
        pressed && { opacity: opacity.pressed },
      ]}>
      {prayed && <Ionicons name="checkmark" size={16} color={theme.colors.onPrimary} />}
    </Pressable>
  );
}
