import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { hitSlop, opacity } from '@/theme/tokens';

export function DuaOptionsButton() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/duas/options')}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel="Visning"
      style={({ pressed }) => ({ padding: 6, opacity: pressed ? opacity.pressed : 1 })}>
      <Ionicons name="options-outline" size={24} color={theme.colors.primary} />
    </Pressable>
  );
}
