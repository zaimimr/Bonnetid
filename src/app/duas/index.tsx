import { Fragment } from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { DuaCard } from '@/components/duas/DuaCard';
import { DuaOptionsButton } from '@/components/duas/DuaOptionsButton';
import { Card, Divider, EmptyState, ListRow, Screen } from '@/components/ui';
import { useHijriSeasonNow } from '@/hooks/useHijriSeason';
import { categoryById, DUA_CATEGORIES, duasIn, type DuaCategory } from '@/lib/duas';
import { spacing } from '@/theme/tokens';

export default function DuasScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>();

  if (!category) return <CategoryList />;

  const selected = categoryById(category);
  if (!selected) {
    return (
      <Screen edges={[]}>
        <EmptyState message="Fant ikke denne kategorien" icon="book-outline" />
      </Screen>
    );
  }
  return <CategoryReader key={selected.id} category={selected} />;
}

function CategoryList() {
  const router = useRouter();
  const { status } = useHijriSeasonNow();
  const categories = DUA_CATEGORIES.filter(
    (entry) => !entry.season || entry.season === status?.id,
  );

  return (
    <Screen scroll edges={[]}>
      <Card padding="sm" rounded="xl" style={{ marginTop: spacing.lg }}>
        {categories.map((entry, index) => (
          <Fragment key={entry.id}>
            {index > 0 && <Divider />}
            <ListRow
              title={entry.title}
              chevron
              onPress={() => router.push({ pathname: '/duas', params: { category: entry.id } })}
              style={{ paddingHorizontal: spacing.md }}
            />
          </Fragment>
        ))}
      </Card>
    </Screen>
  );
}

function CategoryReader({ category }: { category: DuaCategory }) {
  const duas = duasIn(category.id);

  return (
    <Screen scroll edges={[]}>
      <Stack.Screen
        options={{ title: category.title, headerRight: () => <DuaOptionsButton /> }}
      />
      <View style={{ gap: spacing.lg, marginTop: spacing.md }}>
        {duas.map((dua) => (
          <DuaCard key={dua.id} dua={dua} />
        ))}
      </View>
    </Screen>
  );
}
