import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { DuaCard } from '@/components/duas/DuaCard';
import { EmptyState, Screen } from '@/components/ui';
import { categoryById, duaById } from '@/lib/duas';
import { spacing } from '@/theme/tokens';
import { FeatureGate } from '@/components/FeatureGate';
import { t } from '@/lib/i18n';

function DuaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dua = id ? duaById(id) : null;

  if (!dua) {
    return (
      <Screen edges={[]}>
        <EmptyState message={t({ nb: 'Fant ikke denne duaen', en: 'Could not find this dua', ar: 'تعذّر العثور على هذا الدعاء', ur: 'یہ دعا نہیں ملی' })} icon="book-outline" />
      </Screen>
    );
  }

  return (
    <Screen scroll edges={[]}>
      <Stack.Screen
        options={{ title: categoryById(dua.category)?.title ?? t({ nb: 'Dua', en: 'Dua', ar: 'دعاء', ur: 'دعا' }) }}
      />
      <View style={{ gap: spacing.lg, marginTop: spacing.md }}>
        <DuaCard dua={dua} />
      </View>
    </Screen>
  );
}

export default function DuaScreenRoute() {
  return (
    <FeatureGate flag="duas">
      <DuaScreen />
    </FeatureGate>
  );
}
