import { useQuery } from '@tanstack/react-query';
import {
  fetchHijriMonth,
  fetchLocations,
  fetchMosque,
  fetchMosquesNearby,
  fetchPrayerTimes,
  fetchSpecialDates,
} from './endpoints';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: fetchLocations,
    staleTime: 7 * DAY,
    gcTime: 30 * DAY,
  });
}

export function usePrayerTimes(locationPk: number, year: number, month: number) {
  return useQuery({
    queryKey: ['prayertimes', locationPk, year, month],
    queryFn: () => fetchPrayerTimes(locationPk, year, month),
    staleTime: 12 * HOUR,
    gcTime: 7 * DAY,
  });
}

export function useMosquesNearby(lat: number, lon: number) {
  return useQuery({
    queryKey: ['mosques', lat.toFixed(3), lon.toFixed(3)],
    queryFn: () => fetchMosquesNearby(lat, lon),
    staleTime: 6 * HOUR,
    gcTime: 7 * DAY,
  });
}

export function useMosque(orgNr: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['mosque', orgNr],
    queryFn: () => fetchMosque(orgNr),
    staleTime: 6 * HOUR,
    enabled: options?.enabled ?? true,
  });
}

export function useHijriMonth(year: number, month: number) {
  return useQuery({
    queryKey: ['hijri', year, month],
    queryFn: () => fetchHijriMonth(year, month),
    staleTime: 7 * DAY,
    gcTime: 30 * DAY,
  });
}

export function useSpecialDates(year: number) {
  return useQuery({
    queryKey: ['special-dates', year],
    queryFn: () => fetchSpecialDates(year),
    staleTime: 7 * DAY,
    gcTime: 30 * DAY,
  });
}
