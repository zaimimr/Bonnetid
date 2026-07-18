import { normalizeAngleDelta } from './geo';

export type ArPose = {
  heading: number;
  pitch: number;
  roll: number;
};

export type Viewport = {
  width: number;
  height: number;
};

export type ScreenPoint = {
  x: number;
  y: number;
};

export type ArScene = {
  deltaDeg: number;
  marker: ScreenPoint | null;
  markerEdge: 'left' | 'right' | null;
  groundPath: ScreenPoint[];
  matCorners: ScreenPoint[] | null;
  matCenter: ScreenPoint | null;
  pitchHint: 'raise' | 'lower' | null;
};

const DEG = Math.PI / 180;

export const AR_VERTICAL_FOV_DEG = 60;
export const AR_EYE_HEIGHT_METERS = 1.5;
export const AR_MAT_DISTANCE_METERS = 2.4;
export const AR_MAT_WIDTH_METERS = 0.8;
export const AR_MAT_LENGTH_METERS = 1.35;

const MARKER_VISIBLE_DELTA_DEG = 40;
const RAISE_HINT_PITCH_DEG = -55;
const LOWER_HINT_PITCH_DEG = 40;

export function buildArScene(pose: ArPose, qiblaBearing: number, viewport: Viewport): ArScene {
  const { width, height } = viewport;
  const deltaDeg = normalizeAngleDelta(qiblaBearing - pose.heading);
  const focal = height / 2 / Math.tan((AR_VERTICAL_FOV_DEG / 2) * DEG);

  const pitchDeg = pose.pitch / DEG;
  const pitchHint =
    pitchDeg < RAISE_HINT_PITCH_DEG ? 'raise' : pitchDeg > LOWER_HINT_PITCH_DEG ? 'lower' : null;

  let marker: ScreenPoint | null = null;
  let markerEdge: 'left' | 'right' | null = null;

  if (Math.abs(deltaDeg) <= MARKER_VISIBLE_DELTA_DEG) {
    const x = width / 2 + focal * Math.tan(deltaDeg * DEG);
    const y = height / 2 + focal * Math.tan(pose.pitch);
    marker = {
      x: Math.max(36, Math.min(width - 36, x)),
      y: Math.max(70, Math.min(height * 0.75, y)),
    };
  } else {
    markerEdge = deltaDeg < 0 ? 'left' : 'right';
  }

  const feet: ScreenPoint = { x: width / 2, y: height + 40 };
  const groundPath = marker ? [feet, marker] : [];

  let matCorners: ScreenPoint[] | null = null;
  let matCenter: ScreenPoint | null = null;

  if (marker) {
    const nearDistance = AR_MAT_DISTANCE_METERS - AR_MAT_LENGTH_METERS / 2;
    const farDistance = AR_MAT_DISTANCE_METERS + AR_MAT_LENGTH_METERS / 2;

    const groundY = (distance: number) => {
      const elevation = -Math.atan(AR_EYE_HEIGHT_METERS / distance);
      return height / 2 + focal * Math.tan(pose.pitch - elevation);
    };

    const lineXAtY = (y: number) => {
      const span = feet.y - marker.y;
      if (span <= 0) return feet.x;
      const t = (feet.y - y) / span;
      return feet.x + (marker.x - feet.x) * t;
    };

    const nearY = groundY(nearDistance);
    const farY = groundY(farDistance);

    if (farY > marker.y + 10 && nearY < height + 160 && nearY > farY + 8) {
      const nearHalfWidth = (focal * (AR_MAT_WIDTH_METERS / 2)) / nearDistance;
      const farHalfWidth = (focal * (AR_MAT_WIDTH_METERS / 2)) / farDistance;
      const nearX = lineXAtY(nearY);
      const farX = lineXAtY(farY);

      matCorners = [
        { x: nearX - nearHalfWidth, y: nearY },
        { x: nearX + nearHalfWidth, y: nearY },
        { x: farX + farHalfWidth, y: farY },
        { x: farX - farHalfWidth, y: farY },
      ];
      matCenter = { x: (nearX + farX) / 2, y: (nearY + farY) / 2 };
    }
  }

  return { deltaDeg, marker, markerEdge, groundPath, matCorners, matCenter, pitchHint };
}
