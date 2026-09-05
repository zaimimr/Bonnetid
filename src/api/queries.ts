import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchHijriYear,
  fetchLocations,
  fetchMosque,
  fetchMosqueJamatPeriods,
  fetchMosques,
  fetchPrayerTimes,
} from './endpoints';
import {
  fetchScannedProduct,
  isValidBarcode,
  ProductNotFoundError,
  RateLimitedError,
} from './openFoodFacts';
import type { HijriDay } from './types';

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
    staleTime: 3 * DAY,
    gcTime: 60 * DAY,
    enabled: options?.enabled ?? true,
  });
}

export function useMosques() {
  return useQuery({
    queryKey: ['mosques'],
    queryFn: fetchMosques,
    staleTime: 3 * DAY,
    gcTime: 30 * DAY,
  });
}

export function useMosque(orgNr: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['mosque', orgNr],
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

export function useScannedProduct(barcode: string) {
  return useQuery({
    queryKey: ['off-product', barcode],
    queryFn: () => fetchScannedProduct(barcode),
    enabled: isValidBarcode(barcode),
    staleTime: 7 * DAY,
    gcTime: 30 * DAY,
    retry: (failureCount, error) => {
      if (error instanceof ProductNotFoundError || error instanceof RateLimitedError) return false;
      return failureCount < 2;
    },
  });
}
