import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useHijriMonth, useHijriMonthDays, useSpecialDates } from '@/api/queries';
import type { HijriDay } from '@/api/types';
import { MonthGrid } from '@/components/calendar/MonthGrid';
import { MonthNav } from '@/components/calendar/MonthNav';
import { EventCard } from '@/components/calendar/EventCard';
import { PlaceFilterButton } from '@/components/mosque/MosqueListControls';
import { MonthPrayerTable } from '@/components/prayer/MonthPrayerTable';
import { SeasonCard } from '@/components/season/SeasonCard';
import {
  AppText,
  EmptyState,
  ErrorState,
  NoTimesState,
  Screen,
  SectionHeader,
  SegmentedControl,
  Skeleton,
} from '@/components/ui';
import { useActiveDayKeys } from '@/hooks/useActiveDay';
import { useNow } from '@/hooks/useNow';
import { usePickedLocation } from '@/hooks/usePickedLocation';
import { usePlaces } from '@/hooks/usePlaces';
import { useEffectiveAsrMethod } from '@/hooks/useEffectiveAsrMethod';
import { usePrayerMonth, zoneFor } from '@/hooks/usePrayerMonth';
import { useRefresh } from '@/hooks/useRefresh';
import { useTimezoneNote } from '@/hooks/useTimezoneNote';
import { spacing } from '@/theme/tokens';
import {
  monthName,
  monthYearLabel,
  parseHijriDate,
  shiftHijriMonth,
  type HijriMonthCursor,
} from '@/lib/hijri';
import { HIJRI_META } from '@/lib/hijriMeta';
import { track } from '@/lib/telemetry';
import { isoDateKey, parseDayKey } from '@/lib/time';
import { usePlaceFilter } from '@/store/placeFilter';
import { useActiveLocation, useSettings, type CalendarPrimary } from '@/store/settings';
import { language, t } from '@/lib/i18n';

type MonthView = 'dates' | 'times';

const VIEW_OPTIONS: { value: MonthView; label: string }[] = [
  { value: 'dates', label: t('calendar.month') },
  { value: 'times', label: t('calendar.prayerTimes') },
];

function gregorianLabel(iso: string): { month: string; year: number } {
  const [year, month] = iso.split('-').map(Number);
  return { month: monthName(month - 1), year };
}

function gregorianRange(days: HijriDay[] | undefined): string {
  if (!days || days.length === 0) return '';
  const first = gregorianLabel(days[0].gregorian_date);
  const last = gregorianLabel(days[days.length - 1].gregorian_date);
  if (first.month === last.month && first.year === last.year) return `${first.month} ${first.year}`;
  if (first.year === last.year) return `${first.month} – ${last.month} ${last.year}`;
  return `${first.month} ${first.year} – ${last.month} ${last.year}`;
}

function hijriCursorOf(day: HijriDay | undefined): HijriMonthCursor | null {
  const parsed = day ? parseHijriDate(day.hijri_date) : null;
  return parsed ? { year: parsed.year, month: parsed.month } : null;
}

function sameHijriMonth(a: HijriMonthCursor | null, b: HijriMonthCursor | null): boolean {
  return a != null && b != null && a.year === b.year && a.month === b.month;
}

