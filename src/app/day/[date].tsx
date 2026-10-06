import { useMemo } from 'react';
import { Platform, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useHijriMonth, useMosque, useMosqueJamatPeriods } from '@/api/queries';
import { ExtraTimesCard } from '@/components/prayer/ExtraTimesCard';
import { PrayerTimesCard } from '@/components/prayer/PrayerTimesCard';
import {
  AppText,
  EmptyState,
  ErrorState,
  IconButton,
  NoTimesState,
  Screen,
  Skeleton,
} from '@/components/ui';
import { spacing } from '@/theme/tokens';
import {
  adhanTimesFromSchedule,
  buildDaySchedule,
  findJamatPeriod,
  jamatTimesForDate,
  nextPrayerDay,
} from '@/lib/prayerSchedule';
import { buildExtraTimes } from '@/lib/extraTimes';
import { formatGregorianLong, formatHijri, monthYearLabel } from '@/lib/hijri';
import { isoDateKey, todayKey } from '@/lib/time';
import { useEffectiveAsrMethod } from '@/hooks/useEffectiveAsrMethod';
import { useNow } from '@/hooks/useNow';
import { usePickedLocation } from '@/hooks/usePickedLocation';
import { usePrayerMonth, zoneFor } from '@/hooks/usePrayerMonth';
import { useRefresh } from '@/hooks/useRefresh';
import { useTimezoneNote } from '@/hooks/useTimezoneNote';
import { useActiveLocation, useActiveMosque } from '@/store/settings';
import { PostHogMaskView } from 'posthog-react-native';
import { isRTL, t } from '@/lib/i18n';

const FRIDAY = 5;
const HEADER_HEIGHT = 44;

