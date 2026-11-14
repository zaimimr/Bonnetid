import { useLocalSearchParams } from 'expo-router';
import { TasbihCounter } from '@/components/tasbih/TasbihCounter';
import { useTasbih } from '@/components/tasbih/useTasbih';
import { FeatureGate } from '@/components/FeatureGate';
import { FREE_ID } from '@/lib/tasbih';

function TasbihCountScreen() {
  const { series, from, resume } = useLocalSearchParams<{ series?: string; from?: string; resume?: string }>();
  const session = useTasbih(series ?? FREE_ID, resume === '1');
  return <TasbihCounter session={session} fromDuas={from === 'duas'} />;
}

export default function TasbihCountRoute() {
  return (
    <FeatureGate flag="tasbih">
      <TasbihCountScreen />
    </FeatureGate>
  );
}
