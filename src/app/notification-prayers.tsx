import { View } from 'react-native';
import { Card, Divider, ListRow, Screen, Toggle } from '@/components/ui';
import { PRAYER_LABELS } from '@/lib/prayerSchedule';
import { track } from '@/lib/telemetry';
import { spacing } from '@/theme/tokens';
import { NOTIFIABLE_PRAYERS, useSettings } from '@/store/settings';

export default function NotificationPrayersScreen() {
  const notificationPrayers = useSettings((state) => state.notificationPrayers);
  const toggleNotificationPrayer = useSettings((state) => state.toggleNotificationPrayer);

  return (
    <Screen scroll edges={[]}>
      <Card padding="sm" rounded="xl" style={{ marginTop: spacing.lg }}>
        {NOTIFIABLE_PRAYERS.map((prayer, index) => (
          <View key={prayer}>
            {index > 0 && <Divider />}
            <ListRow
              title={PRAYER_LABELS[prayer]}
              trailing={
                <Toggle
                  value={notificationPrayers[prayer]}
                  onValueChange={() => {
                    toggleNotificationPrayer(prayer);
                    track('notification_prayer_toggled', {
                      prayer,
                      enabled: !notificationPrayers[prayer],
                    });
                  }}
                />
              }
              style={{ paddingHorizontal: spacing.md }}
            />
          </View>
        ))}
      </Card>

    </Screen>
  );
}
