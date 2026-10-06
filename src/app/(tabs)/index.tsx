import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useHijriMonth, useMosque, useSpecialDates } from '@/api/queries';
import { AfterPrayerCard } from '@/components/duas/AfterPrayerCard';
import { NextPrayerHero } from '@/components/prayer/NextPrayerHero';
import { PrayerTimesCard } from '@/components/prayer/PrayerTimesCard';
import { EventCard } from '@/components/calendar/EventCard';
import { MosqueAnnouncement } from '@/components/mosque/MosqueAnnouncement';
import { MosquePresenceCard } from '@/components/mosque/MosquePresenceCard';
import { EidNearbyCard } from '@/components/eid/EidNearbyCard';
import { NotificationCheckCard } from '@/components/notifications/NotificationCheckCard';
import { EidLeaveCard } from '@/components/season/EidLeaveCard';
import { SeasonCard } from '@/components/season/SeasonCard';
import { NightCard } from '@/components/season/NightCard';
import {
  AppText,
  Badge,
  Card,
  ErrorState,
  NoTimesState,
  Screen,
  SectionHeader,
  Skeleton,
} from '@/components/ui';
import { useActiveDayKeys } from '@/hooks/useActiveDay';
import { useEidMode } from '@/hooks/useEidMode';
import { useEidPrayers } from '@/hooks/useEidPrayers';
import { useMosquePresence } from '@/hooks/useMosquePresence';
import { useNow } from '@/hooks/useNow';
import { useTimezoneNote } from '@/hooks/useTimezoneNote';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import { useRefresh } from '@/hooks/useRefresh';
import { useReviewPrompt } from '@/hooks/useReviewPrompt';
import { formatGregorianLong, formatHijri, monthYearLabel } from '@/lib/hijri';
import { adhanTimesFromSchedule, jamatTimesForDate } from '@/lib/prayerSchedule';
import { track } from '@/lib/telemetry';
import { isoDateIsFriday, parseDayKey } from '@/lib/time';
import { spacing } from '@/theme/tokens';
import { useActiveLocation, useActiveMosque, useUnreadAnnouncement } from '@/store/settings';
import { PostHogMaskView } from 'posthog-react-native';
import { t } from '@/lib/i18n';

const UPCOMING_EVENT_COUNT = 3;

