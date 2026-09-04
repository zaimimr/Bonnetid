import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { opacity, radius } from '@/theme/tokens';

export const CHECK_TARGET = 44;
const CHECK_SIZE = 26;

export type PrayerCheckProps = {
  label: string;
  prayed: boolean;
  emphasis: 'active' | 'quiet';
  onToggle: () => void;
};

export function PrayerCheck({ label, prayed, emphasis, onToggle }: PrayerCheckProps) {
  const theme = useTheme();
  const active = emphasis === 'active';

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityHint={prayed ? 'Fjerner markeringen' : 'Markerer bønnen som bedt'}
      accessibilityState={{ checked: prayed }}
      style={({ pressed }) => [
        {
          width: CHECK_TARGET,
          height: CHECK_TARGET,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed && { opacity: opacity.pressed },
      ]}>
      <View
        style={{
          width: CHECK_SIZE,
          height: CHECK_SIZE,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: prayed ? theme.colors.primary : 'transparent',
          borderWidth: prayed ? 0 : 1.5,
          borderColor: active ? theme.colors.primary : theme.colors.borderStrong,
        }}>
        {prayed && <Ionicons name="checkmark" size={16} color={theme.colors.onPrimary} />}
      </View>
    </Pressable>
  );
}
