import { Fragment } from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AppText, Card, Divider, EmptyState, ListRow, Screen, SectionHeader } from '@/components/ui';
import { categoryById, DUA_CATEGORIES, duasIn, type DuaCategory } from '@/lib/duas';
import { spacing } from '@/theme/tokens';

export default function DuasScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  const selected = category ? categoryById(category) : null;
  const categories = category ? (selected ? [selected] : []) : DUA_CATEGORIES;

  return (
    <Screen scroll edges={[]}>
      {selected && <Stack.Screen options={{ title: selected.title }} />}
      {categories.length === 0 ? (
        <EmptyState message="Fant ikke denne kategorien" icon="book-outline" />
      ) : (
        categories.map((entry) => (
          <CategorySection key={entry.id} category={entry} showHeader={!selected} />
        ))
      )}
    </Screen>
  );
}

function CategorySection({ category, showHeader }: { category: DuaCategory; showHeader: boolean }) {
  const router = useRouter();
  const duas = duasIn(category.id);

  return (
    <>
      {showHeader ? (
        <SectionHeader title={category.title} />
      ) : (
        <View style={{ height: spacing.lg }} />
      )}
      <Card padding="sm" rounded="xl">
        {duas.map((dua, index) => (
          <Fragment key={dua.id}>
            {index > 0 && <Divider />}
            <ListRow
              title={dua.title}
              trailing={
                dua.repeat ? (
                  <AppText size="sm" tone="textMuted" tabular>
                    {`${dua.repeat}×`}
                  </AppText>
                ) : undefined
              }
              chevron
              onPress={() => router.push({ pathname: '/duas/[id]', params: { id: dua.id } })}
              style={{ paddingHorizontal: spacing.md }}
            />
          </Fragment>
        ))}
      </Card>
    </>
  );
}
