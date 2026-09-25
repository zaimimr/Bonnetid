import { useCallback, useMemo } from 'react';
import { useHijriMonth, usePrayerTimes } from '@/api/queries';
import type { PrayerDay } from '@/api/types';
import { calculatePrayerMonth } from '@/lib/calculatedTimes';
import type { PrayerTimeZone } from '@/lib/time';
import { timeZoneForCoords } from '@/lib/timezone';
import { useEffectiveCalculationMethod } from '@/hooks/useEffectiveCalculationMethod';
import type { SavedLocation } from '@/store/settings';

export type PrayerMonthResult = {
  data: PrayerDay[] | undefined;
  isLoading: boolean;
  isError: boolean;
  dataUpdatedAt: number;
  refetch: () => void;
};

/**
 * Norwegian times are published in Norwegian wall clock and shown in the reader's own clock.
 * A calculated location keeps the clock of the place itself, so a phone that has not picked up
 * the local zone still prints the times people around the user are praying by.
 */
export function zoneFor(location: SavedLocation): PrayerTimeZone {
  if (location.mode !== 'calculated') return 'oslo';
  const zone = timeZoneForCoords(location.lat, location.lon);
  return (zone as PrayerTimeZone | null) ?? 'device';
}

export function usePrayerMonth(
  location: SavedLocation,
  year: number,
  month: number,
): PrayerMonthResult {
  const calculated = location.mode === 'calculated';
  const method = useEffectiveCalculationMethod(location);
  const zone = zoneFor(location);

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
      timeZone: zone,
    });
  }, [calculated, hijri.data, location.lat, location.lon, year, month, method, zone]);

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
