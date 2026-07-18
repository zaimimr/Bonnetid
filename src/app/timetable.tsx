import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePrayerTimes } from '@/api/queries';
import { MonthPrayerTable } from '@/components/prayer/MonthPrayerTable';
import { AppText, ErrorState, Screen, Skeleton } from '@/components/ui';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius, spacing } from '@/theme/tokens';
import { monthName } from '@/lib/hijri';
import { isoDateKey, parseDayKey } from '@/lib/time';
import { useActiveLocation, useSettings } from '@/store/settings';

export default function TimetableScreen() {
  const router = useRouter();
  const theme = useTheme();
  const location = useActiveLocation();
  const asrMethod = useSettings((state) => state.asrMethod);

  const today = new Date();
  const [cursor, setCursor] = useState(() => ({
    year: today.getFullYear(),
    monthIndex: today.getMonth(),
  }));

  const month = usePrayerTimes(location.iso, cursor.year, cursor.monthIndex + 1);
  const isCurrentMonth =
    cursor.year === today.getFullYear() && cursor.monthIndex === today.getMonth();

  const shiftMonth = (delta: number) => {
    setCursor((current) => {
      const shifted = new Date(current.year, current.monthIndex + delta, 1);
      return { year: shifted.getFullYear(), monthIndex: shifted.getMonth() };
    });
  };

  return (
    <Screen scroll edges={[]}>
      <View
        style={{
          marginTop: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{ gap: spacing.xxs }}>
          <AppText size="lg" weight="bold" heading>
            {monthName(cursor.monthIndex)} {cursor.year}
          </AppText>
          <AppText size="sm" tone="textMuted">
            {location.name}
          </AppText>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          {!isCurrentMonth && (
            <Pressable
              onPress={() =>
                setCursor({ year: today.getFullYear(), monthIndex: today.getMonth() })
              }
              hitSlop={hitSlop}
              style={({ pressed }) => [
                {
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.full,
                  backgroundColor: theme.colors.primarySoft,
                },
                pressed && { opacity: opacity.pressed },
              ]}>
              <AppText size="sm" weight="semibold" tone="onPrimarySoft">
                I dag
              </AppText>
            </Pressable>
          )}
          <Arrow direction="back" onPress={() => shiftMonth(-1)} />
          <Arrow direction="forward" onPress={() => shiftMonth(1)} />
        </View>
      </View>

      <View style={{ marginTop: spacing.lg }}>
        {month.isLoading && <Skeleton height={480} rounded="xl" />}
        {month.isError && <ErrorState onRetry={month.refetch} />}
        {month.data && (
          <MonthPrayerTable
            days={month.data}
            asrMethod={asrMethod}
            onDayPress={(day) =>
              router.push({
                pathname: '/day/[date]',
                params: { date: isoDateKey(parseDayKey(day.date)) },
              })
            }
          />
        )}
      </View>
    </Screen>
  );
}

function Arrow({ direction, onPress }: { direction: 'back' | 'forward'; onPress: () => void }) {
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
