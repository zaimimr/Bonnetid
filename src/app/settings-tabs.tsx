import { AppText, Button } from '@/components/ui';
import { SettingsPage } from '@/components/settings/shared';
import { FeaturePicker } from '@/components/customization/FeaturePicker';
import { DEFAULT_TAB_SLOTS, MAX_TAB_SLOTS, type FeatureId } from '@/lib/customization';
import { track } from '@/lib/telemetry';
import { useSettings } from '@/store/settings';
import { spacing } from '@/theme/tokens';
import { t } from '@/lib/i18n';

export default function TabSettingsScreen() {
  const tabSlots = useSettings((state) => state.tabSlots);
  const setTabSlots = useSettings((state) => state.setTabSlots);

  const save = (next: FeatureId[]) => {
    setTabSlots(next);
    track('tab_layout_changed', { tabs: next.join(',') });
  };

  return (
    <SettingsPage>
      <AppText size="sm" tone="textMuted" style={{ paddingHorizontal: spacing.md }}>
        {t('customize.chooseUpTo', { count: MAX_TAB_SLOTS })}
      </AppText>
      <FeaturePicker value={tabSlots} max={MAX_TAB_SLOTS} onChange={save} />
      <Button
        label={t('customize.reset')}
        variant="secondary"
        onPress={() => save(DEFAULT_TAB_SLOTS)}
      />
    </SettingsPage>
  );
}
