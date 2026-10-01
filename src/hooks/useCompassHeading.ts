import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { DeviceMotion } from 'expo-sensors';
import { headingFromOrientation, normalizeHeading, smoothHeading } from '@/lib/compassHeading';

export type CompassState = {
  heading: number | null;
  accuracy: number | null;
  permissionDenied: boolean;
};

const MOTION_INTERVAL_MS = 50;
const MOTION_SMOOTHING = 0.25;
const MIN_CHANGE_DEGREES = 0.5;

const INITIAL: CompassState = { heading: null, accuracy: null, permissionDenied: false };

let current: CompassState = INITIAL;
const listeners = new Set<() => void>();
let stopSource: (() => void) | null = null;

function emit(next: CompassState) {
  current = next;
  listeners.forEach((listener) => listener());
}

function signedDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

function startSource(): () => void {
  let cancelled = false;
  let headingSubscription: Location.LocationSubscription | null = null;
  let motionSubscription: { remove: () => void } | null = null;
  let declination = 0;
  let accuracy: number | null = null;
  let fused: number | null = null;
  let motionDriven = false;

  const publish = (heading: number) => {
    const previous = current.heading;
    if (previous != null && Math.abs(signedDelta(previous, heading)) < MIN_CHANGE_DEGREES) return;
    emit({ heading, accuracy, permissionDenied: false });
  };

  async function start() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (cancelled) return;
    if (status !== 'granted') {
      emit({ ...current, permissionDenied: true });
      return;
    }

    if (Platform.OS === 'android') {
      const available = await DeviceMotion.isAvailableAsync().catch(() => false);
      if (cancelled) return;
      if (available) {
        DeviceMotion.setUpdateInterval(MOTION_INTERVAL_MS);
        motionSubscription = DeviceMotion.addListener((measurement) => {
          const rotation = measurement.rotation;
          if (!rotation) return;
          const magnetic = headingFromOrientation(rotation.alpha, rotation.beta, rotation.gamma);
          if (magnetic == null) return;
          motionDriven = true;
          fused = smoothHeading(fused, normalizeHeading(magnetic + declination), MOTION_SMOOTHING);
          publish(fused);
        });
      }
    }

    headingSubscription = await Location.watchHeadingAsync((reading) => {
      accuracy = reading.accuracy;
      if (reading.trueHeading >= 0 && reading.magHeading >= 0) {
        declination = signedDelta(reading.magHeading, reading.trueHeading);
      }
      if (motionDriven) return;
      publish(reading.trueHeading >= 0 ? reading.trueHeading : reading.magHeading);
    });
    if (cancelled) headingSubscription.remove();
  }

  start().catch(() => {});
  return () => {
    cancelled = true;
    headingSubscription?.remove();
    motionSubscription?.remove();
    current = INITIAL;
  };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!stopSource) stopSource = startSource();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && stopSource) {
      stopSource();
      stopSource = null;
    }
  };
}

function snapshot(): CompassState {
  return current;
}

export function useCompassHeading(): CompassState {
  return useSyncExternalStore(subscribe, snapshot);
}
