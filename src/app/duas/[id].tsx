import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { DuaCard } from '@/components/duas/DuaCard';
import { TransliterationToggle } from '@/components/duas/TransliterationToggle';
import { EmptyState, Screen } from '@/components/ui';
import { categoryById, duaById } from '@/lib/duas';
import { spacing } from '@/theme/tokens';

export default function DuaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dua = id ? duaById(id) : null;

  if (!dua) {
    return (
      <Screen edges={[]}>
        <EmptyState message="Fant ikke denne duaen" icon="book-outline" />
      </Screen>
    );
  }

  return (
    <Screen scroll edges={[]}>
      <Stack.Screen
        options={{
          title: categoryById(dua.category)?.title ?? 'Dua',
          headerRight: () => <TransliterationToggle />,
        }}
      />
      <View style={{ gap: spacing.lg, marginTop: spacing.md }}>
        <DuaCard dua={dua} />
      </View>
    </Screen>
  );
}
