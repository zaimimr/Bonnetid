import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import type { AnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';
import { Icon } from '@/components/icons';
import { AppText, Button, Divider, IconTile, ListRow, Sheet } from '@/components/ui';
import { EditableBlock } from '@/components/customization/EditableBlock';
import { HOME_BLOCKS } from '@/components/customization/features';
import {
  addHomeBlock,
  DEFAULT_HOME_LAYOUT,
  DEFAULT_SHORTCUTS,
  DEFAULT_TAB_SLOTS,
  LOCKED_HOME_BLOCKS,
  orderHomeBlocks,
  setHomeBlockVisible,
  type HomeBlock,
  type HomeBlockId,
} from '@/lib/customization';
import { track } from '@/lib/telemetry';
import { useHomeEdit } from '@/store/homeEdit';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { t } from '@/lib/i18n';

export function HomeEditor({
  blocks,
  scrollRef,
}: {
  blocks: Record<HomeBlockId, ReactNode>;
  scrollRef: AnimatedRef<any>;
}) {
  const theme = useTheme();
  const homeLayout = useSettings((state) => state.homeLayout);
  const setHomeLayout = useSettings((state) => state.setHomeLayout);
  const setShortcuts = useSettings((state) => state.setShortcuts);
  const setTabSlots = useSettings((state) => state.setTabSlots);
  const setEditing = useHomeEdit((state) => state.setEditing);
  const [adding, setAdding] = useState(false);
  const shown = homeLayout.filter((block) => block.visible).map((block) => block.id);
  const hidden = homeLayout.filter((block) => !block.visible).map((block) => block.id);

  const save = (next: HomeBlock[]) => {
    setHomeLayout(next);
    track('home_layout_changed', {
      blocks: next.filter((block) => block.visible).map((block) => block.id).join(','),
    });
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <AppText size="xl" weight="bold" heading style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }}>
          {t('customize.customize')}
        </AppText>
        <Button label={t('customize.done')} size="sm" onPress={() => setEditing(false)} />
      </View>

      <Sortable.Grid
        columns={1}
        data={shown}
        keyExtractor={(id) => id}
        rowGap={spacing.xl}
        customHandle
        hapticsEnabled
        scrollableRef={scrollRef}
        onDragEnd={({ data }) => save(orderHomeBlocks(homeLayout, data))}
        renderItem={({ item }) => (
          <EditableBlock
            label={HOME_BLOCKS[item].label}
            icon={HOME_BLOCKS[item].icon}
            interactive={item === 'shortcuts'}
            onRemove={
              LOCKED_HOME_BLOCKS.includes(item)
                ? undefined
                : () => save(setHomeBlockVisible(homeLayout, item, false))
            }>
            {blocks[item]}
          </EditableBlock>
        )}
      />

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button
          label={t('customize.addCard')}
          variant="secondary"
          disabled={hidden.length === 0}
          onPress={() => setAdding(true)}
          style={{ flexGrow: 1, flexBasis: 0 }}
        />
        <Button
          label={t('customize.reset')}
          variant="ghost"
          onPress={() => {
            save(DEFAULT_HOME_LAYOUT);
            setShortcuts(DEFAULT_SHORTCUTS);
            setTabSlots(DEFAULT_TAB_SLOTS);
          }}
          style={{ flexGrow: 1, flexBasis: 0 }}
        />
      </View>

      <Sheet visible={adding} onClose={() => setAdding(false)} title={t('customize.addCard')}>
        {hidden.map((id, index) => (
          <View key={id}>
            {index > 0 && <Divider />}
            <ListRow
              title={HOME_BLOCKS[id].label}
              leading={
                <IconTile>
                  <Icon name={HOME_BLOCKS[id].icon} size={20} color={theme.colors.primary} />
                </IconTile>
              }
              trailing={<Icon name="plus-circle" size={24} color={theme.colors.primary} weight="fill" />}
              onPress={() => {
                save(addHomeBlock(homeLayout, id));
                if (hidden.length === 1) setAdding(false);
              }}
            />
          </View>
        ))}
      </Sheet>
    </View>
  );
}
