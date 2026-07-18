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
  horizonY: number | null;
  groundPath: ScreenPoint[];
  matCorners: ScreenPoint[] | null;
  matCenter: ScreenPoint | null;
};

const DEG = Math.PI / 180;

export const AR_VERTICAL_FOV_DEG = 60;
export const AR_EYE_HEIGHT_METERS = 1.45;
export const AR_MAT_DISTANCE_METERS = 2.1;
export const AR_MAT_WIDTH_METERS = 0.8;
export const AR_MAT_LENGTH_METERS = 1.35;

type Vec3 = { x: number; y: number; z: number };

function toCamera(point: Vec3, pitch: number): Vec3 {
  const cos = Math.cos(pitch);
  const sin = Math.sin(pitch);
  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos,
  };
}

function rotate2d(point: ScreenPoint, angle: number): ScreenPoint {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

function projectPoint(
  point: Vec3,
  pose: ArPose,
  viewport: Viewport,
  focal: number,
): ScreenPoint | null {
  const cam = toCamera(point, pose.pitch);
  if (cam.z < 0.05) return null;
  const flat = {
    x: (cam.x / cam.z) * focal,
    y: (-cam.y / cam.z) * focal,
  };
  const rolled = rotate2d(flat, pose.roll);
  return {
    x: viewport.width / 2 + rolled.x,
    y: viewport.height / 2 + rolled.y,
  };
}

function groundPoint(deltaRad: number, distance: number, side = 0): Vec3 {
  const forward = { x: Math.sin(deltaRad), z: Math.cos(deltaRad) };
  const right = { x: forward.z, z: -forward.x };
  return {
    x: forward.x * distance + right.x * side,
    y: -AR_EYE_HEIGHT_METERS,
    z: forward.z * distance + right.z * side,
  };
}

export function buildArScene(pose: ArPose, qiblaBearing: number, viewport: Viewport): ArScene {
  const deltaDeg = normalizeAngleDelta(qiblaBearing - pose.heading);
  const deltaRad = deltaDeg * DEG;
  const focal = viewport.height / 2 / Math.tan((AR_VERTICAL_FOV_DEG / 2) * DEG);

  const markerRaw = projectPoint(
    { x: Math.sin(deltaRad) * 1000, y: 0, z: Math.cos(deltaRad) * 1000 },
    pose,
    viewport,
    focal,
  );

  const margin = 36;
  let marker: ScreenPoint | null = null;
  let markerEdge: 'left' | 'right' | null = null;
  if (markerRaw && markerRaw.x >= -margin && markerRaw.x <= viewport.width + margin) {
    marker = markerRaw;
  } else {
    markerEdge = deltaDeg < 0 ? 'left' : 'right';
  }

  const horizonAhead = projectPoint({ x: 0, y: 0, z: 1000 }, pose, viewport, focal);
  const horizonY = horizonAhead ? horizonAhead.y : null;

  const groundPath: ScreenPoint[] = [];
  for (const distance of [0.7, 1, 1.5, 2, 3, 4, 6, 9, 14, 22, 40, 80]) {
    const projected = projectPoint(groundPoint(deltaRad, distance), pose, viewport, focal);
    if (projected) groundPath.push(projected);
  }

  const halfLength = AR_MAT_LENGTH_METERS / 2;
  const halfWidth = AR_MAT_WIDTH_METERS / 2;
  const cornerOffsets: [number, number][] = [
    [-halfLength, -halfWidth],
    [-halfLength, halfWidth],
    [halfLength, halfWidth],
    [halfLength, -halfWidth],
  ];
  const corners: ScreenPoint[] = [];
  for (const [along, side] of cornerOffsets) {
    const projected = projectPoint(
      groundPoint(deltaRad, AR_MAT_DISTANCE_METERS + along, side),
      pose,
      viewport,
      focal,
    );
    if (projected) corners.push(projected);
  }
  const matCorners = corners.length === 4 ? corners : null;
  const matCenter = matCorners
    ? projectPoint(groundPoint(deltaRad, AR_MAT_DISTANCE_METERS), pose, viewport, focal)
    : null;

  return { deltaDeg, marker, markerEdge, horizonY, groundPath, matCorners, matCenter };
}