export default function CalendarScreen() {
  const router = useRouter();
  const { refreshing, onRefresh } = useRefresh();

  // The tab stays mounted for days, so a frozen date would keep marking yesterday.
  const today = useNow(60_000);
  const { isoDate: todayIso, dayKey: todayDayKey } = useActiveDayKeys(today);
  const [view, setView] = useState<MonthView>('dates');
  const calendar = useSettings((state) => state.calendarPrimary);
  const setCalendar = useSettings((state) => state.setCalendarPrimary);
  const isHijri = calendar === 'hijri';
  const [cursor, setCursor] = useState(() => ({
    year: today.getFullYear(),
    monthIndex: today.getMonth(),
  }));
  const [hijriCursor, setHijriCursor] = useState<HijriMonthCursor | null>(null);

  const todayMonth = useHijriMonth(today.getFullYear(), today.getMonth() + 1);
  const todayHijri = hijriCursorOf(todayMonth.data?.find((day) => day.gregorian_date === todayIso));
  const shownHijri = hijriCursor ?? todayHijri;

  const month = useHijriMonth(cursor.year, cursor.monthIndex + 1);
  const hijriMonth = useHijriMonthDays(shownHijri ?? { year: 1, month: 1 }, {
    enabled: isHijri && shownHijri != null,
  });
  const specials = useSpecialDates(cursor.year);

  const isCurrentMonth = isHijri
    ? sameHijriMonth(shownHijri, todayHijri)
    : cursor.year === today.getFullYear() && cursor.monthIndex === today.getMonth();

  const shiftMonth = (delta: number) => {
    if (isHijri) {
      if (shownHijri) setHijriCursor(shiftHijriMonth(shownHijri, delta));
      return;
    }
    setCursor((current) => {
      const shifted = new Date(current.year, current.monthIndex + delta, 1);
      return { year: shifted.getFullYear(), monthIndex: shifted.getMonth() };
    });
  };

  const goToToday = () => {
    if (isHijri) setHijriCursor(null);
    else setCursor({ year: today.getFullYear(), monthIndex: today.getMonth() });
  };

  const swapCalendar = () => {
    if (isHijri) {
      const middle = hijriMonth.data?.[Math.floor((hijriMonth.data.length - 1) / 2)];
      if (middle && !isCurrentMonth) {
        const [year, monthNumber] = middle.gregorian_date.split('-').map(Number);
        setCursor({ year, monthIndex: monthNumber - 1 });
      } else {
        setCursor({ year: today.getFullYear(), monthIndex: today.getMonth() });
      }
      setCalendar('gregorian');
      track('calendar_primary_changed', { calendar: 'gregorian' });
      return;
    }
    const middleIso = isoDateKey(new Date(cursor.year, cursor.monthIndex, 15));
    const anchor = isCurrentMonth ? todayIso : middleIso;
    const target = hijriCursorOf(month.data?.find((day) => day.gregorian_date === anchor));
    setHijriCursor(target && !sameHijriMonth(target, todayHijri) ? target : null);
    setCalendar('hijri');
    track('calendar_primary_changed', { calendar: 'hijri' });
  };

  const hijriRange = useMemo(() => {
    if (!month.data || month.data.length === 0) return '';
    const first = month.data[0];
    const last = month.data[month.data.length - 1];
    if (first.hijri_month_text === last.hijri_month_text) return first.hijri_month_text;
    return `${first.hijri_month_text} – ${last.hijri_month_text}`;
  }, [month.data]);

  const events = useMemo(() => {
    if (isHijri) return (hijriMonth.data ?? []).filter((day) => day.special_date_name != null);
    const monthPrefix = `${cursor.year}-${String(cursor.monthIndex + 1).padStart(2, '0')}`;
    return (specials.data ?? []).filter((event) => event.gregorian_date.startsWith(monthPrefix));
  }, [isHijri, hijriMonth.data, specials.data, cursor.year, cursor.monthIndex]);

  const specialDates = useMemo(
    () => new Set(events.map((event) => event.gregorian_date)),
    [events],
  );

  const hijriName = shownHijri ? (HIJRI_META.monthNames.get(shownHijri.month) ?? '') : '';
  const title = isHijri
    ? shownHijri
      ? `${hijriName} ${shownHijri.year}`
      : ' '
    : `${monthName(cursor.monthIndex)} ${cursor.year}`;
  const subtitle = isHijri ? gregorianRange(hijriMonth.data) : hijriRange;
  const monthLabel = isHijri
    ? hijriName
    : language() === 'nb'
      ? monthName(cursor.monthIndex).toLowerCase()
      : monthName(cursor.monthIndex);

  const hijriDates = useMemo(
    () => (hijriMonth.data ? new Set(hijriMonth.data.map((day) => day.gregorian_date)) : null),
    [hijriMonth.data],
  );
  const timesRange = useMemo(() => {
    if (!isHijri) return { first: cursor, last: cursor };
    const days = hijriMonth.data;
    if (!days || days.length === 0) return null;
    const [firstYear, firstMonth] = days[0].gregorian_date.split('-').map(Number);
    const [lastYear, lastMonth] = days[days.length - 1].gregorian_date.split('-').map(Number);
    return {
      first: { year: firstYear, monthIndex: firstMonth - 1 },
      last: { year: lastYear, monthIndex: lastMonth - 1 },
    };
  }, [isHijri, cursor, hijriMonth.data]);

  const openDay = (iso: string, place?: string) => {
    router.push({ pathname: '/day/[date]', params: place ? { date: iso, place } : { date: iso } });
  };

  const days = isHijri ? hijriMonth.data : month.data;
  const daysLoading = isHijri ? hijriMonth.isLoading || shownHijri == null : month.isLoading;
  const daysError = isHijri ? hijriMonth.isError : month.isError;

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
      <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
        <MonthNav
          title={title}
          subtitle={subtitle || undefined}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
          onToday={isCurrentMonth ? undefined : goToToday}
          onSwap={swapCalendar}
          swapLabel={
            isHijri
              ? t('calendar.showGregorianCalendar')
              : t('calendar.showHijriCalendar')
          }
        />

        <SegmentedControl value={view} options={VIEW_OPTIONS} onChange={setView} />

        {view === 'dates' ? (
          <DatesView
            year={cursor.year}
            monthIndex={cursor.monthIndex}
            calendar={calendar}
            monthLabel={monthLabel}
            days={days}
            isLoading={daysLoading}
            isError={daysError}
            onRetry={isHijri ? hijriMonth.refetch : month.refetch}
            todayIso={todayIso}
            isCurrentMonth={isCurrentMonth}
            events={events}
            eventsLoading={isHijri ? daysLoading : specials.isLoading}
            eventsError={isHijri ? daysError : specials.isError}
            onEventsRetry={isHijri ? hijriMonth.refetch : specials.refetch}
            onDayPress={openDay}
          />
        ) : timesRange ? (
          <TimesView
            first={timesRange.first}
            last={timesRange.last}
            dates={isHijri ? hijriDates : null}
            calendar={calendar}
            specialDates={specialDates}
            todayDayKey={todayDayKey}
            onDayPress={openDay}
          />
        ) : daysError ? (
          <ErrorState onRetry={hijriMonth.refetch} />
        ) : (
          <Skeleton height={480} rounded="xl" />
        )}
      </View>
    </Screen>
  );
}

