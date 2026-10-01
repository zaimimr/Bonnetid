const DEG = Math.PI / 180;

export function normalizeHeading(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function headingFromOrientation(alpha: number, beta: number, gamma: number): number | null {
  const cA = Math.cos(alpha);
  const sA = Math.sin(alpha);
  const cB = Math.cos(beta);
  const sB = Math.sin(beta);
  const cG = Math.cos(gamma);
  const sG = Math.sin(gamma);

  const east = -sA * cB - cA * sG - sA * sB * cG;
  const north = cA * cB - sA * sG + cA * sB * cG;
  if (Math.hypot(east, north) < 1e-3) return null;
  return normalizeHeading(Math.atan2(east, north) / DEG);
}

export function smoothHeading(previous: number | null, next: number, factor: number): number {
  if (previous == null) return next;
  const delta = ((next - previous + 540) % 360) - 180;
  return normalizeHeading(previous + delta * factor);
}
