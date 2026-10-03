import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { useFeature } from '@/hooks/useFeature';
import type { FeatureFlag } from '@/lib/featureFlags';

export function FeatureGate({ flag, children }: { flag: FeatureFlag; children: ReactNode }) {
  const enabled = useFeature(flag);
  const router = useRouter();

  useEffect(() => {
    if (enabled) return;
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [enabled, router]);

  return enabled ? children : null;
}
