import { useLocalSearchParams } from 'expo-router';
import { SeriesEditor } from '@/components/tasbih/SeriesEditor';
import { FeatureGate } from '@/components/FeatureGate';

export default function TasbihSeriesRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <FeatureGate flag="tasbih">
      <SeriesEditor key={id ?? 'new'} id={id} />
    </FeatureGate>
  );
}
