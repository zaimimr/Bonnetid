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

export const QIBLA_ALIGNED_THRESHOLD_DEGREES = 5;

export function normalizeAngleDelta(degrees: number): number {
  return (((degrees % 360) + 540) % 360) - 180;
}

export function isQiblaAligned(heading: number, bearing: number): boolean {
  return Math.abs(normalizeAngleDelta(bearing - heading)) <= QIBLA_ALIGNED_THRESHOLD_DEGREES;
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

export function greatCirclePoints(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  segments = 64,
): { lat: number; lon: number }[] {
  const phi1 = toRadians(fromLat);
  const lambda1 = toRadians(fromLon);
  const phi2 = toRadians(toLat);
  const lambda2 = toRadians(toLon);

  const delta =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((phi2 - phi1) / 2) ** 2 +
          Math.cos(phi1) * Math.cos(phi2) * Math.sin((lambda2 - lambda1) / 2) ** 2,
      ),
    );

  if (delta < 1e-9) {
    return [
      { lat: fromLat, lon: fromLon },
      { lat: toLat, lon: toLon },
    ];
  }

  const points: { lat: number; lon: number }[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const fraction = i / segments;
    const a = Math.sin((1 - fraction) * delta) / Math.sin(delta);
    const b = Math.sin(fraction * delta) / Math.sin(delta);
    const x = a * Math.cos(phi1) * Math.cos(lambda1) + b * Math.cos(phi2) * Math.cos(lambda2);
    const y = a * Math.cos(phi1) * Math.sin(lambda1) + b * Math.cos(phi2) * Math.sin(lambda2);
    const z = a * Math.sin(phi1) + b * Math.sin(phi2);
    points.push({
      lat: toDegrees(Math.atan2(z, Math.sqrt(x ** 2 + y ** 2))),
      lon: toDegrees(Math.atan2(y, x)),
    });
  }
  return points;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
