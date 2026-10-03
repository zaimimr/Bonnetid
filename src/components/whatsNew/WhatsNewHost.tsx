import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Sheet } from '@/components/ui';
import { WhatsNewList } from './WhatsNewList';
import { openStoreReview } from '@/lib/review';
import { appVersion, track } from '@/lib/telemetry';
import { pendingWhatsNew, WHATS_NEW } from '@/lib/whatsNew';
import { useSession } from '@/store/session';
import { useOnboardingDone, useSettings } from '@/store/settings';
import { spacing } from '@/theme/tokens';

export function WhatsNewHost() {
  const onboardingDone = useOnboardingDone();
  const lastSeen = useSettings((state) => state.lastSeenWhatsNew);
  const setLastSeen = useSettings((state) => state.setLastSeenWhatsNew);
  const openedFromNotification = useSession((state) => state.openedFromNotification);
  const interruption = useSession((state) => state.interruption);
  const [dismissed, setDismissed] = useState(false);
  const current = appVersion();
  const pending = pendingWhatsNew(WHATS_NEW, lastSeen, current);
  const hasPending = pending.length > 0;

  useEffect(() => {
    if (!onboardingDone || openedFromNotification || !hasPending) return;
    if (!useSession.getState().claimInterruption('whats_new')) return;
    track('whats_new_shown', { version: current });
  }, [onboardingDone, openedFromNotification, hasPending, current]);

  const close = () => {
    setDismissed(true);
    setLastSeen(current);
  };

  return (
    <Sheet visible={interruption === 'whats_new' && !dismissed} onClose={close} title="Hva er nytt">
      <WhatsNewList entries={pending} onNavigate={close} />
      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        <Button
          label="Gi Bønnetid en vurdering"
          variant="secondary"
          fullWidth
          onPress={() => {
            track('whats_new_review_tapped');
            openStoreReview();
          }}
        />
        <Button label="Fortsett" fullWidth onPress={close} />
      </View>
    </Sheet>
  );
}
