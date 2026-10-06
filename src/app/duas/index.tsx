import { useCallback, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { DuaCard } from '@/components/duas/DuaCard';
import { Button, EmptyState, Screen } from '@/components/ui';
import { categoryById, DUA_LINKS, duasIn, type DuaCategory } from '@/lib/duas';
import { spacing } from '@/theme/tokens';
import { useTasbihReturn } from '@/store/tasbihReturn';
import { FeatureGate } from '@/components/FeatureGate';
import { DuaHub, TasbihRow } from '@/components/duas/DuaHub';
import { useFeature } from '@/hooks/useFeature';
import { t } from '@/lib/i18n';

function DuasScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>();

  if (!category) return <CategoryList />;

  const selected = categoryById(category);
  if (!selected) {
    return (
      <Screen edges={[]}>
        <EmptyState message={t('duas.couldNotFindThis2')} icon="book-outline" />
      </Screen>
    );
  }
  return <CategoryReader key={selected.id} category={selected} />;
}

function CategoryList() {
  return (
    <Screen scroll edges={[]}>
      <DuaHub />
    </Screen>
  );
}

function CategoryReader({ category }: { category: DuaCategory }) {
  const router = useRouter();
  const tasbihEnabled = useFeature('tasbih');
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
      <Stack.Screen options={{ title: category.title }} />
      <View
        onLayout={(event) => {
          listTop.current = event.nativeEvent.layout.y;
        }}
        style={{ gap: spacing.lg, marginTop: spacing.md }}>
        {tasbihEnabled && category.id === 'after-salah' && <TasbihRow from="duas" />}
        {duas.map((dua) => (
          <View
            key={dua.id}
            onLayout={(event) => {
              cardTops.current[dua.id] = event.nativeEvent.layout.y;
            }}>
            <DuaCard
              dua={dua}
              footer={
                tasbihEnabled && dua.id === DUA_LINKS.tasbih ? (
                  <Button
                    label={t('duas.countWithTasbih')}
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

export default function DuasScreenRoute() {
  return (
    <FeatureGate flag="duas">
      <DuasScreen />
    </FeatureGate>
  );
}
