export const KAABA = { lat: 21.4225, lon: 39.8262 } as const;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

export function bearingBetween(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
): number {
  const phi1 = toRadians(fromLat);
  const phi2 = toRadians(toLat);
  const deltaLambda = toRadians(toLon - fromLon);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

export function qiblaBearing(lat: number, lon: number): number {
  return bearingBetween(lat, lon, KAABA.lat, KAABA.lon);
}

export function distanceKm(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLon = toRadians(toLon - fromLon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
