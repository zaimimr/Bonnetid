import { useMemo } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, EmptyState, ErrorState, Screen, SectionHeader, Skeleton } from '@/components/ui';
import { PrayerStatusChoice } from '@/components/prayer/PrayerStatusControl';
import { PrayerTodoCard } from '@/components/prayer/PrayerTodoCard';
import { WeekStrip } from '@/components/prayer/WeekStrip';
import { useFontScale } from '@/hooks/useFontScale';
import { useNow } from '@/hooks/useNow';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import { usePrayerMark } from '@/hooks/usePrayerMark';
import { useRefresh } from '@/hooks/useRefresh';
import { statusOf } from '@/lib/prayerLog';
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
  const todayIso = osloDateKey(now);

  const prayers = useMemo(
    () => todaySchedule.filter((entry) => entry.isPrayer),
    [todaySchedule],
  );

  return (
    <Screen scroll edges={[]} refreshing={refreshing} onRefresh={onRefresh}>
      {isLoading && <Skeleton height={220} rounded="xl" />}
      {isError && <ErrorState onRetry={refetch} />}
      {!isLoading && !isError && prayers.length === 0 && (
        <EmptyState message="Ingen bønnetider for dette stedet i dag" icon="time-outline" />
      )}

      {prayers.length > 0 && (
        <>
          <View style={{ marginTop: spacing.md }}>
            <PrayerTodoCard now={now} todaySchedule={todaySchedule} />
          </View>

          <SectionHeader title="I dag" />
          <Card padding="sm" rounded="xl">
            {prayers.map((entry, index) => (
              <TrackerRow
                key={entry.name}
                entry={entry}
                now={now}
                stacked={isStacked}
                status={statusOf(log, todayIso, entry.name)}
                last={index === prayers.length - 1}
                onSelect={(next) => markPrayer(todayIso, entry.name, next)}
              />
            ))}
          </Card>

          <View style={{ marginTop: spacing.lg }}>
            <WeekStrip now={now} todaySchedule={todaySchedule} />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              marginTop: spacing.md,
            }}>
            <Ionicons name="lock-closed-outline" size={14} color={theme.colors.textMuted} />
            <AppText size="xs" tone="textMuted" style={{ flex: 1 }}>
              Markeringene blir bare hos deg
            </AppText>
          </View>
        </>
      )}
    </Screen>
  );
}

function TrackerRow({
  entry,
  now,
  stacked,
  status,
  last,
  onSelect,
}: {
  entry: PrayerEntry;
  now: Date;
  stacked: boolean;
  status: 'prayed' | 'skipped' | null;
  last: boolean;
  onSelect: (status: 'prayed' | 'skipped' | null) => void;
}) {
  const theme = useTheme();
  const started = entry.date.getTime() <= now.getTime();
  const ended = entry.end != null && now.getTime() >= entry.end.date.getTime();
  const note = !started
    ? ''
    : ended
      ? 'Tiden er over'
      : entry.end
        ? `Går ut kl. ${formatTimeOfDay(entry.end.date)}`
        : 'Pågår nå';

  return (
    <View
      style={{
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.colors.border,
      }}>
      <View
        style={{
          flexDirection: stacked ? 'column' : 'row',
          alignItems: stacked ? 'flex-start' : 'center',
          gap: stacked ? spacing.xxs : spacing.md,
          paddingTop: spacing.md,
          paddingBottom: started ? spacing.sm : spacing.md,
          paddingHorizontal: spacing.md,
        }}>
        <AppText weight="medium" style={{ flex: stacked ? undefined : 1 }}>
          {entry.label}
        </AppText>
        <AppText size="sm" tone="textMuted" tabular>
          {entry.time}
        </AppText>
        {!stacked && <View style={{ width: spacing.xs }} />}
        {note !== '' && (
          <AppText size="xs" tone="textMuted" numberOfLines={1}>
            {note}
          </AppText>
        )}
      </View>
      {started && (
        <PrayerStatusChoice label={entry.label} status={status} onSelect={onSelect} />
      )}
    </View>
  );
}
