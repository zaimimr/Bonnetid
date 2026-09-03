import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Card } from '@/components/ui';
import { weekColumns, weekDayKeys, type WeekCell } from '@/lib/prayerLog';
import type { PrayerEntry } from '@/lib/prayerSchedule';
import { isoDateKey } from '@/lib/time';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';
import { usePrayerLog } from '@/store/prayerLog';

const WEEKDAY_LABELS = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];
const WEEKDAY_NAMES = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag'];
const DOT_SIZE = 7;
const MINUTE_MS = 60 * 1000;

export type WeekStripProps = {
  now: Date;
  todaySchedule: PrayerEntry[];
};

export function WeekStrip({ now, todaySchedule }: WeekStripProps) {
  const theme = useTheme();
  const router = useRouter();
  const log = usePrayerLog((state) => state.log);

  const minute = Math.floor(now.getTime() / MINUTE_MS);
  const at = useMemo(() => new Date(minute * MINUTE_MS), [minute]);
  const todayIso = isoDateKey(at);
  const columns = useMemo(
    () => weekColumns(weekDayKeys(at), todayIso, todaySchedule, log, at),
    [at, todayIso, todaySchedule, log],
  );

  return (
    <Card padding="sm" rounded="xl">
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
        <AppText size="xs" weight="medium" tone="textMuted">
          Denne uken
        </AppText>
      </View>
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: spacing.sm,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        }}>
        {columns.map((column, index) => (
          <Pressable
            key={column.isoDate}
            onPress={() =>
              router.push({ pathname: '/day/[date]', params: { date: column.isoDate } })
            }
            accessibilityRole="button"
            accessibilityLabel={`Vis bønnetider for ${WEEKDAY_NAMES[index]}`}
            style={({ pressed }) => [
              {
                flex: 1,
                alignItems: 'center',
                gap: spacing.sm,
                paddingVertical: spacing.sm,
                borderRadius: radius.md,
                backgroundColor: column.isToday ? theme.colors.primarySoft : 'transparent',
              },
              pressed && { opacity: opacity.pressed },
            ]}>
            <AppText
              size="xs"
              weight={column.isToday ? 'bold' : 'regular'}
              tone={column.isToday ? 'onPrimarySoft' : 'textMuted'}
              maxFontSizeMultiplier={1.3}>
              {WEEKDAY_LABELS[index]}
            </AppText>
            <View style={{ gap: spacing.xs }}>
              {column.cells.map((cell) => (
                <Dot key={cell.prayer} cell={cell} />
              ))}
            </View>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

function Dot({ cell }: { cell: WeekCell }) {
  const theme = useTheme();

  const filled =
    cell.status === 'prayed'
      ? theme.colors.primary
      : cell.status === 'skipped'
        ? theme.colors.borderStrong
        : null;

  return (
    <View
      style={{
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: radius.full,
        backgroundColor: filled ?? (cell.started ? 'transparent' : theme.colors.surfaceSunken),
        borderWidth: filled || !cell.started ? 0 : 1,
        borderColor: theme.colors.borderStrong,
      }}
    />
  );
}
