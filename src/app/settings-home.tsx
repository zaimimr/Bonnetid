import { View } from 'react-native';
import { AppText, Button, Card, Divider, ListRow, Toggle } from '@/components/ui';
import { ROW, SettingsPage } from '@/components/settings/shared';
import { FeaturePicker } from '@/components/customization/FeaturePicker';
import { OrderButtons } from '@/components/customization/OrderButtons';
import {
  DEFAULT_HOME_LAYOUT,
  DEFAULT_SHORTCUTS,
  LOCKED_HOME_BLOCKS,
  MAX_SHORTCUTS,
  moveHomeBlock,
  setHomeBlockVisible,
  type FeatureId,
  type HomeBlock,
  type HomeBlockId,
} from '@/lib/customization';
import { track } from '@/lib/telemetry';
import { useSettings } from '@/store/settings';
import { spacing } from '@/theme/tokens';
import { t } from '@/lib/i18n';

const BLOCK_LABELS: Record<HomeBlockId, string> = {
  'next-prayer': t('customize.block.nextPrayer'),
  shortcuts: t('customize.block.shortcuts'),
  'after-prayer': t('customize.block.afterPrayer'),
  announcement: t('customize.block.announcement'),
  season: t('customize.block.season'),
  night: t('customize.block.night'),
  'prayer-times': t('customize.block.prayerTimes'),
  'special-days': t('customize.block.specialDays'),
};

function SectionLabel({ children }: { children: string }) {
  return (
    <AppText size="sm" weight="semibold" tone="textSecondary" style={{ paddingHorizontal: spacing.md }}>
      {children}
    </AppText>
  );
}

export default function HomeSettingsScreen() {
  const homeLayout = useSettings((state) => state.homeLayout);
  const setHomeLayout = useSettings((state) => state.setHomeLayout);
  const shortcuts = useSettings((state) => state.shortcuts);
  const setShortcuts = useSettings((state) => state.setShortcuts);
  const shortcutsVisible = homeLayout.some((block) => block.id === 'shortcuts' && block.visible);

  const saveLayout = (next: HomeBlock[]) => {
    setHomeLayout(next);
    track('home_layout_changed', {
      blocks: next.filter((block) => block.visible).map((block) => block.id).join(','),
    });
  };

  const saveShortcuts = (next: FeatureId[]) => {
    setShortcuts(next);
    track('home_shortcuts_changed', { shortcuts: next.join(',') });
  };

  return (
    <SettingsPage>
      <SectionLabel>{t('customize.cards')}</SectionLabel>
      <Card padding="sm" rounded="xl">
        {homeLayout.map((block, index) => {
          const label = BLOCK_LABELS[block.id];
          const locked = LOCKED_HOME_BLOCKS.includes(block.id);
          return (
            <View key={block.id}>
              {index > 0 && <Divider />}
              <ListRow
                title={label}
                trailing={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <OrderButtons
                      label={label}
                      canUp={index > 0}
                      canDown={index < homeLayout.length - 1}
                      onMove={(delta) => saveLayout(moveHomeBlock(homeLayout, block.id, delta))}
                    />
                    <Toggle
                      value={block.visible}
                      disabled={locked}
                      accessibilityLabel={label}
                      onValueChange={(visible) =>
                        saveLayout(setHomeBlockVisible(homeLayout, block.id, visible))
                      }
                    />
                  </View>
                }
                style={ROW}
              />
            </View>
          );
        })}
      </Card>

      {shortcutsVisible && (
        <>
          <SectionLabel>{t('customize.shortcuts')}</SectionLabel>
          <AppText size="sm" tone="textMuted" style={{ paddingHorizontal: spacing.md }}>
            {t('customize.chooseUpTo', { count: MAX_SHORTCUTS })}
          </AppText>
          <FeaturePicker value={shortcuts} max={MAX_SHORTCUTS} onChange={saveShortcuts} />
        </>
      )}

      <Button
        label={t('customize.reset')}
        variant="secondary"
        onPress={() => {
          saveLayout(DEFAULT_HOME_LAYOUT);
          saveShortcuts(DEFAULT_SHORTCUTS);
        }}
      />
    </SettingsPage>
  );
}
