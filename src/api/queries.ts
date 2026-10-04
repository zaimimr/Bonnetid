import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchHijriYear,
  fetchLocations,
  fetchMosque,
  fetchMosqueJamatPeriods,
  fetchMosques,
  fetchPrayerTimes,
} from './endpoints';
import { approxGregorianStart, parseHijriDate, type HijriMonthCursor } from '@/lib/hijri';
import type { HijriDay } from './types';

const MOSQUE_CACHE_VERSION = 'vipps-v1';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function hijriYearOptions(year: number) {
  return {
    queryKey: ['hijri-year', year] as const,
    queryFn: () => fetchHijriYear(year),
    staleTime: 14 * DAY,
    gcTime: 60 * DAY,
  };
}

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: fetchLocations,
    staleTime: 30 * DAY,
    gcTime: 60 * DAY,
  });
}

export function usePrayerTimes(
  locationIso: string,
  year: number,
  month: number,
  options?: { enabled?: boolean },
) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['prayertimes', locationIso, year, month],
    queryFn: async () => {
      const hijri = await queryClient.ensureQueryData(hijriYearOptions(year));
      return fetchPrayerTimes(locationIso, year, month, hijri);
    },
    staleTime: (query) => (query.state.data?.length ? 3 * DAY : HOUR),
    gcTime: 60 * DAY,
    enabled: options?.enabled ?? true,
  });
}

export function useMosques() {
  return useQuery({
    queryKey: ['mosques', MOSQUE_CACHE_VERSION],
    queryFn: fetchMosques,
    staleTime: 3 * DAY,
    gcTime: 30 * DAY,
  });
}

export function useMosque(orgNr: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['mosque', orgNr, MOSQUE_CACHE_VERSION],
    queryFn: () => fetchMosque(orgNr),
    staleTime: 3 * DAY,
    gcTime: 30 * DAY,
    enabled: options?.enabled ?? true,
  });
}

export function useMosqueJamatPeriods(orgNr: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['mosque-jamat-periods', orgNr],
    queryFn: () => fetchMosqueJamatPeriods(orgNr),
    staleTime: 3 * DAY,
    gcTime: 30 * DAY,
    enabled: options?.enabled ?? true,
  });
}

export function useHijriMonth(year: number, month: number) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const select = useCallback(
    (days: HijriDay[]) => days.filter((day) => day.gregorian_date.startsWith(prefix)),
    [prefix],
  );
  return useQuery({ ...hijriYearOptions(year), select });
}

export function useSpecialDates(year: number) {
  const select = useCallback(
    (days: HijriDay[]) => days.filter((day) => day.special_date_name != null),
    [],
  );
  return useQuery({ ...hijriYearOptions(year), select });
}

export function useHijriMonthDays(
  { year, month }: HijriMonthCursor,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const start = approxGregorianStart({ year, month }).getTime();
  const firstYear = new Date(start - 20 * DAY).getUTCFullYear();
  const lastYear = new Date(start + 50 * DAY).getUTCFullYear();
  const spansYears = lastYear !== firstYear;
  const first = useQuery({ ...hijriYearOptions(firstYear), enabled });
  const last = useQuery({ ...hijriYearOptions(lastYear), enabled: enabled && spansYears });

  const data = useMemo(() => {
    if (!first.data || (spansYears && !last.data)) return undefined;
    const rows = spansYears ? [...first.data, ...(last.data ?? [])] : first.data;
    return rows
      .filter((day) => {
        const hijri = parseHijriDate(day.hijri_date);
        return hijri?.year === year && hijri.month === month;
      })
      .sort((a, b) => a.gregorian_date.localeCompare(b.gregorian_date));
  }, [first.data, last.data, spansYears, year, month]);

  const refetchFirst = first.refetch;
  const refetchLast = last.refetch;
  const refetch = useCallback(() => {
    refetchFirst();
    if (spansYears) refetchLast();
  }, [refetchFirst, refetchLast, spansYears]);

  return {
    data,
    isLoading: first.isLoading || (spansYears && last.isLoading),
    isError: first.isError || (spansYears && last.isError),
    refetch,
  };
}
