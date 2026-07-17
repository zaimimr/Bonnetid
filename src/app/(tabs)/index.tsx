import { useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useHijriMonth, useMosque, useSpecialDates } from '@/api/queries';
import { NextPrayerHero } from '@/components/prayer/NextPrayerHero';
import { PrayerTimesCard } from '@/components/prayer/PrayerTimesCard';
import { EventCard } from '@/components/calendar/EventCard';
import { ErrorState, Screen, SectionHeader, Skeleton } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import { formatGregorianLong, formatHijri } from '@/lib/hijri';
import { jamatTimesForDate } from '@/lib/prayerSchedule';
import { isoDateKey } from '@/lib/time';
import { spacing } from '@/theme/tokens';
import { useActiveLocation, useSettings } from '@/store/settings';

const UPCOMING_EVENT_COUNT = 3;

export default function HomeScreen() {
  const router = useRouter();
  const now = useNow();
  const location = useActiveLocation();
  const mosque = useSettings((state) => state.mosque);
  const { todaySchedule, nextPrayer, isLoading, isError, refetch } = usePrayerDay(now);
  const hijriMonth = useHijriMonth(now.getFullYear(), now.getMonth() + 1);
  const mosqueDetails = useMosque(mosque?.orgNr ?? '', { enabled: mosque != null });
  const specialsThisYear = useSpecialDates(now.getFullYear());
  const specialsNextYear = useSpecialDates(now.getFullYear() + 1);

  const todayIso = isoDateKey(now);
  const todayHijri = hijriMonth.data?.find((day) => day.gregorian_date === todayIso);
  const hijriText = todayHijri
    ? formatHijri(todayHijri.hijri_date, todayHijri.hijri_month_text)
    : '';

  const jamatTimes = jamatTimesForDate(mosqueDetails.data?.jamat, todayIso);

  const upcomingEvents = useMemo(() => {
    const all = [...(specialsThisYear.data ?? []), ...(specialsNextYear.data ?? [])];
    return all
      .filter((event) => event.gregorian_date >= todayIso)
      .slice(0, UPCOMING_EVENT_COUNT);
  }, [specialsThisYear.data, specialsNextYear.data, todayIso]);

  return (
    <Screen scroll refreshing={false} onRefresh={refetch}>
      <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
        {isLoading && <Skeleton height={220} rounded="xl" />}

        {isError && <ErrorState onRetry={refetch} />}

        {nextPrayer && (
          <NextPrayerHero
            nextPrayer={nextPrayer}
            now={now}
            locationName={location.name}
            hijriText={hijriText}
            gregorianText={formatGregorianLong(now)}
            onPressLocation={() => router.push('/location-picker')}
          />
        )}

        {todaySchedule.length > 0 && (
          <View>
            <SectionHeader
              title="Dagens bønnetider"
              subtitle={mosque ? `${location.name} · ${mosque.name}` : location.name}
            />
            <PrayerTimesCard
              schedule={todaySchedule}
              highlightedName={
                nextPrayer && !nextPrayer.isTomorrow ? nextPrayer.next.name : undefined
              }
              mosqueName={mosque?.name}
              jamatTimes={jamatTimes}
              jummah={mosqueDetails.data?.jummah ?? []}
              onPressMosque={() =>
                mosque &&
                router.push({ pathname: '/mosque/[orgNr]', params: { orgNr: mosque.orgNr } })
              }
              onSelectMosque={() => router.push('/mosque-picker')}
            />
          </View>
        )}

        {upcomingEvents.length > 0 && (
          <View>
            <SectionHeader title="Kommende merkedager" />
            <View style={{ gap: spacing.md }}>
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.gregorian_date + event.special_date_name}
                  event={event}
                  onPress={() =>
                    router.push({
                      pathname: '/day/[date]',
                      params: { date: event.gregorian_date },
                    })
                  }
                />
              ))}
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}
