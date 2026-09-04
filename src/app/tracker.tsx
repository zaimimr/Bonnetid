import { useMemo } from 'react';
import { View } from 'react-native';
import { AppText, EmptyState, ErrorState, Screen, Skeleton } from '@/components/ui';
import { WeekGrid } from '@/components/prayer/WeekGrid';
import { useNow } from '@/hooks/useNow';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import { usePrayerMark } from '@/hooks/usePrayerMark';
import { useRefresh } from '@/hooks/useRefresh';
import { startedPrayers, weekDayKeys } from '@/lib/prayerLog';
import { osloDateKey } from '@/lib/time';
import { spacing } from '@/theme/tokens';
import { usePrayerLog } from '@/store/prayerLog';

export default function TrackerScreen() {
  const now = useNow();
  const log = usePrayerLog((state) => state.log);
  const markPrayer = usePrayerMark();
  const { todaySchedule, isLoading, isError, refetch } = usePrayerDay(now);
  const { refreshing, onRefresh } = useRefresh();
  const todayIso = osloDateKey(now);

  const hasTimes = todaySchedule.some((entry) => entry.isPrayer);

  const today = useMemo(
    () => startedPrayers([{ isoDate: todayIso, schedule: todaySchedule }], log, now),
    [todayIso, todaySchedule, log, now],
  );
  const todayPrayed = today.filter((item) => item.status === 'prayed').length;

  const week = useMemo(() => {
    const days = weekDayKeys(now);
    const past = days.filter((iso) => iso < todayIso);
    const prayed =
      past.reduce(
        (total, iso) =>
          total +
          Object.entries(log).filter(
            ([key, entry]) => key.startsWith(`${iso}|`) && entry.status === 'prayed',
          ).length,
        0,
      ) + todayPrayed;
    return { started: past.length * 5 + today.length, prayed };
  }, [now, todayIso, log, today.length, todayPrayed]);

  return (
    <Screen scroll edges={[]} refreshing={refreshing} onRefresh={onRefresh}>
      {isLoading && (
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          <Skeleton height={64} rounded="xl" />
          <Skeleton height={280} rounded="xl" />
        </View>
      )}

      {isError && (
        <View style={{ marginTop: spacing.lg }}>
          <ErrorState onRetry={refetch} />
        </View>
      )}

      {!isLoading && !isError && !hasTimes && (
        <View style={{ marginTop: spacing.lg }}>
          <EmptyState
            message="Ingen bønnetider for dette stedet i dag, så det er ingenting å markere ennå"
            icon="time-outline"
          />
        </View>
      )}

      {!isLoading && !isError && hasTimes && (
        <>
          <View style={{ marginTop: spacing.lg, marginBottom: spacing.md, gap: spacing.xxs }}>
            <AppText size="lg" weight="bold" heading>
              {week.started === 0
                ? 'Uken har ikke begynt'
                : `${week.prayed} av ${week.started} bedt denne uken`}
            </AppText>
            <AppText size="sm" tone="textMuted">
              {today.length === 0
                ? 'Ingen bønner har begynt i dag ennå'
                : `I dag: ${todayPrayed} av ${today.length}`}
            </AppText>
          </View>

          <WeekGrid
            now={now}
            todaySchedule={todaySchedule}
            onToggle={(isoDate, prayer, next) => markPrayer(isoDate, prayer, next)}
          />

          <AppText size="xs" tone="textMuted" style={{ marginTop: spacing.sm }}>
            Trykk på en rute for å markere bønnen som bedt
          </AppText>

          <AppText size="xs" tone="textMuted" style={{ marginTop: spacing.xl }}>
            Markeringene blir bare hos deg
          </AppText>
        </>
      )}
    </Screen>
  );
}
