import { useEffect } from 'react';
import { View } from 'react-native';
import { t } from '@/lib/i18n';
import { AppText, Button, Sheet } from '@/components/ui';
import { track } from '@/lib/telemetry';
import { useSession } from '@/store/session';
import { useOnboardingDone, useSettings } from '@/store/settings';
import { spacing } from '@/theme/tokens';
import { watchStatus } from '../../../modules/prayer-widget';

const WATCH_CHECK_DELAY_MS = 6000;

export function WatchAppHost() {
  const onboardingDone = useOnboardingDone();
  const seen = useSettings((state) => state.watchPromptSeen);
  const markSeen = useSettings((state) => state.markWatchPromptSeen);
  const openedFromNotification = useSession((state) => state.openedFromNotification);
  const interruption = useSession((state) => state.interruption);

  useEffect(() => {
    if (!onboardingDone || seen || openedFromNotification) return;
    const timer = setTimeout(() => {
      const status = watchStatus();
      if (!status?.paired || status.installed) return;
      if (!useSession.getState().claimInterruption('watch_app')) return;
      track('watch_app_prompt_shown');
    }, WATCH_CHECK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [onboardingDone, seen, openedFromNotification]);

  return (
    <Sheet visible={interruption === 'watch_app' && !seen} onClose={markSeen} title={t('common.watchApp.title')}>
      <View style={{ gap: spacing.md }}>
        <AppText>{t('common.watchApp.body')}</AppText>
        <AppText tone="textMuted">{t('common.watchApp.steps')}</AppText>
        <Button label={t('common.watchApp.ok')} fullWidth onPress={markSeen} />
      </View>
    </Sheet>
  );
}
