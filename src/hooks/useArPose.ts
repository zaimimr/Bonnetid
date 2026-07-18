import { useEffect, useRef, useState } from 'react';
import { DeviceMotion, type DeviceMotionMeasurement } from 'expo-sensors';
import { useCompassHeading } from '@/hooks/useCompassHeading';
import { normalizeAngleDelta } from '@/lib/geo';
import type { ArPose } from '@/lib/arProjection';

const UPDATE_INTERVAL_MS = 50;
const TILT_SMOOTHING = 0.25;
const HEADING_SMOOTHING = 0.2;
const MAX_ROLL = Math.PI / 4;

export type ArPoseState = {
  pose: ArPose | null;
  headingAccuracy: number | null;
  permissionDenied: boolean;
  motionUnavailable: boolean;
};

export function useArPose(enabled: boolean): ArPoseState {
  const { heading, accuracy, permissionDenied } = useCompassHeading();
  const [pose, setPose] = useState<ArPose | null>(null);
  const [motionUnavailable, setMotionUnavailable] = useState(false);

  const rawTilt = useRef<{ pitch: number; roll: number } | null>(null);
  const rawHeading = useRef<number | null>(null);
  const smoothed = useRef<ArPose | null>(null);

  useEffect(() => {
    rawHeading.current = heading;
  }, [heading]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let subscription: { remove: () => void } | null = null;

    DeviceMotion.isAvailableAsync().then((available) => {
      if (cancelled) return;
      if (!available) {
        setMotionUnavailable(true);
        return;
      }
      DeviceMotion.setUpdateInterval(UPDATE_INTERVAL_MS);
      subscription = DeviceMotion.addListener((measurement: DeviceMotionMeasurement) => {
        const rotation = measurement.rotation;
        if (!rotation) return;
        const pitch = rotation.beta - Math.PI / 2;
        const roll = Math.max(-MAX_ROLL, Math.min(MAX_ROLL, rotation.gamma));
        rawTilt.current = { pitch, roll };
      });
    });

    const interval = setInterval(() => {
      const tilt = rawTilt.current;
      const headingNow = rawHeading.current;
      if (!tilt || headingNow == null) return;

      const previous = smoothed.current;
      const next: ArPose = previous
        ? {
            heading:
              (previous.heading +
                HEADING_SMOOTHING * normalizeAngleDelta(headingNow - previous.heading) +
                360) %
              360,
            pitch: previous.pitch + TILT_SMOOTHING * (tilt.pitch - previous.pitch),
            roll: previous.roll + TILT_SMOOTHING * (tilt.roll - previous.roll),
          }
        : { heading: headingNow, pitch: tilt.pitch, roll: tilt.roll };

      smoothed.current = next;
      setPose(next);
    }, UPDATE_INTERVAL_MS);

    return () => {
      cancelled = true;
      subscription?.remove();
      clearInterval(interval);
      smoothed.current = null;
    };
  }, [enabled]);

  return { pose, headingAccuracy: accuracy, permissionDenied, motionUnavailable };
}
