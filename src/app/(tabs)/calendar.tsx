import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHijriMonth, useSpecialDates } from '@/api/queries';
import { MonthGrid } from '@/components/calendar/MonthGrid';
import { AppText, Card, EmptyState, ErrorState, Screen, SectionHeader, Skeleton } from '@/components/ui';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius, spacing } from '@/theme/tokens';
import { formatHijri, monthName } from '@/lib/hijri';
import { isoDateKey } from '@/lib/time';

export default function CalendarScreen() {
  const theme = useTheme();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), monthIndex: now.getMonth() };
  });

  const month = useHijriMonth(cursor.year, cursor.monthIndex + 1);
  const specials = useSpecialDates(cursor.year);

  const shiftMonth = (delta: number) => {
    setCursor((current) => {
      const shifted = new Date(current.year, current.monthIndex + delta, 1);
      return { year: shifted.getFullYear(), monthIndex: shifted.getMonth() };
    });
  };

  const hijriRange = useMemo(() => {
    if (!month.data || month.data.length === 0) return '';
    const first = month.data[0];
    const last = month.data[month.data.length - 1];
    if (first.hijri_month_text === last.hijri_month_text) return first.hijri_month_text;
    return `${first.hijri_month_text} – ${last.hijri_month_text}`;
  }, [month.data]);

  const upcomingEvents = useMemo(() => {
    if (!specials.data) return [];
    const today = isoDateKey();
    return specials.data.filter((event) => event.gregorian_date >= today).slice(0, 8);
  }, [specials.data]);

  return (
    <Screen scroll>
      <View
        style={{
          marginTop: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{ gap: spacing.xxs }}>
          <AppText size="xxl" weight="bold" heading>
            {monthName(cursor.monthIndex)} {cursor.year}
          </AppText>
          {hijriRange ? (
            <AppText size="sm" tone="textMuted">
              {hijriRange}
            </AppText>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <MonthArrow direction="back" onPress={() => shiftMonth(-1)} />
          <MonthArrow direction="forward" onPress={() => shiftMonth(1)} />
        </View>
      </View>

      <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
        {month.isLoading && <Skeleton height={320} rounded="xl" />}
        {month.isError && <ErrorState onRetry={month.refetch} />}
        {month.data && (
          <MonthGrid year={cursor.year} monthIndex={cursor.monthIndex} days={month.data} />
        )}

        <View>
          <SectionHeader title="Kommende merkedager" />
          {specials.isLoading && <Skeleton height={180} rounded="xl" />}
          {specials.isError && <ErrorState onRetry={specials.refetch} />}
          {specials.data && upcomingEvents.length === 0 && (
            <EmptyState message="Ingen flere merkedager i år" icon="calendar-clear-outline" />
          )}
          {upcomingEvents.length > 0 && (
            <Card padding="sm" rounded="xl">
              {upcomingEvents.map((event, index) => {
                const date = new Date(event.gregorian_date);
                return (
                  <View
                    key={event.gregorian_date + event.special_date_name}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.md,
                      borderBottomWidth: index === upcomingEvents.length - 1 ? 0 : 1,
                      borderBottomColor: theme.colors.border,
                    }}>
                    <View
                      style={{
                        width: 48,
                        borderRadius: radius.md,
                        backgroundColor: theme.colors.primarySoft,
                        paddingVertical: spacing.sm,
                        alignItems: 'center',
                      }}>
                      <AppText size="lg" weight="bold" tone="onPrimarySoft">
                        {date.getDate()}
                      </AppText>
                      <AppText size="xs" tone="onPrimarySoft">
                        {monthName(date.getMonth()).slice(0, 3)}
                      </AppText>
                    </View>
                    <View style={{ flex: 1, gap: spacing.xxs }}>
                      <AppText size="sm" weight="semibold" numberOfLines={2}>
                        {event.special_date_name}
                      </AppText>
                      <AppText size="xs" tone="textMuted">
                        {formatHijri(event.hijri_date, event.hijri_month_text)}
                      </AppText>
                    </View>
                  </View>
                );
              })}
            </Card>
          )}
        </View>
      </View>
    </Screen>
  );
}

function MonthArrow({ direction, onPress }: { direction: 'back' | 'forward'; onPress: () => void }) {
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
