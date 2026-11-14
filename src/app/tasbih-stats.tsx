import { TasbihStats } from '@/components/tasbih/TasbihStats';
import { FeatureGate } from '@/components/FeatureGate';

export default function TasbihStatsRoute() {
  return (
    <FeatureGate flag="tasbih">
      <TasbihStats />
    </FeatureGate>
  );
}
