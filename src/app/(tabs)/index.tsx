import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useHijriMonth } from '@/api/queries';
import { NextPrayerHero } from '@/components/prayer/NextPrayerHero';
import { PrayerList } from '@/components/prayer/PrayerList';
import { MyMosqueCard } from '@/components/mosque/MyMosqueCard';
import { ErrorState, Screen, SectionHeader, Skeleton } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import { formatGregorianLong, formatHijri } from '@/lib/hijri';
import { isoDateKey } from '@/lib/time';
import { spacing } from '@/theme/tokens';
import { useActiveLocation, useSettings } from '@/store/settings';

export default function HomeScreen() {
  const router = useRouter();
  const now = useNow();
  const location = useActiveLocation();
  const mosque = useSettings((state) => state.mosque);
  const { todaySchedule, nextPrayer, isLoading, isError, refetch } = usePrayerDay(now);
  const hijriMonth = useHijriMonth(now.getFullYear(), now.getMonth() + 1);

  const todayHijri = hijriMonth.data?.find((day) => day.gregorian_date === isoDateKey(now));
  const hijriText = todayHijri
    ? formatHijri(todayHijri.hijri_date, todayHijri.hijri_month_text)
    : '';

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

        <MyMosqueCard
          mosque={mosque}
          onSelectMosque={() => router.push('/mosque-picker')}
          onOpenMosque={(orgNr) => router.push({ pathname: '/mosque/[orgNr]', params: { orgNr } })}
        />

        {todaySchedule.length > 0 && (
          <View>
            <SectionHeader title="Dagens bønnetider" subtitle={location.name} />
            <PrayerList
              schedule={todaySchedule}
              highlightedName={
                nextPrayer && !nextPrayer.isTomorrow ? nextPrayer.next.name : undefined
              }
            />
          </View>
        )}
      </View>
    </Screen>
  );
}
