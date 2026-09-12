import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useHijriMonth, useSpecialDates } from '@/api/queries';
import type { HijriDay } from '@/api/types';
import { MonthGrid } from '@/components/calendar/MonthGrid';
import { MonthNav } from '@/components/calendar/MonthNav';
import { EventCard } from '@/components/calendar/EventCard';
import { MonthPrayerTable } from '@/components/prayer/MonthPrayerTable';
import { SeasonCard } from '@/components/season/SeasonCard';
import {
  AppText,
  EmptyState,
  ErrorState,
  Screen,
  SectionHeader,
  SegmentedControl,
  Skeleton,
} from '@/components/ui';
import { useActiveDayKeys } from '@/hooks/useActiveDay';
import { useEffectiveAsrMethod } from '@/hooks/useEffectiveAsrMethod';
import { usePrayerMonth, zoneFor } from '@/hooks/usePrayerMonth';
import { useRefresh } from '@/hooks/useRefresh';
import { spacing } from '@/theme/tokens';
import { monthName } from '@/lib/hijri';
import { isoDateKey, parseDayKey } from '@/lib/time';
import { useActiveLocation } from '@/store/settings';

type MonthView = 'dates' | 'times';

const VIEW_OPTIONS: { value: MonthView; label: string }[] = [
  { value: 'dates', label: 'Måned' },
  { value: 'times', label: 'Bønnetider' },
];

export default function CalendarScreen() {
  const router = useRouter();
  const { refreshing, onRefresh } = useRefresh();

  const today = useMemo(() => new Date(), []);
  const { isoDate: todayIso, dayKey: todayDayKey } = useActiveDayKeys(today);
  const [view, setView] = useState<MonthView>('dates');
  const [cursor, setCursor] = useState(() => ({
    year: today.getFullYear(),
    monthIndex: today.getMonth(),
  }));

  const isCurrentMonth =
    cursor.year === today.getFullYear() && cursor.monthIndex === today.getMonth();

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

  const events = useMemo(() => {
    const monthPrefix = `${cursor.year}-${String(cursor.monthIndex + 1).padStart(2, '0')}`;
    return (specials.data ?? []).filter((event) => event.gregorian_date.startsWith(monthPrefix));
  }, [specials.data, cursor.year, cursor.monthIndex]);

  const specialDates = useMemo(
    () => new Set(events.map((event) => event.gregorian_date)),
    [events],
  );

  const openDay = (iso: string) => {
    router.push({ pathname: '/day/[date]', params: { date: iso } });
  };

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
      <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
        <MonthNav
          title={`${monthName(cursor.monthIndex)} ${cursor.year}`}
          subtitle={hijriRange || undefined}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
          onToday={
            isCurrentMonth
              ? undefined
              : () => setCursor({ year: today.getFullYear(), monthIndex: today.getMonth() })
          }
        />

        <SegmentedControl value={view} options={VIEW_OPTIONS} onChange={setView} />

        {view === 'dates' ? (
          <DatesView
            year={cursor.year}
            monthIndex={cursor.monthIndex}
            days={month.data}
            isLoading={month.isLoading}
            isError={month.isError}
            onRetry={month.refetch}
            todayIso={todayIso}
            isCurrentMonth={isCurrentMonth}
            events={events}
            eventsLoading={specials.isLoading}
            eventsError={specials.isError}
            onEventsRetry={specials.refetch}
            onDayPress={openDay}
          />
        ) : (
          <TimesView
            year={cursor.year}
            monthIndex={cursor.monthIndex}
            specialDates={specialDates}
            todayDayKey={todayDayKey}
            onDayPress={openDay}
          />
        )}
      </View>
    </Screen>
  );
}

type DatesViewProps = {
  year: number;
  monthIndex: number;
  days: HijriDay[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  todayIso: string;
  isCurrentMonth: boolean;
  events: HijriDay[];
  eventsLoading: boolean;
  eventsError: boolean;
  onEventsRetry: () => void;
  onDayPress: (iso: string) => void;
};

function DatesView({
  year,
  monthIndex,
  days,
  isLoading,
  isError,
  onRetry,
  todayIso,
  isCurrentMonth,
  events,
  eventsLoading,
  eventsError,
  onEventsRetry,
  onDayPress,
}: DatesViewProps) {
  return (
    <View style={{ gap: spacing.lg }}>
      {isCurrentMonth && <SeasonCard />}

      {isLoading && <Skeleton height={360} rounded="xl" />}
      {isError && <ErrorState onRetry={onRetry} />}
      {days && (
        <MonthGrid
          year={year}
          monthIndex={monthIndex}
          days={days}
          todayIso={todayIso}
          onDayPress={(iso) => onDayPress(iso)}
        />
      )}

      <View>
        <SectionHeader
          title={`Merkedager i ${monthName(monthIndex).toLowerCase()}`}
          style={{ marginTop: 0 }}
        />
        {eventsLoading && <Skeleton height={180} rounded="xl" />}
        {eventsError && <ErrorState onRetry={onEventsRetry} />}
        {!eventsLoading && !eventsError && events.length === 0 && (
          <EmptyState message="Ingen merkedager denne måneden" icon="calendar-clear-outline" />
        )}
        <View style={{ gap: spacing.md }}>
          {events.map((event) => (
            <EventCard
              key={event.gregorian_date + event.special_date_name}
              event={event}
              onPress={() => onDayPress(event.gregorian_date)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

type TimesViewProps = {
  year: number;
  monthIndex: number;
  specialDates: ReadonlySet<string>;
  todayDayKey: string;
  onDayPress: (iso: string) => void;
};

function TimesView({ year, monthIndex, specialDates, todayDayKey, onDayPress }: TimesViewProps) {
  const location = useActiveLocation();
  const asrMethod = useEffectiveAsrMethod();
  const month = usePrayerMonth(location, year, monthIndex + 1);
  const zone = zoneFor(location);

  return (
    <View style={{ gap: spacing.md }}>
      <AppText size="sm" tone="textMuted">
        {location.mode === 'calculated' ? `${location.name} · lokale tider` : location.name}
      </AppText>

      {month.isLoading && <Skeleton height={480} rounded="xl" />}
      {month.isError && <ErrorState onRetry={month.refetch} />}
      {month.data && (
        <MonthPrayerTable
          days={month.data}
          asrMethod={asrMethod}
          zone={zone}
          todayDayKey={todayDayKey}
          specialDates={specialDates}
          onDayPress={(day) => onDayPress(isoDateKey(parseDayKey(day.date)))}
        />
      )}
    </View>
  );
}