export default function HomeScreen() {
  const router = useRouter();
  useReviewPrompt();
  const now = useNow();
  const location = useActiveLocation();
  const calculated = location.mode === 'calculated';
  const mosque = useActiveMosque();
  const { todaySchedule, nextPrayer, isLoading, isError, refetch } = usePrayerDay(now);
  const { refreshing, onRefresh } = useRefresh();
  const timezoneNote = useTimezoneNote(now);
  const { dayKey, isoDate: todayIso } = useActiveDayKeys(now);
  const today = useMemo(() => parseDayKey(dayKey), [dayKey]);

  const hijriMonth = useHijriMonth(today.getFullYear(), today.getMonth() + 1);
  const mosqueDetails = useMosque(mosque?.orgNr ?? '', { enabled: mosque != null });
  const presence = useMosquePresence();
  const specialsThisYear = useSpecialDates(today.getFullYear());
  const specialsNextYear = useSpecialDates(today.getFullYear() + 1);

  const todayHijri = hijriMonth.data?.find((day) => day.gregorian_date === todayIso);
  const hijriText = todayHijri
    ? formatHijri(todayHijri.hijri_date, todayHijri.hijri_month_text)
    : '';

  const mosqueIso = mosqueDetails.data?.location_iso;
  const mosqueInLocation = mosqueIso == null || mosqueIso === location.iso;
  const jummahTimes = mosqueDetails.data?.jummah ?? [];
  const unreadAnnouncement = useUnreadAnnouncement(
    mosque?.orgNr,
    mosqueDetails.data?.announcement,
  );
  const myAnnouncement = presence?.mosque.org_nr !== mosque?.orgNr ? unreadAnnouncement : null;
  const eidMode = useEidMode();
  const eidKey = eidMode ? `${eidMode.eid}:${eidMode.phase}` : null;
  useEffect(() => {
    if (!eidKey) return;
    const [eid, phase] = eidKey.split(':');
    track('eid_mode_viewed', { eid, phase });
  }, [eidKey]);
  const eidPrayers = useEidPrayers(
    calculated ? null : eidMode,
    mosqueDetails.data ?? null,
    now,
  );
  const jamatTimes = jamatTimesForDate(
    mosqueInLocation ? mosqueDetails.data?.jamat : null,
    todayIso,
    mosqueInLocation ? adhanTimesFromSchedule(todaySchedule) : {},
    jummahTimes,
    now,
  );

  const upcomingEvents = useMemo(() => {
    const all = [...(specialsThisYear.data ?? []), ...(specialsNextYear.data ?? [])];
    return all
      .filter((event) => event.gregorian_date >= todayIso)
      .slice(0, UPCOMING_EVENT_COUNT);
  }, [specialsThisYear.data, specialsNextYear.data, todayIso]);

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
      <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
        <MosquePresenceCard />

        <NotificationCheckCard />

        {isLoading && <Skeleton height={220} rounded="xl" />}

        {isError && <ErrorState onRetry={refetch} />}

        {!isLoading && !isError && todaySchedule.length === 0 && (
          <NoTimesState period={monthYearLabel(today)} onRetry={refetch} />
        )}

        {(nextPrayer || eidPrayers.hero) && (
          <NextPrayerHero
            nextPrayer={nextPrayer}
            eidPrayer={eidPrayers.hero}
            now={now}
            hijriText={hijriText}
            gregorianText={formatGregorianLong(today)}
            onPressDate={() =>
              router.push({ pathname: '/day/[date]', params: { date: todayIso } })
            }
          />
        )}

        <AfterPrayerCard now={now} />

        {mosque && myAnnouncement && (
          <Card
            rounded="xl"
            padding="md"
            onPress={() =>
              router.push({ pathname: '/mosque/[orgNr]', params: { orgNr: mosque.orgNr } })
            }>
            <MosqueAnnouncement
              title={t('home.announcementFrom', { name: mosque.name })}
              text={myAnnouncement}
              compact
              chevron
            />
          </Card>
        )}

        <EidNearbyCard mosques={eidPrayers.nearby} />

        <EidLeaveCard now={now} />

        <SeasonCard />

        <NightCard
          now={now}
          onPress={(isoDate) =>
            router.push({ pathname: '/day/[date]', params: { date: isoDate } })
          }
        />

        {todaySchedule.length > 0 && (
          <View>
            <PostHogMaskView>
              <SectionHeader
                title={t('home.todaySPrayerTimes')}
                subtitle={
                  mosque && mosqueInLocation ? `${location.name} · ${mosque.name}` : location.name
                }
                trailing={calculated ? <Badge label={t('home.localTimes')} variant="neutral" /> : undefined}
                style={timezoneNote ? { marginBottom: spacing.xs } : undefined}
              />
            </PostHogMaskView>
            {timezoneNote && (
              <AppText size="xs" tone="textMuted" style={{ marginBottom: spacing.md }}>
                {timezoneNote}
              </AppText>
            )}
            <PrayerTimesCard
              schedule={todaySchedule}
              highlightedName={
                nextPrayer?.current && todaySchedule.includes(nextPrayer.current)
                  ? nextPrayer.current.name
                  : undefined
              }
              mosqueName={mosque?.name}
              mosqueNote={
                mosqueInLocation
                  ? undefined
                  : t('home.theMosqueIsIn', { value: mosque?.name ?? 'moskeen', value2: mosque?.name ?? 'the mosque', value3: mosque?.name ?? 'المسجد', value4: mosque?.name ?? 'مسجد' })
              }
              jamatTimes={jamatTimes}
              jummah={isoDateIsFriday(todayIso) ? jummahTimes : []}
              onPressMosque={() => {
                if (!mosque) return;
                if (mosqueInLocation) {
                  router.push({ pathname: '/mosque/[orgNr]', params: { orgNr: mosque.orgNr } });
                } else {
                  router.push('/mosque-picker');
                }
              }}
              onSelectMosque={calculated ? undefined : () => router.push('/mosque-picker')}
              statusDate={todayIso}
              now={now}
            />
          </View>
        )}

        {upcomingEvents.length > 0 && (
          <View>
            <SectionHeader title={t('home.upcomingSpecialDays')} />
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
