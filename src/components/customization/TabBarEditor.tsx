import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Sortable from 'react-native-sortables';
import { Icon } from '@/components/icons';
import { AppText, Divider, IconTile, ListRow, Sheet } from '@/components/ui';
import { FEATURES, useAvailableFeatures } from '@/components/customization/features';
import { MAX_TAB_SLOTS, toggleSlot, type FeatureId } from '@/lib/customization';
import { track } from '@/lib/telemetry';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { t } from '@/lib/i18n';

const ADD = 'add';
const PILL_WIDTH = 64;
const PILL_HEIGHT = 32;

function TabCell({
  icon,
  label,
  color,
  accessibilityLabel,
  dimmed = false,
}: {
  icon: ReactNode;
  label: string;
  color: string;
  accessibilityLabel?: string;
  dimmed?: boolean;
}) {
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      style={{ alignItems: 'center', gap: spacing.xs, opacity: dimmed ? 0.4 : 1 }}>
      <View
        style={{
          width: PILL_WIDTH,
          height: PILL_HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {icon}
      </View>
      <AppText size="xs" weight="medium" color={color} align="center" numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

export function TabBarEditor({ bottomInset }: { bottomInset: number }) {
  const theme = useTheme();
  const tabSlots = useSettings((state) => state.tabSlots);
  const setTabSlots = useSettings((state) => state.setTabSlots);
  const available = useAvailableFeatures();
  const [adding, setAdding] = useState(false);
  const slots = tabSlots.filter((id) => available.includes(id));
  const addable = available.filter((id) => !slots.includes(id));
  const data: string[] =
    slots.length < MAX_TAB_SLOTS && addable.length > 0 ? [...slots, ADD] : slots;
  const muted = theme.colors.tabBarInactive;

  const save = (next: FeatureId[]) => {
    setTabSlots(next);
    track('tab_layout_changed', { tabs: next.join(',') });
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.tabBarBackground,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: spacing.md,
        paddingBottom: Math.max(bottomInset, spacing.md),
      }}>
      <View style={{ flex: 1 }}>
        <TabCell
          icon={<Icon name="house" size={22} color={muted} />}
          label={t('navigation.today')}
          color={muted}
          dimmed
        />
      </View>
      <View style={{ flex: data.length }}>
        <Sortable.Grid
          key={data.length}
          columns={data.length}
          data={data}
          keyExtractor={(id) => id}
          customHandle
          hapticsEnabled
          onDragEnd={({ data: next }) => save(next.filter((id): id is FeatureId => id !== ADD))}
          renderItem={({ item }) => {
            if (item === ADD) {
              return (
                <Sortable.Handle mode="fixed-order">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('customize.addTab')}
                    onPress={() => setAdding(true)}>
                    <TabCell
                      icon={<Icon name="plus-circle" size={24} color={theme.colors.primary} />}
                      label={t('customize.add')}
                      color={theme.colors.primary}
                    />
                  </Pressable>
                </Sortable.Handle>
              );
            }
            const id = item as FeatureId;
            const feature = FEATURES[id];
            return (
              <Sortable.Handle>
                <View style={{ alignItems: 'center' }}>
                  <TabCell
                    icon={<Icon name={feature.icon} size={22} color={theme.colors.textPrimary} />}
                    label={feature.label}
                    color={theme.colors.textPrimary}
                    accessibilityLabel={`${t('customize.drag')}: ${feature.label}`}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t('customize.remove')}: ${feature.label}`}
                    hitSlop={8}
                    onPress={() => save(slots.filter((slot) => slot !== id))}
                    style={{ position: 'absolute', top: 0, start: spacing.sm }}>
                    <Icon name="minus-circle" size={20} color={theme.colors.danger} weight="fill" />
                  </Pressable>
                </View>
              </Sortable.Handle>
            );
          }}
        />
      </View>
      <View style={{ flex: 1 }}>
        <TabCell
          icon={<Icon name="squares-four" size={22} color={muted} />}
          label={t('navigation.more')}
          color={muted}
          dimmed
        />
      </View>

      <Sheet visible={adding} onClose={() => setAdding(false)} title={t('customize.addTab')}>
        {addable.map((id, index) => (
          <View key={id}>
            {index > 0 && <Divider />}
            <ListRow
              title={FEATURES[id].title}
              leading={
                <IconTile>
                  <Icon name={FEATURES[id].icon} size={20} color={theme.colors.primary} />
                </IconTile>
              }
              trailing={<Icon name="plus-circle" size={24} color={theme.colors.primary} weight="fill" />}
              onPress={() => {
                const next = toggleSlot(slots, id, MAX_TAB_SLOTS);
                save(next);
                if (next.length >= MAX_TAB_SLOTS || addable.length === 1) setAdding(false);
              }}
            />
          </View>
        ))}
      </Sheet>
    </View>
  );
}
