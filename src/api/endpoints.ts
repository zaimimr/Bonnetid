import { ApiError, apiGet } from './client';
import type { ApiLocation, HijriDay, Mosque, MosqueJamat, PrayerDay } from './types';

export function fetchLocations() {
  return apiGet<ApiLocation[]>('/locations/');
}

export function fetchPrayerTimes(locationPk: number, year: number, month: number) {
  return apiGet<PrayerDay[]>(`/prayertimes/${locationPk}/${year}/${month}/`);
}

export function fetchMosquesNearby(lat: number, lon: number) {
  return apiGet<Mosque[]>('/mosques/', { lat, lon });
}

export function fetchMosque(orgNr: string) {
  return apiGet<Mosque>(`/mosques/${orgNr}/`);
}

export async function fetchMosqueJamatPeriods(orgNr: string): Promise<MosqueJamat[]> {
  try {
    return await apiGet<MosqueJamat[]>(`/mosques/${orgNr}/jamat-times/`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return [];
    throw error;
  }
}

export function fetchHijriMonth(year: number, month: number) {
  return apiGet<HijriDay[]>(`/dates/${year}/${month}/`);
}

export function fetchSpecialDates(year: number) {
  return apiGet<HijriDay[]>(`/dates/special/${year}/`);
}
