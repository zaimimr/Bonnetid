import { View } from 'react-native';
import { AppText, Card, Divider, ListRow, Toggle } from '@/components/ui';
import { useSettings } from '@/store/settings';
import { spacing } from '@/theme/tokens';

const ROW = { paddingHorizontal: spacing.md } as const;

export default function DuaOptionsScreen() {
  const showTransliteration = useSettings((state) => state.duaShowTransliteration);
  const setShowTransliteration = useSettings((state) => state.setDuaShowTransliteration);
  const showMeaning = useSettings((state) => state.duaShowMeaning);
  const setShowMeaning = useSettings((state) => state.setDuaShowMeaning);

  return (
    <View style={{ padding: spacing.lg, paddingTop: spacing.xl, gap: spacing.md }}>
      <AppText size="lg" weight="semibold" accessibilityRole="header">
        Visning
      </AppText>
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Uttale"
          trailing={
            <Toggle
              value={showTransliteration}
              onValueChange={setShowTransliteration}
              accessibilityLabel="Uttale"
            />
          }
          style={ROW}
        />
        <Divider />
        <ListRow
          title="Oversettelse"
          trailing={
            <Toggle
              value={showMeaning}
              onValueChange={setShowMeaning}
              accessibilityLabel="Oversettelse"
            />
          }
          style={ROW}
        />
      </Card>
    </View>
  );
}
