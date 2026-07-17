import { apiGet } from './client';
import type { ApiLocation, HijriDay, Mosque, PrayerDay } from './types';

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

export function fetchHijriMonth(year: number, month: number) {
  return apiGet<HijriDay[]>(`/dates/${year}/${month}/`);
}

export function fetchSpecialDates(year: number) {
  return apiGet<HijriDay[]>(`/dates/special/${year}/`);
}