type DatesViewProps = {
  year: number;
  monthIndex: number;
  calendar: CalendarPrimary;
  monthLabel: string;
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
  calendar,
  monthLabel,
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
          calendar={calendar}
          days={days}
          todayIso={todayIso}
          onDayPress={(iso) => onDayPress(iso)}
        />
      )}

      <View>
        <SectionHeader
          title={t('calendar.specialDaysIn', { monthLabel })}
          style={{ marginTop: 0 }}
        />
        {eventsLoading && <Skeleton height={180} rounded="xl" />}
        {eventsError && <ErrorState onRetry={onEventsRetry} />}
        {!eventsLoading && !eventsError && events.length === 0 && (
          <EmptyState message={t('calendar.noSpecialDaysThis')} icon="calendar-clear-outline" />
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

type MonthCursor = { year: number; monthIndex: number };

type TimesViewProps = {
  first: MonthCursor;
  last: MonthCursor;
  dates: ReadonlySet<string> | null;
  calendar: CalendarPrimary;
  specialDates: ReadonlySet<string>;
  todayDayKey: string;
  onDayPress: (iso: string, place?: string) => void;
};

function TimesView({
  first,
  last,
  dates,
  calendar,
  specialDates,
  todayDayKey,
  onDayPress,
}: TimesViewProps) {
  const router = useRouter();
  const activeLocation = useActiveLocation();
  const timesPlaceIso = usePlaceFilter((state) => state.timesPlaceIso);
  const setTimesPlaceIso = usePlaceFilter((state) => state.setTimesPlaceIso);
  const { selected, isLoading: placesLoading } = usePlaces('times');
  const picked = usePickedLocation(timesPlaceIso);
  const location = picked ?? activeLocation;
  const asrMethod = useEffectiveAsrMethod();
  const firstMonth = usePrayerMonth(location, first.year, first.monthIndex + 1);
  const lastMonth = usePrayerMonth(location, last.year, last.monthIndex + 1);
  const zone = zoneFor(location);
  const timezoneNote = useTimezoneNote(new Date(), location);
  const spans = first.year !== last.year || first.monthIndex !== last.monthIndex;

  const rows = useMemo(() => {
    if (!firstMonth.data || (spans && !lastMonth.data)) return undefined;
    const all = spans ? [...firstMonth.data, ...(lastMonth.data ?? [])] : firstMonth.data;
    if (!dates) return all;
    return all.filter((day) => dates.has(isoDateKey(parseDayKey(day.date))));
  }, [firstMonth.data, lastMonth.data, spans, dates]);

  const isLoading = firstMonth.isLoading || (spans && lastMonth.isLoading);
  const isError = firstMonth.isError || (spans && lastMonth.isError);
  const refetch = () => {
    firstMonth.refetch();
    if (spans) lastMonth.refetch();
  };

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row' }}>
          <PlaceFilterButton
            place={selected}
            disabled={placesLoading}
            emptyLabel={
              activeLocation.mode === 'calculated'
                ? t('calendar.localTimes', { name: activeLocation.name })
                : activeLocation.name
            }
            onPress={() => router.push({ pathname: '/place-picker', params: { scope: 'times' } })}
            onClear={() => setTimesPlaceIso(null)}
          />
        </View>
        {timezoneNote && (
          <AppText size="xs" tone="textMuted">
            {timezoneNote}
          </AppText>
        )}
      </View>

      {isLoading && <Skeleton height={480} rounded="xl" />}
      {isError && <ErrorState onRetry={refetch} />}
      {rows?.length === 0 && (
        <NoTimesState
          period={monthYearLabel(
            firstMonth.data?.length === 0
              ? new Date(first.year, first.monthIndex, 1)
              : new Date(last.year, last.monthIndex, 1),
          )}
          onRetry={refetch}
        />
      )}
      {rows && rows.length > 0 && (
        <MonthPrayerTable
          days={rows}
          asrMethod={asrMethod}
          zone={zone}
          todayDayKey={todayDayKey}
          specialDates={specialDates}
          calendar={calendar}
          onDayPress={(day) =>
            onDayPress(isoDateKey(parseDayKey(day.date)), picked ? picked.iso : undefined)
          }
        />
      )}
    </View>
  );
}
