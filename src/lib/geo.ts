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

export const HARAM_RADIUS_KM = 0.05;

export const QIBLA_UNCERTAIN_THRESHOLD_DEGREES = 15;

export function bearingUncertaintyDegrees(
  accuracyMetres: number | null,
  distanceToKaabaKm: number,
): number {
  if (accuracyMetres == null || accuracyMetres <= 0) return 0;
  const distanceMetres = distanceToKaabaKm * 1000;
  if (distanceMetres <= accuracyMetres) return 180;
  return toDegrees(Math.atan2(accuracyMetres, distanceMetres));
}

export function isInsideHaram(distanceToKaabaKm: number): boolean {
  return distanceToKaabaKm <= HARAM_RADIUS_KM;
}

export function isBearingTrustworthy(uncertaintyDegrees: number): boolean {
  return uncertaintyDegrees < QIBLA_UNCERTAIN_THRESHOLD_DEGREES;
}

export function normalizeAngleDelta(degrees: number): number {
  return (((degrees % 360) + 540) % 360) - 180;
}

export function isQiblaAligned(
  heading: number,
  bearing: number,
  uncertaintyDegrees = 0,
): boolean {
  const tolerance = Math.max(QIBLA_ALIGNED_THRESHOLD_DEGREES, uncertaintyDegrees);
  return Math.abs(normalizeAngleDelta(bearing - heading)) <= tolerance;
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

export function destinationPoint(
  lat: number,
  lon: number,
  bearingDegrees: number,
  distanceKm: number,
): { lat: number; lon: number } {
  const earthRadiusKm = 6371;
  const angular = distanceKm / earthRadiusKm;
  const bearing = toRadians(bearingDegrees);
  const phi1 = toRadians(lat);
  const lambda1 = toRadians(lon);
  const phi2 = Math.asin(
    Math.sin(phi1) * Math.cos(angular) + Math.cos(phi1) * Math.sin(angular) * Math.cos(bearing),
  );
  const lambda2 =
    lambda1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(phi1),
      Math.cos(angular) - Math.sin(phi1) * Math.sin(phi2),
    );
  return { lat: toDegrees(phi2), lon: ((toDegrees(lambda2) + 540) % 360) - 180 };
}

export function facingConePoints(
  lat: number,
  lon: number,
  headingDegrees: number,
  distanceKm = 0.6,
  halfAngleDegrees = 22,
  segments = 6,
): { lat: number; lon: number }[] {
  const points = [{ lat, lon }];
  for (let i = 0; i <= segments; i += 1) {
    const bearing = headingDegrees - halfAngleDegrees + (2 * halfAngleDegrees * i) / segments;
    points.push(destinationPoint(lat, lon, bearing, distanceKm));
  }
  return points;
}

export function formatAccuracy(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
