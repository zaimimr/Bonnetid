import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useLocations } from '@/api/queries';
import { locationAt } from '@/hooks/useAutoLocation';
import { requestCoords } from '@/hooks/useTravelDetection';
import { track, trackError } from '@/lib/telemetry';
import { useSettings } from '@/store/settings';

export type LocationIssue = 'denied' | 'servicesOff' | 'approximate';

async function readIssue(): Promise<LocationIssue | null> {
  const permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted) return 'denied';
  if (!(await Location.hasServicesEnabledAsync())) return 'servicesOff';
  if (permission.android?.accuracy === 'coarse' || permission.ios?.accuracy === 'reduced') {
    return 'approximate';
  }
  return null;
}

export function useLocationStatus() {
  const { data: locations } = useLocations();
  const setLocation = useSettings((state) => state.setLocation);
  const [issue, setIssue] = useState<LocationIssue | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const check = useCallback(() => {
    readIssue()
      .then(setIssue)
      .catch(() => {});
  }, []);

  useEffect(() => {
    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, [check]);

  const refresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted && !permission.canAskAgain) {
        await Linking.openSettings();
        return;
      }
      const coords = await requestCoords(true);
      if (!coords) return;
      if (Platform.OS === 'ios' && (await readIssue()) === 'approximate') {
        await Linking.openSettings();
      }
      if (useSettings.getState().location?.mode === 'calculated' || !locations) return;
      const detected = await locationAt(locations, coords.lat, coords.lon);
      if (detected) {
        setLocation(detected);
        track('location_detected', { iso: detected.iso, source: 'manual' });
      }
    } catch (error) {
      trackError(error, 'location-refresh');
    } finally {
      check();
      setRefreshing(false);
    }
  }, [check, locations, refreshing, setLocation]);

  return { issue, refreshing, refresh };
}
