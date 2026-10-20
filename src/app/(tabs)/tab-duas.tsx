import { FeatureGate } from '@/components/FeatureGate';
import { DuaHub } from '@/components/duas/DuaHub';
import { Screen } from '@/components/ui';

export default function DuasTab() {
  return (
    <FeatureGate flag="duas">
      <Screen scroll edges={[]}>
        <DuaHub />
      </Screen>
    </FeatureGate>
  );
}
