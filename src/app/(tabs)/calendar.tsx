import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHijriMonth, useSpecialDates } from '@/api/queries';
import type { HijriDay } from '@/api/types';
import { MonthGrid } from '@/components/calendar/MonthGrid';
import { AppText, Card, EmptyState, ErrorState, SectionHeader, Skeleton } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius, spacing } from '@/theme/tokens';
import { formatHijri, monthName } from '@/lib/hijri';

export default function CalendarScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const eventCardRefs = useRef(new Map<string, View | null>());

  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => ({
    year: today.getFullYear(),
    monthIndex: today.getMonth(),
  }));
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  const isCurrentMonth =
    cursor.year === today.getFullYear() && cursor.monthIndex === today.getMonth();

  const month = useHijriMonth(cursor.year, cursor.monthIndex + 1);
  const specials = useSpecialDates(cursor.year);

  const shiftMonth = (delta: number) => {
    setSelectedIso(null);
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

  const events = useMemo(() => {
    const monthPrefix = `${cursor.year}-${String(cursor.monthIndex + 1).padStart(2, '0')}`;
    return (specials.data ?? []).filter((event) => event.gregorian_date.startsWith(monthPrefix));
  }, [specials.data, cursor.year, cursor.monthIndex]);

  const jumpToEvent = (event: HijriDay) => {
    const date = new Date(event.gregorian_date);
    setCursor({ year: date.getFullYear(), monthIndex: date.getMonth() });
    setSelectedIso(event.gregorian_date);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const onDayPress = (iso: string, day: HijriDay | undefined) => {
    if (!day?.special_date_name) {
      setSelectedIso(null);
      return;
    }
    setSelectedIso(iso);
    const card = eventCardRefs.current.get(iso);
    const scrollNode = scrollRef.current?.getInnerViewNode();
    if (card && scrollNode) {
      card.measureLayout(scrollNode, (_x, y) => {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - spacing.xxl), animated: true });
      });
    }
  };

  const eventsLoading = specials.isLoading;

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxxl,
      }}
      showsVerticalScrollIndicator={false}>
      <View
        style={{
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

        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          {!isCurrentMonth && (
            <Pressable
              onPress={() => {
                setSelectedIso(null);
                setCursor({ year: today.getFullYear(), monthIndex: today.getMonth() });
              }}
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
          <MonthArrow direction="back" onPress={() => shiftMonth(-1)} />
          <MonthArrow direction="forward" onPress={() => shiftMonth(1)} />
        </View>
      </View>

      <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
        {month.isLoading && <Skeleton height={320} rounded="xl" />}
        {month.isError && <ErrorState onRetry={month.refetch} />}
        {month.data && (
          <MonthGrid
            year={cursor.year}
            monthIndex={cursor.monthIndex}
            days={month.data}
            selectedIso={selectedIso}
            onDayPress={onDayPress}
          />
        )}

        <View>
          <SectionHeader
            title={`Merkedager i ${monthName(cursor.monthIndex).toLowerCase()}`}
          />
          {eventsLoading && <Skeleton height={180} rounded="xl" />}
          {specials.isError && <ErrorState onRetry={specials.refetch} />}
          {!eventsLoading && events.length === 0 && (
            <EmptyState message="Ingen merkedager denne måneden" icon="calendar-clear-outline" />
          )}
          <View style={{ gap: spacing.md }}>
            {events.map((event) => {
              const isSelected = event.gregorian_date === selectedIso;
              const date = new Date(event.gregorian_date);
              return (
                <View
                  key={event.gregorian_date + event.special_date_name}
                  ref={(node) => {
                    eventCardRefs.current.set(event.gregorian_date, node);
                  }}>
                  <Card
                    rounded="xl"
                    onPress={() => jumpToEvent(event)}
                    style={
                      isSelected
                        ? {
                            borderColor: theme.colors.accent,
                            borderWidth: 2,
                            backgroundColor: theme.colors.primarySoft,
                          }
                        : undefined
                    }>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                      <View
                        style={{
                          width: 48,
                          borderRadius: radius.md,
                          backgroundColor: isSelected
                            ? theme.colors.surface
                            : theme.colors.primarySoft,
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
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={isSelected ? theme.colors.accent : theme.colors.textMuted}
                      />
                    </View>
                  </Card>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
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
