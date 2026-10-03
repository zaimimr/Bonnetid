import { useLocalSearchParams } from 'expo-router';
import { RingVariant } from '@/components/tasbih/RingVariant';
import { TasbihShell } from '@/components/tasbih/TasbihShell';
import { useTasbih } from '@/components/tasbih/useTasbih';
import { FeatureGate } from '@/components/FeatureGate';

function TasbihScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const session = useTasbih();
  return (
    <TasbihShell session={session} fromDuas={from === 'duas'}>
      <RingVariant session={session} />
    </TasbihShell>
  );
}

export default function TasbihScreenRoute() {
  return (
    <FeatureGate flag="tasbih">
      <TasbihScreen />
    </FeatureGate>
  );
}
