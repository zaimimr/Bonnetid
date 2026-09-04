import { useMemo } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Divider, EmptyState, ErrorState, Screen, Skeleton } from '@/components/ui';
import { PrayerStatusChoice } from '@/components/prayer/PrayerStatusControl';
import { WeekGrid } from '@/components/prayer/WeekGrid';
import { useFontScale } from '@/hooks/useFontScale';
import { useNow } from '@/hooks/useNow';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import { usePrayerMark } from '@/hooks/usePrayerMark';
import { usePrayerTodo } from '@/hooks/usePrayerTodo';
import { useRefresh } from '@/hooks/useRefresh';
import { startedPrayers, weekDayKeys } from '@/lib/prayerLog';
import { formatTimeOfDay } from '@/lib/prayerReminders';
import type { PrayerEntry } from '@/lib/prayerSchedule';
import { osloDateKey } from '@/lib/time';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { usePrayerLog } from '@/store/prayerLog';

export default function TrackerScreen() {
  const now = useNow();
  const theme = useTheme();
  const log = usePrayerLog((state) => state.log);
  const markPrayer = usePrayerMark();
  const { isStacked } = useFontScale();
  const { todaySchedule, isLoading, isError, refetch } = usePrayerDay(now);
  const { refreshing, onRefresh } = useRefresh();
  const pending = usePrayerTodo(now, todaySchedule);
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

          <View style={{ marginTop: spacing.xl }}>
            {pending.length > 0 ? (
              <>
                <AppText size="sm" weight="semibold" style={{ marginBottom: spacing.sm }}>
                  {pending.length === 1 ? 'Én bønn står åpen' : `${pending.length} bønner står åpne`}
                </AppText>
                <Card padding="sm" rounded="xl">
                  {pending.map((item, index) => (
                    <View key={`${item.isoDate}-${item.entry.name}`}>
                      {index > 0 && <Divider />}
                      <PendingPrayer
                        entry={item.entry}
                        isYesterday={item.isoDate !== todayIso}
                        now={now}
                        stacked={isStacked}
                        onSelect={(next) => markPrayer(item.isoDate, item.entry.name, next)}
                      />
                    </View>
                  ))}
                </Card>
              </>
            ) : (
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                accessibilityRole="summary">
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
                <AppText size="sm" tone="textSecondary" style={{ flex: 1 }}>
                  {today.length === 0
                    ? 'Første bønn i dag venter på å begynne'
                    : 'Alt er markert så langt i dag'}
                </AppText>
              </View>
            )}
          </View>

          <AppText size="xs" tone="textMuted" style={{ marginTop: spacing.xl }}>
            Markeringene blir bare hos deg
          </AppText>
        </>
      )}
    </Screen>
  );
}

function PendingPrayer({
  entry,
  isYesterday,
  now,
  stacked,
  onSelect,
}: {
  entry: PrayerEntry;
  isYesterday: boolean;
  now: Date;
  stacked: boolean;
  onSelect: (next: 'prayed' | 'skipped' | null) => void;
}) {
  const expired = entry.end != null && now.getTime() >= entry.end.date.getTime();
  const window = entry.end
    ? expired
      ? 'Tiden er over'
      : `Går ut kl. ${formatTimeOfDay(entry.end.date)}`
    : 'Pågår nå';

  return (
    <View>
      <View
        style={{
          flexDirection: stacked ? 'column' : 'row',
          alignItems: stacked ? 'flex-start' : 'baseline',
          gap: stacked ? spacing.xxs : spacing.sm,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
        }}>
        <AppText weight="medium">{entry.label}</AppText>
        <AppText size="sm" tone="textMuted" tabular>
          {entry.time}
        </AppText>
        <AppText size="xs" tone="textMuted" numberOfLines={1} style={{ flexShrink: 1 }}>
          {isYesterday ? `I går · ${window}` : window}
        </AppText>
      </View>
      <PrayerStatusChoice label={entry.label} status={null} onSelect={onSelect} />
    </View>
  );
}
