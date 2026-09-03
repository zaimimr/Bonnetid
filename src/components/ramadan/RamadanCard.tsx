import { View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { useFontScale } from '@/hooks/useFontScale';
import { useNow } from '@/hooks/useNow';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import { useRamadanStatus } from '@/hooks/useRamadanStatus';
import type { PrayerEntry } from '@/lib/prayerSchedule';
import { fastingProgress, ramadanCountdown, ramadanCountdownText } from '@/lib/ramadan';
import { formatDurationShort } from '@/lib/time';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

const TICK_MS = 30_000;
const TRACK_HEIGHT = 6;

function entryFor(schedule: PrayerEntry[], name: PrayerEntry['name']): PrayerEntry | null {
  return schedule.find((entry) => entry.name === name) ?? null;
}

export function RamadanCard() {
  const now = useNow(TICK_MS);
  const status = useRamadanStatus(now);
  const { todaySchedule, tomorrowSchedule } = usePrayerDay(now);

  if (status.isRamadan) {
    return (
      <FastingDayCard
        now={now}
        dayOfRamadan={status.dayOfRamadan}
        hijriYear={status.hijriYear}
        fajr={entryFor(todaySchedule, 'fajr')}
        maghrib={entryFor(todaySchedule, 'maghrib')}
        tomorrowFajr={entryFor(tomorrowSchedule, 'fajr')}
      />
    );
  }

  if (status.daysUntilRamadan != null) {
    return (
      <Card rounded="xl" padding="md">
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            columnGap: spacing.md,
            rowGap: spacing.xxs,
          }}>
          <AppText size="sm" weight="medium" tone="textSecondary">
            {ramadanCountdownText(status.daysUntilRamadan)}
          </AppText>
          {status.hijriYear != null && (
            <AppText size="sm" tone="textMuted" tabular>
              {status.hijriYear}
            </AppText>
          )}
        </View>
      </Card>
    );
  }

  return null;
}

type FastingDayCardProps = {
  now: Date;
  dayOfRamadan: number | null;
  hijriYear: number | null;
  fajr: PrayerEntry | null;
  maghrib: PrayerEntry | null;
  tomorrowFajr: PrayerEntry | null;
};

function FastingDayCard({
  now,
  dayOfRamadan,
  hijriYear,
  fajr,
  maghrib,
  tomorrowFajr,
}: FastingDayCardProps) {
  const theme = useTheme();
  const { isStacked } = useFontScale();

  const countdown = ramadanCountdown(
    now,
    fajr?.date ?? null,
    maghrib?.date ?? null,
    tomorrowFajr?.date ?? null,
  );
  const progress = fajr && maghrib ? fastingProgress(now, fajr.date, maghrib.date) : null;

  return (
    <Card rounded="xl" padding="lg">
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          columnGap: spacing.md,
          rowGap: spacing.xxs,
        }}>
        <AppText weight="semibold">
          {dayOfRamadan != null ? `Ramadan dag ${dayOfRamadan}` : 'Ramadan'}
        </AppText>
        {hijriYear != null && (
          <AppText size="sm" tone="textMuted" tabular>
            {hijriYear}
          </AppText>
        )}
      </View>

      {fajr && maghrib && (
        <View
          style={{
            marginTop: spacing.md,
            flexDirection: isStacked ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isStacked ? 'flex-start' : 'flex-end',
            gap: isStacked ? spacing.sm : spacing.lg,
          }}>
          <FastingBoundary label="Suhoor slutter" time={fajr.time} stacked={isStacked} />
          <FastingBoundary
            label="Iftar"
            time={maghrib.time}
            stacked={isStacked}
            alignEnd={!isStacked}
          />
        </View>
      )}

      {progress != null && (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Fasten fra Fajr til Maghrib"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
          style={{
            marginTop: spacing.md,
            height: TRACK_HEIGHT,
            borderRadius: radius.full,
            backgroundColor: theme.colors.surfaceSunken,
            overflow: 'hidden',
          }}>
          <View
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              borderRadius: radius.full,
              backgroundColor: theme.colors.primary,
            }}
          />
        </View>
      )}

      {countdown && (
        <AppText
          size="sm"
          weight="medium"
          tone="textSecondary"
          tabular
          style={{ marginTop: spacing.sm }}>
          {`${countdown.label} om ${formatDurationShort(countdown.target.getTime() - now.getTime())}`}
        </AppText>
      )}
    </Card>
  );
}

function FastingBoundary({
  label,
  time,
  stacked,
  alignEnd = false,
}: {
  label: string;
  time: string;
  stacked: boolean;
  alignEnd?: boolean;
}) {
  if (stacked) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs }}>
        <AppText size="xs" tone="textMuted">
          {label}
        </AppText>
        <AppText size="lg" weight="semibold" tabular>
          {time}
        </AppText>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.xxs, alignItems: alignEnd ? 'flex-end' : 'flex-start' }}>
      <AppText size="xs" tone="textMuted">
        {label}
      </AppText>
      <AppText size="xl" weight="semibold" tabular>
        {time}
      </AppText>
    </View>
  );
}
