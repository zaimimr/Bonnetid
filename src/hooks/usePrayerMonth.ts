import { useCallback, useMemo } from 'react';
import { useHijriMonth, usePrayerTimes } from '@/api/queries';
import type { PrayerDay } from '@/api/types';
import { calculatePrayerMonth } from '@/lib/calculatedTimes';
import type { PrayerTimeZone } from '@/lib/time';
import { useSettings, type SavedLocation } from '@/store/settings';

export type PrayerMonthResult = {
  data: PrayerDay[] | undefined;
  isLoading: boolean;
  isError: boolean;
  dataUpdatedAt: number;
  refetch: () => void;
};

export function zoneFor(location: SavedLocation): PrayerTimeZone {
  return location.mode === 'calculated' ? 'device' : 'oslo';
}

export function usePrayerMonth(
  location: SavedLocation,
  year: number,
  month: number,
): PrayerMonthResult {
  const calculated = location.mode === 'calculated';
  const method = useSettings((state) => state.calculationMethod);

  const fetched = usePrayerTimes(calculated ? '' : location.iso, year, month, {
    enabled: !calculated,
  });
  const hijri = useHijriMonth(year, month);

  const computed = useMemo(() => {
    if (!calculated) return undefined;
    return calculatePrayerMonth({
      lat: location.lat,
      lon: location.lon,
      year,
      month,
      method,
      hijriDays: hijri.data ?? [],
    });
  }, [calculated, hijri.data, location.lat, location.lon, year, month, method]);

  const refetchFetched = fetched.refetch;
  const refetchHijri = hijri.refetch;
  const refetch = useCallback(() => {
    if (calculated) {
      refetchHijri();
      return;
    }
    refetchFetched();
  }, [calculated, refetchFetched, refetchHijri]);

  if (!calculated) {
    return {
      data: fetched.data,
      isLoading: fetched.isLoading,
      isError: fetched.isError,
      dataUpdatedAt: fetched.dataUpdatedAt,
      refetch,
    };
  }

  return {
    data: computed,
    isLoading: false,
    isError: false,
    dataUpdatedAt: hijri.dataUpdatedAt,
    refetch,
  };
}
