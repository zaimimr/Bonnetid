import { View } from 'react-native';
import { AppText, Toggle } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { useSettings } from '@/store/settings';

export function TransliterationToggle() {
  const value = useSettings((state) => state.duaShowTransliteration);
  const setValue = useSettings((state) => state.setDuaShowTransliteration);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
        minHeight: 44,
      }}>
      <AppText weight="medium">Vis uttale</AppText>
      <Toggle value={value} onValueChange={setValue} accessibilityLabel="Vis uttale" />
    </View>
  );
}
