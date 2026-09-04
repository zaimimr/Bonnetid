import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePrayerTimes } from '@/api/queries';
import { AppText, Card, EmptyState, ErrorState, Screen, Skeleton } from '@/components/ui';
import { PrayerCheck } from '@/components/prayer/PrayerStatusControl';
import { WeekOverview } from '@/components/prayer/WeekOverview';
import { useEffectiveAsrMethod } from '@/hooks/useEffectiveAsrMethod';
import { useFontScale } from '@/hooks/useFontScale';
import { useNow } from '@/hooks/useNow';
import { usePrayerMark } from '@/hooks/usePrayerMark';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import { useRefresh } from '@/hooks/useRefresh';
import { formatGregorianLong } from '@/lib/hijri';
import { statusOf, weekColumns, weekDayKeys } from '@/lib/prayerLog';
import { buildDaySchedule } from '@/lib/prayerSchedule';
import { isoDateKey, osloDateKey, todayKey } from '@/lib/time';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius, spacing } from '@/theme/tokens';
import { usePrayerLog } from '@/store/prayerLog';
import { useActiveLocation } from '@/store/settings';

const MINUTE_MS = 60 * 1000;

function parseIso(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function shiftIso(isoDate: string, days: number): string {
  const date = parseIso(isoDate);
  date.setDate(date.getDate() + days);
  return isoDateKey(date);
}

export default function TrackerScreen() {
  const now = useNow();
  const theme = useTheme();
  const location = useActiveLocation();
  const asrMethod = useEffectiveAsrMethod();
  const log = usePrayerLog((state) => state.log);
  const markPrayer = usePrayerMark();
  const { isStacked } = useFontScale();
  const { todaySchedule, isLoading, isError, refetch } = usePrayerDay(now);
  const { refreshing, onRefresh } = useRefresh();

  const todayIso = osloDateKey(now);
  const [selectedIso, setSelectedIso] = useState(todayIso);
  const selected = selectedIso > todayIso ? todayIso : selectedIso;
  const isToday = selected === todayIso;

  const minute = Math.floor(now.getTime() / MINUTE_MS);
  const at = useMemo(() => new Date(minute * MINUTE_MS), [minute]);

  const selectedDate = useMemo(() => parseIso(selected), [selected]);
  const month = usePrayerTimes(
    location.iso,
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
  );
  const row = month.data?.find((day) => day.date === todayKey(selectedDate));

  const schedule = useMemo(() => {
    if (isToday) return todaySchedule.filter((entry) => entry.isPrayer);
    if (!row) return [];
    return buildDaySchedule(row, selectedDate, asrMethod).filter((entry) => entry.isPrayer);
  }, [isToday, todaySchedule, row, selectedDate, asrMethod]);

  const columns = useMemo(
    () => weekColumns(weekDayKeys(selectedDate), todayIso, todaySchedule, log, at),
    [selectedDate, todayIso, todaySchedule, log, at],
  );

  const dayLabel = isToday ? 'I dag' : formatGregorianLong(selectedDate);
  const loading = isLoading || (!isToday && month.isLoading);
  const failed = isError || (!isToday && month.isError);

  return (
    <Screen scroll edges={[]} refreshing={refreshing} onRefresh={onRefresh}>
      <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
        <WeekOverview columns={columns} selectedIso={selected} onSelect={setSelectedIso} />

        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              marginBottom: spacing.sm,
            }}>
            <DayArrow
              direction="back"
              onPress={() => setSelectedIso(shiftIso(selected, -1))}
              disabled={false}
            />
            <AppText weight="semibold" align="center" style={{ flex: 1 }} numberOfLines={1}>
              {dayLabel}
            </AppText>
            <DayArrow
              direction="forward"
              onPress={() => setSelectedIso(shiftIso(selected, 1))}
              disabled={isToday}
            />
          </View>

          {loading && <Skeleton height={240} rounded="xl" />}
          {!loading && failed && <ErrorState onRetry={refetch} />}
          {!loading && !failed && schedule.length === 0 && (
            <EmptyState message="Ingen bønnetider for denne dagen" icon="time-outline" />
          )}

          {!loading && !failed && schedule.length > 0 && (
            <Card padding="sm" rounded="xl">
              {schedule.map((entry, index) => {
                const status = statusOf(log, selected, entry.name);
                const started = !isToday || entry.date.getTime() <= now.getTime();
                return (
                  <View
                    key={entry.name}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      paddingLeft: spacing.md,
                      paddingRight: spacing.xs,
                      paddingVertical: spacing.xs,
                      minHeight: 52,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: theme.colors.border,
                    }}>
                    <AppText
                      weight="medium"
                      tone={started ? 'textPrimary' : 'textMuted'}
                      style={{ flex: 1 }}
                      numberOfLines={1}>
                      {entry.label}
                    </AppText>
                    <AppText
                      size={isStacked ? 'sm' : 'md'}
                      tone={started ? 'textSecondary' : 'textMuted'}
                      tabular>
                      {entry.time}
                    </AppText>
                    {started ? (
                      <PrayerCheck
                        label={entry.label}
                        prayed={status === 'prayed'}
                        emphasis="active"
                        onToggle={() =>
                          markPrayer(selected, entry.name, status === 'prayed' ? null : 'prayed')
                        }
                      />
                    ) : (
                      <View style={{ width: 44 }} />
                    )}
                  </View>
                );
              })}
            </Card>
          )}
        </View>
      </View>
    </Screen>
  );
}

function DayArrow({
  direction,
  onPress,
  disabled,
}: {
  direction: 'back' | 'forward';
  onPress: () => void;
  disabled: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={direction === 'back' ? 'Forrige dag' : 'Neste dag'}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        {
          width: 40,
          height: 40,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.surfaceSunken,
          opacity: disabled ? opacity.disabled : 1,
        },
        pressed && !disabled && { opacity: opacity.pressed },
      ]}>
      <Ionicons
        name={direction === 'back' ? 'chevron-back' : 'chevron-forward'}
        size={20}
        color={theme.colors.textSecondary}
      />
    </Pressable>
  );
}
