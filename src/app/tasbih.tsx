import { useLocalSearchParams } from 'expo-router';
import { TasbihLibrary } from '@/components/tasbih/TasbihLibrary';
import { FeatureGate } from '@/components/FeatureGate';

export default function TasbihLibraryRoute() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  return (
    <FeatureGate flag="tasbih">
      <TasbihLibrary from={from} />
    </FeatureGate>
  );
}
