import { useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useHijriMonth, useMosque, useSpecialDates } from '@/api/queries';
import { NextPrayerHero } from '@/components/prayer/NextPrayerHero';
import { PrayerTimesCard } from '@/components/prayer/PrayerTimesCard';
import { EventCard } from '@/components/calendar/EventCard';
import { AppText, EmptyState, ErrorState, Screen, SectionHeader, Skeleton } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { useTimezoneNote } from '@/hooks/useTimezoneNote';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import { useRefresh } from '@/hooks/useRefresh';
import { formatGregorianLong, formatHijri } from '@/lib/hijri';
import { adhanTimesFromSchedule, jamatTimesForDate } from '@/lib/prayerSchedule';
import { isoDateIsFriday, osloDateKey } from '@/lib/time';
import { spacing } from '@/theme/tokens';
import { useActiveLocation, useSettings } from '@/store/settings';

const UPCOMING_EVENT_COUNT = 3;

export default function HomeScreen() {
  const router = useRouter();
  const now = useNow();
  const location = useActiveLocation();
  const mosque = useSettings((state) => state.mosque);
  const { todaySchedule, nextPrayer, isLoading, isError, refetch } = usePrayerDay(now);
  const { refreshing, onRefresh } = useRefresh();
  const timezoneNote = useTimezoneNote(now);
  const hijriMonth = useHijriMonth(now.getFullYear(), now.getMonth() + 1);
  const mosqueDetails = useMosque(mosque?.orgNr ?? '', { enabled: mosque != null });
  const specialsThisYear = useSpecialDates(now.getFullYear());
  const specialsNextYear = useSpecialDates(now.getFullYear() + 1);

  const todayIso = osloDateKey(now);
  const todayHijri = hijriMonth.data?.find((day) => day.gregorian_date === todayIso);
  const hijriText = todayHijri
    ? formatHijri(todayHijri.hijri_date, todayHijri.hijri_month_text)
    : '';

  const mosqueIso = mosqueDetails.data?.location_iso;
  const mosqueInLocation = mosqueIso == null || mosqueIso === location.iso;
  const jamatTimes = mosqueInLocation
    ? jamatTimesForDate(
        mosqueDetails.data?.jamat,
        todayIso,
        adhanTimesFromSchedule(todaySchedule),
        mosqueDetails.data?.jummah ?? [],
      )
    : {};

  const upcomingEvents = useMemo(() => {
    const all = [...(specialsThisYear.data ?? []), ...(specialsNextYear.data ?? [])];
    return all
      .filter((event) => event.gregorian_date >= todayIso)
      .slice(0, UPCOMING_EVENT_COUNT);
  }, [specialsThisYear.data, specialsNextYear.data, todayIso]);

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
      <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
        {isLoading && <Skeleton height={220} rounded="xl" />}

        {isError && <ErrorState onRetry={refetch} />}

        {!isLoading && !isError && todaySchedule.length === 0 && (
          <EmptyState message="Ingen bønnetider for dette stedet i dag" icon="time-outline" />
        )}

        {nextPrayer && (
          <NextPrayerHero
            nextPrayer={nextPrayer}
            now={now}
            hijriText={hijriText}
            gregorianText={formatGregorianLong(now)}
            onPressDate={() =>
              router.push({ pathname: '/day/[date]', params: { date: todayIso } })
            }
          />
        )}

        {todaySchedule.length > 0 && (
          <View>
            <SectionHeader
              title="Dagens bønnetider"
              subtitle={
                mosque && mosqueInLocation ? `${location.name} · ${mosque.name}` : location.name
              }
              style={timezoneNote ? { marginBottom: spacing.xs } : undefined}
            />
            {timezoneNote && (
              <AppText size="xs" tone="textMuted" style={{ marginBottom: spacing.md }}>
                {timezoneNote}
              </AppText>
            )}
            <PrayerTimesCard
              schedule={todaySchedule}
              highlightedName={nextPrayer?.current?.name}
              mosqueName={mosque?.name}
              mosqueNote={mosqueInLocation ? undefined : 'Moskeen er i en annen kommune'}
              jamatTimes={jamatTimes}
              jummah={
                mosqueInLocation && isoDateIsFriday(todayIso) ? (mosqueDetails.data?.jummah ?? []) : []
              }
              onPressMosque={() => {
                if (!mosque) return;
                if (mosqueInLocation) {
                  router.push({ pathname: '/mosque/[orgNr]', params: { orgNr: mosque.orgNr } });
                } else {
                  router.push('/mosque-picker');
                }
              }}
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
