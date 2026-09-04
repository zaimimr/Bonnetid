import { View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Divider, ListRow, Screen } from '@/components/ui';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { NOTIFICATION_SOUNDS, type NotificationSoundOption } from '@/lib/notificationSounds';
import { track } from '@/lib/telemetry';
import { useSettings } from '@/store/settings';

export default function NotificationSoundScreen() {
  const theme = useTheme();
  const notificationSound = useSettings((state) => state.notificationSound);
  const setNotificationSound = useSettings((state) => state.setNotificationSound);
  const previewPlayer = useAudioPlayer();

  const selectSound = (option: NotificationSoundOption) => {
    setNotificationSound(option.key);
    track('notification_sound_changed', { sound: option.key });
    if (option.previewAsset == null) {
      previewPlayer.pause();
      return;
    }
    setAudioModeAsync({ playsInSilentMode: true })
      .catch(() => {})
      .then(() => {
        previewPlayer.replace(option.previewAsset);
        previewPlayer.play();
      });
  };

  return (
    <Screen scroll edges={[]}>
      <Card padding="sm" rounded="xl" style={{ marginTop: spacing.lg }}>
        {NOTIFICATION_SOUNDS.map((option, index) => (
          <View key={option.key}>
            {index > 0 && <Divider />}
            <ListRow
              title={option.label}
              subtitle={option.description}
              trailing={
                option.key === notificationSound ? (
                  <Ionicons name="checkmark" size={22} color={theme.colors.primary} />
                ) : undefined
              }
              onPress={() => selectSound(option)}
              style={{ paddingHorizontal: spacing.md }}
            />
          </View>
        ))}
      </Card>
      <AppText
        size="xs"
        tone="textMuted"
        style={{ marginTop: spacing.sm, paddingHorizontal: spacing.md }}>
        Lyden spilles av når du velger den. Adhan innspilt av Ahmed Al-Haddad.
      </AppText>
    </Screen>
  );
}
