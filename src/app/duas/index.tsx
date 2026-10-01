import { Fragment, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { DuaCard } from '@/components/duas/DuaCard';
import { Button, Card, Divider, EmptyState, ListRow, Screen } from '@/components/ui';
import { useHijriSeasonNow } from '@/hooks/useHijriSeason';
import { categoryById, DUA_CATEGORIES, duasIn, type DuaCategory } from '@/lib/duas';
import { spacing } from '@/theme/tokens';

const NEXT_CARD_DELAY_MS = 350;

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
              subtitle={`${duasIn(entry.id).length} duaer`}
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
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<number[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const counted = Object.values(counts).some((value) => value > 0);

  const count = (index: number) => {
    const dua = duas[index];
    const next = (counts[dua.id] ?? 0) + 1;
    setCounts((current) => ({ ...current, [dua.id]: next }));
    const nextOffset = offsets.current[index + 1];
    if (dua.repeat && next >= dua.repeat && nextOffset != null) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: nextOffset - spacing.lg, animated: true });
      }, NEXT_CARD_DELAY_MS);
    }
  };

  return (
    <Screen scroll edges={[]} scrollRef={scrollRef}>
      <Stack.Screen options={{ title: category.title }} />
      <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
        {duas.map((dua, index) => (
          <View
            key={dua.id}
            onLayout={(event) => {
              offsets.current[index] = event.nativeEvent.layout.y;
            }}>
            <DuaCard
              dua={dua}
              step={`${index + 1} av ${duas.length}`}
              count={counts[dua.id] ?? 0}
              onCount={() => count(index)}
              onResetCount={() => setCounts((current) => ({ ...current, [dua.id]: 0 }))}
            />
          </View>
        ))}
        {counted && (
          <Button
            label="Start tellingen på nytt"
            variant="secondary"
            onPress={() => {
              setCounts({});
              scrollRef.current?.scrollTo({ y: 0, animated: true });
            }}
          />
        )}
      </View>
    </Screen>
  );
}
