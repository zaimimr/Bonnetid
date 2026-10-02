import { Fragment, useCallback, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { DuaCard } from '@/components/duas/DuaCard';
import { DuaOptionsButton } from '@/components/duas/DuaOptionsButton';
import { Button, Card, Divider, EmptyState, ListRow, Screen } from '@/components/ui';
import { useHijriSeasonNow } from '@/hooks/useHijriSeason';
import { categoryById, DUA_CATEGORIES, DUA_LINKS, duasIn, type DuaCategory } from '@/lib/duas';
import { spacing } from '@/theme/tokens';
import { useTasbihReturn } from '@/store/tasbihReturn';

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
        <ListRow
          title="Tasbih"
          chevron
          onPress={() => router.push('/tasbih')}
          style={{ paddingHorizontal: spacing.md }}
        />
      </Card>
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
  const router = useRouter();
  const duas = duasIn(category.id);
  const scrollRef = useRef<ScrollView>(null);
  const listTop = useRef(0);
  const cardTops = useRef<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      const { scrollPast, setScrollPast } = useTasbihReturn.getState();
      if (!scrollPast) return;
      setScrollPast(null);
      const index = duas.findIndex((dua) => dua.id === scrollPast);
      if (index < 0) return;
      const next = duas[index + 1];
      if (!next) {
        scrollRef.current?.scrollToEnd({ animated: true });
        return;
      }
      const y = listTop.current + (cardTops.current[next.id] ?? 0) - spacing.md;
      scrollRef.current?.scrollTo({ y: Math.max(y, 0), animated: true });
    }, [duas]),
  );

  return (
    <Screen scroll edges={[]} scrollRef={scrollRef}>
      <Stack.Screen
        options={{ title: category.title, headerRight: () => <DuaOptionsButton /> }}
      />
      <View
        onLayout={(event) => {
          listTop.current = event.nativeEvent.layout.y;
        }}
        style={{ gap: spacing.lg, marginTop: spacing.md }}>
        {duas.map((dua) => (
          <View
            key={dua.id}
            onLayout={(event) => {
              cardTops.current[dua.id] = event.nativeEvent.layout.y;
            }}>
            <DuaCard
              dua={dua}
              footer={
                dua.id === DUA_LINKS.tasbih ? (
                  <Button
                    label="Tell med tasbih"
                    variant="secondary"
                    onPress={() => router.push({ pathname: '/tasbih', params: { from: 'duas' } })}
                  />
                ) : undefined
              }
            />
          </View>
        ))}
      </View>
    </Screen>
  );
}
