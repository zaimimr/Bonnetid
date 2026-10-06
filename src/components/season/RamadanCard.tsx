import { View } from 'react-native';
import { t } from '@/lib/i18n';
import { AppText, Card } from '@/components/ui';
import { DuaLink } from '@/components/duas/DuaLink';
import { SeasonCountdownCard } from '@/components/season/SeasonCountdownCard';
import { useFontScale } from '@/hooks/useFontScale';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import type { SeasonStatus } from '@/lib/hijriSeason';
import type { PrayerEntry } from '@/lib/prayerSchedule';
import { DUA_LINKS } from '@/lib/duas';
import { fastingProgress, ramadanCountdown, ramadanCountdownText } from '@/lib/ramadan';
import { formatDurationShort } from '@/lib/time';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

const TRACK_HEIGHT = 6;

function entryFor(schedule: PrayerEntry[], name: PrayerEntry['name']): PrayerEntry | null {
  return schedule.find((entry) => entry.name === name) ?? null;
}

export type RamadanCardProps = {
  now: Date;
  status: SeasonStatus;
};

export function RamadanCard({ now, status }: RamadanCardProps) {
  const { todaySchedule, tomorrowSchedule } = usePrayerDay(now);

  if (!status.isActive) {
    return (
      <SeasonCountdownCard
        text={ramadanCountdownText(status.daysUntilStart ?? 0)}
        hijriYear={status.hijriYear}
      />
    );
  }

  return (
    <FastingDayCard
      now={now}
      dayOfRamadan={status.dayOfSeason}
      hijriYear={status.hijriYear}
      fajr={entryFor(todaySchedule, 'fajr')}
      maghrib={entryFor(todaySchedule, 'maghrib')}
      tomorrowFajr={entryFor(tomorrowSchedule, 'fajr')}
    />
  );
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
          {dayOfRamadan != null
            ? t({
                nb: `Ramadan dag ${dayOfRamadan}`,
                en: `Ramadan day ${dayOfRamadan}`,
                ar: `اليوم ${dayOfRamadan} من رمضان`,
                ur: `رمضان کا ${dayOfRamadan} واں دن`,
              })
            : t({ nb: 'Ramadan', en: 'Ramadan', ar: 'رمضان', ur: 'رمضان' })}
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
          <FastingBoundary
            label={t({ nb: 'Suhoor slutter', en: 'Suhoor ends', ar: 'نهاية السحور', ur: 'سحری کا اختتام' })}
            time={fajr.time}
            stacked={isStacked}
          />
          <FastingBoundary
            label={t({ nb: 'Iftar', en: 'Iftar', ar: 'الإفطار', ur: 'افطار' })}
            time={maghrib.time}
            stacked={isStacked}
            alignEnd={!isStacked}
          />
        </View>
      )}

      {progress != null && (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={t({
            nb: 'Fasten fra Fajr til Maghrib',
            en: 'The fast from Fajr to Maghrib',
            ar: 'الصيام من الفجر إلى المغرب',
            ur: 'فجر سے مغرب تک روزہ',
          })}
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
          {t({
            nb: `${countdown.label} om ${formatDurationShort(countdown.target.getTime() - now.getTime())}`,
            en: `${countdown.label} in ${formatDurationShort(countdown.target.getTime() - now.getTime())}`,
            ar: `${countdown.label} بعد ${formatDurationShort(countdown.target.getTime() - now.getTime())}`,
            ur: `${countdown.label} ${formatDurationShort(countdown.target.getTime() - now.getTime())} میں`,
          })}
        </AppText>
      )}

      <DuaLink duaId={DUA_LINKS.iftar} label={t({ nb: 'Dua ved iftar', en: 'Dua at iftar', ar: 'دعاء الإفطار', ur: 'افطار کی دعا' })} />
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
