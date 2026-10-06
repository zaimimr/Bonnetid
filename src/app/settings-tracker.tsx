import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Divider, ListRow, Toggle } from '@/components/ui';
import { LockScreenPreview } from '@/components/settings/LockScreenPreview';
import {
  ROW,
  SettingsPage,
  hasIsland,
  lockScreenSupported,
  useLockScreenToggle,
  widgetJamatSupported,
} from '@/components/settings/shared';
import { useTheme } from '@/theme';
import { useFeature } from '@/hooks/useFeature';
import { useActiveLocation, useActiveMosque, useSettings } from '@/store/settings';
import { t } from '@/lib/i18n';

export default function TrackerSettingsScreen() {
  const theme = useTheme();
  const mosque = useActiveMosque();
  const calculated = useActiveLocation().mode === 'calculated';
  const trackerAllowed = useFeature('prayer-tracker');
  const trackerEnabled = useSettings((state) => state.prayerTrackerEnabled) && trackerAllowed;
  const setTrackerEnabled = useSettings((state) => state.setPrayerTrackerEnabled);
  const liveActivityEnabled = useSettings((state) => state.liveActivityEnabled);
  const widgetShowJamat = useSettings((state) => state.widgetShowJamat);
  const setWidgetShowJamat = useSettings((state) => state.setWidgetShowJamat);
  const toggleLockScreen = useLockScreenToggle();
  const ios = Platform.OS === 'ios';
  const iosCountdown = ios && lockScreenSupported;
  const androidLockCard = !ios && lockScreenSupported && trackerEnabled;
  const widgetJamat = widgetJamatSupported && !calculated;

  return (
    <SettingsPage>
      {(iosCountdown || (!ios && lockScreenSupported)) && (
        <LockScreenPreview
          enabled={liveActivityEnabled}
          tracker={trackerAllowed ? trackerEnabled : null}
        />
      )}

      {(iosCountdown || widgetJamat) && (
        <Card padding="sm" rounded="xl">
          {iosCountdown && (
            <ListRow
              title={t('settings.countdownOnTheLock')}
              subtitle={hasIsland ? t('settings.alsoInTheDynamic') : undefined}
              leading={<Ionicons name="timer-outline" size={20} color={theme.colors.primary} />}
              trailing={<Toggle value={liveActivityEnabled} onValueChange={toggleLockScreen} />}
              style={ROW}
            />
          )}
          {widgetJamat && (
            <ListRow
              title={t('settings.showJamaatTimesIn')}
              subtitle={mosque ? mosque.name : t('settings.chooseAMosqueFirst')}
              leading={<Ionicons name="people-outline" size={20} color={theme.colors.primary} />}
              trailing={
                <Toggle
                  value={widgetShowJamat}
                  onValueChange={setWidgetShowJamat}
                  disabled={mosque == null}
                />
              }
              style={ROW}
            />
          )}
        </Card>
      )}

      {trackerAllowed && (
        <Card padding="sm" rounded="xl">
          <ListRow
            title={t('settings.markPrayers')}
            subtitle={t('settings.tickOffThePrayers')}
            leading={<Ionicons name="checkmark-done-outline" size={20} color={theme.colors.primary} />}
            trailing={<Toggle value={trackerEnabled} onValueChange={setTrackerEnabled} />}
            style={ROW}
          />
          {androidLockCard && (
            <>
              <Divider />
              <ListRow
                title={t('settings.prayerCardOnThe')}
                subtitle={t('settings.countdownWithPrayedAnd')}
                leading={<Ionicons name="timer-outline" size={20} color={theme.colors.primary} />}
                trailing={<Toggle value={liveActivityEnabled} onValueChange={toggleLockScreen} />}
                style={ROW}
              />
            </>
          )}
        </Card>
      )}
    </SettingsPage>
  );
}
