import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHijriMonth, useMosque, useMosqueJamatPeriods, usePrayerTimes } from '@/api/queries';
import { PrayerTimesCard } from '@/components/prayer/PrayerTimesCard';
import { AppText, EmptyState, ErrorState, Screen, Skeleton } from '@/components/ui';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius, spacing } from '@/theme/tokens';
import {
  adhanTimesFromSchedule,
  buildDaySchedule,
  findJamatPeriod,
  jamatTimesForDate,
} from '@/lib/prayerSchedule';
import { formatGregorianLong, formatHijri } from '@/lib/hijri';
import { isoDateKey, todayKey } from '@/lib/time';
import { useEffectiveAsrMethod } from '@/hooks/useEffectiveAsrMethod';
import { useRefresh } from '@/hooks/useRefresh';
import { useActiveLocation, useSettings } from '@/store/settings';

const FRIDAY = 5;

export default function DayScreen() {
  const { date: isoDate } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const location = useActiveLocation();
  const asrMethod = useEffectiveAsrMethod();
  const mosque = useSettings((state) => state.mosque);
  const { refreshing, onRefresh } = useRefresh();

  const date = useMemo(() => new Date(`${isoDate}T12:00:00`), [isoDate]);
  const valid = !Number.isNaN(date.getTime());

  const month = usePrayerTimes(location.iso, date.getFullYear(), date.getMonth() + 1);
  const hijriMonth = useHijriMonth(date.getFullYear(), date.getMonth() + 1);
  const mosqueDetails = useMosque(mosque?.orgNr ?? '', { enabled: mosque != null });
  const jamatPeriods = useMosqueJamatPeriods(mosque?.orgNr ?? '', { enabled: mosque != null });

  const day = month.data?.find((row) => row.date === todayKey(date));
  const hijriDay = hijriMonth.data?.find((row) => row.gregorian_date === isoDate);

  const schedule = useMemo(
    () => (day ? buildDaySchedule(day, date, asrMethod) : []),
    [day, date, asrMethod],
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
  const jamatTimes = mosqueInLocation
    ? jamatTimesForDate(jamatPeriod, isoDate ?? '', adhanTimesFromSchedule(schedule), jummahTimes)
    : {};

  const goToDay = (delta: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    router.setParams({ date: isoDateKey(next) });
  };

  if (!valid) {
    return (
      <Screen edges={[]}>
        <EmptyState message="Ugyldig dato" icon="calendar-clear-outline" />
      </Screen>
    );
  }

  return (
    <Screen scroll edges={[]} refreshing={refreshing} onRefresh={onRefresh}>
      <Stack.Screen options={{ title: location.name }} />

      <View
        style={{
          marginTop: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
        }}>
        <DayArrow direction="back" onPress={() => goToDay(-1)} />
        <View style={{ flex: 1, alignItems: 'center', gap: spacing.xxs }}>
          <AppText weight="bold" align="center">
            {formatGregorianLong(date)}
          </AppText>
          {hijriDay && (
            <AppText size="sm" tone="textMuted" align="center">
              {formatHijri(hijriDay.hijri_date, hijriDay.hijri_month_text)}
            </AppText>
          )}
          {hijriDay?.special_date_name && (
            <AppText size="xs" weight="medium" tone="primary" align="center">
              {hijriDay.special_date_name}
            </AppText>
          )}
        </View>
        <DayArrow direction="forward" onPress={() => goToDay(1)} />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        {month.isLoading && <Skeleton height={360} rounded="xl" />}
        {month.isError && <ErrorState onRetry={month.refetch} />}
        {!month.isLoading && !month.isError && !day && (
          <EmptyState message="Ingen bønnetider for denne datoen" icon="calendar-clear-outline" />
        )}
        {schedule.length > 0 && (
          <PrayerTimesCard
            schedule={schedule}
            mosqueName={mosque?.name}
            mosqueNote={mosqueInLocation ? undefined : 'Moskeen er i en annen kommune'}
            jamatTimes={jamatTimes}
            jummah={mosqueInLocation && isFriday ? jummahTimes : []}
            onPressMosque={() =>
              mosque &&
              router.push({ pathname: '/mosque/[orgNr]', params: { orgNr: mosque.orgNr } })
            }
            onSelectMosque={() => router.push('/mosque-picker')}
          />
        )}
      </View>
    </Screen>
  );
}

function DayArrow({ direction, onPress }: { direction: 'back' | 'forward'; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        {
          width: 40,
          height: 40,
          borderRadius: radius.full,
          backgroundColor: theme.colors.surfaceSunken,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed && { opacity: opacity.pressed },
      ]}>
      <Ionicons
        name={direction === 'back' ? 'chevron-back' : 'chevron-forward'}
        size={20}
        color={theme.colors.textPrimary}
      />
    </Pressable>
  );
}
