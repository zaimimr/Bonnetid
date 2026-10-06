import type { ApiLocation } from '@/api/types';
import { t } from './i18n.ts';

export type Place = {
  iso: string;
  name: string;
  kommune: string;
  fylke: string;
  lat: number;
  lon: number;
  mosqueCount: number;
};

export type PlaceSection = {
  fylke: string;
  data: Place[];
};

export function formatFylke(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^\d+\s*-\s*(.+)$/);
  return match ? match[1].trim() : trimmed;
}

export function buildPlaces(
  mosques: { location_iso: string | null }[],
  locations: ApiLocation[],
  includeEmpty = false,
): Place[] {
  const counts = new Map<string, number>();
  for (const mosque of mosques) {
    if (!mosque.location_iso) continue;
    counts.set(mosque.location_iso, (counts.get(mosque.location_iso) ?? 0) + 1);
  }

  const places: Place[] = [];
  for (const location of locations) {
    const count = counts.get(location.iso) ?? 0;
    if (!count && !includeEmpty) continue;
    places.push({
      iso: location.iso,
      name: location.name,
      kommune: location.kommune,
      fylke: formatFylke(location.fylke),
      lat: location.lat,
      lon: location.lon,
      mosqueCount: count,
    });
  }

  return places.sort((a, b) => a.name.localeCompare(b.name, 'nb'));
}

export function placesByIso(places: Place[]): Map<string, Place> {
  return new Map(places.map((place) => [place.iso, place]));
}

export function groupPlacesByFylke(places: Place[]): PlaceSection[] {
  const sections = new Map<string, Place[]>();
  for (const place of places) {
    const key = place.fylke || t({ nb: 'Andre steder', en: 'Other places', ar: 'أماكن أخرى', ur: 'دیگر مقامات' });
    const bucket = sections.get(key);
    if (bucket) bucket.push(place);
    else sections.set(key, [place]);
  }

  return [...sections.entries()]
    .map(([fylke, data]) => ({ fylke, data }))
    .sort((a, b) => a.fylke.localeCompare(b.fylke, 'nb'));
}

export function placeSearchText(place: Place): string {
  return `${place.name} ${place.kommune} ${place.fylke}`.toLowerCase();
}

export function matchesPlace(place: Place, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  return placeSearchText(place).includes(normalizedQuery);
}

export function placeCountLabel(count: number): string {
  return count === 1
    ? t({ nb: '1 moské', en: '1 mosque', ar: 'مسجد واحد', ur: '1 مسجد' })
    : t({ nb: `${count} moskeer`, en: `${count} mosques`, ar: `${count} مساجد`, ur: `${count} مساجد` });
}
