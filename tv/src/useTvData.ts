import { useQueries, useQuery } from '@tanstack/react-query';
import { fetchHijriYear, fetchMosque, fetchMosqueJamatPeriods, fetchMosques, fetchPrayerTimes } from '@/api/endpoints';
import type { HijriDay, Mosque, PrayerDay } from '@/api/types';
import { osloDateKey } from '@/lib/time';
import {
  buildTvDay,
  eidPrayersOn,
  jummahInstants,
  ramadanDayOf,
  type TvDay,
  type TvState,
} from './tvModel';

const DAY = 86_400_000;
const HOUR = 3_600_000;

function shiftIso(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function dayKeyOf(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}-${month}-${year}`;
}

export function useMosqueList() {
  return useQuery({ queryKey: ['tv', 'mosques'], queryFn: fetchMosques, staleTime: DAY });
}

export type TvData = {
  mosque: Mosque;
  state: Omit<TvState, 'now' | 'duaUntil'>;
  nightKey: string;
};

export function useTvData(orgNr: string | null, now: Date): { data: TvData | null; error: boolean } {
  const today = osloDateKey(now);
  const isos = [-1, 0, 1, 2].map((offset) => shiftIso(today, offset));
  const years = [...new Set(isos.map((iso) => Number(iso.slice(0, 4))))];
  const months = [...new Set(isos.map((iso) => iso.slice(0, 7)))];

  const mosque = useQuery({
    queryKey: ['tv', 'mosque', orgNr],
    queryFn: () => fetchMosque(orgNr ?? ''),
    enabled: orgNr != null,
    staleTime: HOUR / 2,
    refetchInterval: HOUR / 2,
  });
  const periods = useQuery({
    queryKey: ['tv', 'jamat', orgNr],
    queryFn: () => fetchMosqueJamatPeriods(orgNr ?? ''),
    enabled: orgNr != null,
    staleTime: HOUR,
    refetchInterval: HOUR,
  });
  const hijri = useQueries({
    queries: years.map((year) => ({
      queryKey: ['tv', 'hijri', year],
      queryFn: () => fetchHijriYear(year),
      staleTime: 7 * DAY,
    })),
  });
  const hijriRows: HijriDay[] = hijri.flatMap((query) => query.data ?? []);
  const hijriReady = hijri.every((query) => query.data);
  const location = mosque.data?.location_iso ?? null;
  const times = useQueries({
    queries: months.map((month) => ({
      queryKey: ['tv', 'times', location, month],
      queryFn: () =>
        fetchPrayerTimes(location ?? '', Number(month.slice(0, 4)), Number(month.slice(5, 7)), hijriRows),
      enabled: location != null && hijriReady,
      staleTime: 3 * DAY,
    })),
  });

  const error = [mosque, periods, ...hijri, ...times].some((query) => query.isError && !query.data);
  if (!mosque.data || !hijriReady || times.some((query) => !query.data)) return { data: null, error };

  const days = new Map<string, PrayerDay>();
  for (const query of times) for (const day of query.data ?? []) days.set(day.date, day);
  const build = (iso: string): TvDay | null => {
    const day = days.get(dayKeyOf(iso));
    if (!day) return null;
    return buildTvDay(day, days.get(dayKeyOf(shiftIso(iso, 1))) ?? null, mosque.data, periods.data, hijriRows);
  };

  const todayDay = build(isos[1]);
  if (!todayDay) return { data: null, error: true };
  const ramadanDay = ramadanDayOf(todayDay);
  return {
    error,
    data: {
      mosque: mosque.data,
      nightKey: ramadanDay != null ? todayDay.iso : '',
      state: {
        yesterday: build(isos[0]),
        today: todayDay,
        tomorrow: build(isos[2]),
        jummah: jummahInstants(mosque.data, periods.data, todayDay.iso),
        ramadanDay,
        eidPrayers: eidPrayersOn(mosque.data, todayDay),
      },
    },
  };
}