export default function DayScreen() {
  const { date: isoDate, place } = useLocalSearchParams<{ date: string; place?: string }>();
  const router = useRouter();
  const activeLocation = useActiveLocation();
  const picked = usePickedLocation(place);
  const location = picked ?? activeLocation;
  const otherPlace = picked != null && picked.iso !== activeLocation.iso;
  const asrMethod = useEffectiveAsrMethod();
  const zone = zoneFor(location);
  const calculated = location.mode === 'calculated';
  const activeMosque = useActiveMosque();
  const mosque = otherPlace ? null : activeMosque;
  const { refreshing, onRefresh } = useRefresh();
  const now = useNow(30_000);

  const date = useMemo(() => new Date(`${isoDate}T12:00:00`), [isoDate]);
  const valid = !Number.isNaN(date.getTime());
  const timezoneNote = useTimezoneNote(date, location);

  const month = usePrayerMonth(location, date.getFullYear(), date.getMonth() + 1);
  const hijriMonth = useHijriMonth(date.getFullYear(), date.getMonth() + 1);
  const mosqueDetails = useMosque(mosque?.orgNr ?? '', { enabled: mosque != null });
  const jamatPeriods = useMosqueJamatPeriods(mosque?.orgNr ?? '', { enabled: mosque != null });

  const day = month.data?.find((row) => row.date === todayKey(date));
  const hijriDay = hijriMonth.data?.find((row) => row.gregorian_date === isoDate);

  const schedule = useMemo(
    () =>
      day && month.data
        ? buildDaySchedule(day, date, asrMethod, zone, nextPrayerDay(month.data, day))
        : [],
    [day, month.data, date, asrMethod, zone],
  );

  const extraTimes = useMemo(
    () =>
      day && month.data ? buildExtraTimes(day, date, zone, nextPrayerDay(month.data, day)) : [],
    [day, month.data, date, zone],
  );

  const isFriday = date.getDay() === FRIDAY;
  const mosqueIso = mosqueDetails.data?.location_iso;
  const mosqueInLocation = mosqueIso == null || mosqueIso === location.iso;
  const jamatPeriod =
    findJamatPeriod(jamatPeriods.data, isoDate ?? '') ?? mosqueDetails.data?.jamat;
  const jummahTimes =
    jamatPeriod && 'jummah' in jamatPeriod && jamatPeriod.jummah && jamatPeriod.jummah.length > 0
      ? jamatPeriod.jummah
      : (mosqueDetails.data?.jummah ?? []);
  // Only today's card drops back to Dhuhr; a past Friday should keep showing its Jumuah.
  const jamatTimes = jamatTimesForDate(
    mosqueInLocation ? jamatPeriod : null,
    isoDate ?? '',
    mosqueInLocation ? adhanTimesFromSchedule(schedule) : {},
    jummahTimes,
    isoDate === isoDateKey(now) ? now : null,
  );

  const goToDay = (delta: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    router.setParams({ date: isoDateKey(next) });
  };

  if (!valid) {
    return (
      <Screen edges={[]}>
        <EmptyState message={t('calendar.invalidDate')} icon="calendar-clear-outline" />
      </Screen>
    );
  }

  return (
    <Screen scroll edges={[]} refreshing={refreshing} onRefresh={onRefresh}>
      <Stack.Screen
        options={{
          title: location.name,
          headerTitle: () => (
            <PostHogMaskView>
              <AppText weight="semibold" style={{ fontSize: Platform.OS === 'ios' ? 17 : 20 }}>
                {location.name}
              </AppText>
            </PostHogMaskView>
          ),
        }}
      />

      <View
        style={{
          marginTop: spacing.lg,
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: spacing.md,
        }}>
        <IconButton
          name={isRTL() ? 'chevron-forward' : 'chevron-back'}
          accessibilityLabel={t('calendar.previousDay')}
          onPress={() => goToDay(-1)}
        />
        <View
          style={{
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: 0,
            minWidth: 0,
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.xxs,
            minHeight: HEADER_HEIGHT,
          }}>
          <AppText
            weight="bold"
            align="center"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}>
            {formatGregorianLong(date)}
          </AppText>
          <AppText size="sm" tone="textMuted" align="center" numberOfLines={1}>
            {hijriDay ? formatHijri(hijriDay.hijri_date, hijriDay.hijri_month_text) : ' '}
          </AppText>
          {hijriDay?.special_date_name && (
            <AppText size="xs" weight="medium" tone="primary" align="center">
              {hijriDay.special_date_name}
            </AppText>
          )}
        </View>
        <IconButton
          name={isRTL() ? 'chevron-back' : 'chevron-forward'}
          accessibilityLabel={t('calendar.nextDay')}
          onPress={() => goToDay(1)}
        />
      </View>

      {timezoneNote && (
        <AppText size="xs" tone="textMuted" align="center" style={{ marginTop: spacing.md }}>
          {timezoneNote}
        </AppText>
      )}

      <View style={{ marginTop: spacing.lg }}>
        {month.isLoading && <Skeleton height={360} rounded="xl" />}
        {month.isError && <ErrorState onRetry={month.refetch} />}
        {!month.isLoading && !month.isError && !day && (
          <NoTimesState period={monthYearLabel(date)} onRetry={month.refetch} />
        )}
        {schedule.length > 0 && (
          <PrayerTimesCard
            schedule={schedule}
            mosqueName={mosque?.name}
            mosqueNote={
              mosqueInLocation
                ? undefined
                : t('calendar.theMosqueIsIn', { name: mosque?.name ?? t('common.theMosque') })
            }
            jamatTimes={jamatTimes}
            jummah={isFriday ? jummahTimes : []}
            statusDate={isoDate}
            now={now}
            onPressMosque={() =>
              mosque &&
              router.push({ pathname: '/mosque/[orgNr]', params: { orgNr: mosque.orgNr } })
            }
            onSelectMosque={
              calculated || otherPlace ? undefined : () => router.push('/mosque-picker')
            }
          />
        )}
      </View>

      {extraTimes.length > 0 && (
        <View style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}>
          <ExtraTimesCard times={extraTimes} />
        </View>
      )}
    </Screen>
  );
}
