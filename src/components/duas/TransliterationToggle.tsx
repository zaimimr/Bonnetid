import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { hitSlop, opacity } from '@/theme/tokens';
import { useSettings } from '@/store/settings';

export function TransliterationToggle() {
  const theme = useTheme();
  const value = useSettings((state) => state.duaShowTransliteration);
  const setValue = useSettings((state) => state.setDuaShowTransliteration);

  return (
    <Pressable
      onPress={() => setValue(!value)}
      hitSlop={hitSlop}
      accessibilityRole="switch"
      accessibilityLabel="Vis uttale"
      accessibilityState={{ checked: value }}
      style={({ pressed }) => ({ padding: 6, opacity: pressed ? opacity.pressed : 1 })}>
      <Ionicons
        name={value ? 'text' : 'text-outline'}
        size={22}
        color={value ? theme.colors.primary : theme.colors.textMuted}
      />
    </Pressable>
  );
}
