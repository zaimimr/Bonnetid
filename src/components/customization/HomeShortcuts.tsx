import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import Sortable from 'react-native-sortables';
import { Icon } from '@/components/icons';
import { AppText, Card, Divider, IconTile, ListRow, Sheet } from '@/components/ui';
import { FEATURES, useAvailableFeatures } from '@/components/customization/features';
import { MAX_SHORTCUTS, toggleSlot, type FeatureId } from '@/lib/customization';
import { track } from '@/lib/telemetry';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { t } from '@/lib/i18n';

const ADD = 'add';

const TILE = { flex: 1, alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md } as const;

export function HomeShortcuts({ editing = false }: { editing?: boolean }) {
  const router = useRouter();
  const theme = useTheme();
  const shortcuts = useSettings((state) => state.shortcuts);
  const setShortcuts = useSettings((state) => state.setShortcuts);
  const available = useAvailableFeatures();
  const visible = shortcuts.filter((id) => available.includes(id));
  const [adding, setAdding] = useState(false);

  const save = (next: FeatureId[]) => {
    setShortcuts(next);
    track('home_shortcuts_changed', { shortcuts: next.join(',') });
  };

  if (!editing) {
    if (visible.length === 0) return null;
    return (
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {visible.map((id) => {
          const feature = FEATURES[id];
          return (
            <Card
              key={id}
              padding="sm"
              rounded="xl"
              onPress={() => {
                track('home_shortcut_opened', { feature: id });
                router.push(feature.href);
              }}
              style={TILE}>
              <Icon name={feature.icon} size={24} color={theme.colors.primary} />
              <AppText size="xs" weight="medium" align="center" numberOfLines={1}>
                {feature.label}
              </AppText>
            </Card>
          );
        })}
      </View>
    );
  }

  const addable = available.filter((id) => !visible.includes(id));
  const data: string[] =
    visible.length < MAX_SHORTCUTS && addable.length > 0 ? [...visible, ADD] : visible;

  return (
    <>
      <Sortable.Grid
        columns={MAX_SHORTCUTS}
        data={data}
        keyExtractor={(id) => id}
        columnGap={spacing.sm}
        rowGap={spacing.sm}
        customHandle
        hapticsEnabled
        onDragEnd={({ data: next }) =>
          save(next.filter((id): id is FeatureId => id !== ADD))
        }
        renderItem={({ item }) => {
          if (item === ADD) {
            return (
              <Sortable.Handle mode="fixed-order">
                <Card
                  padding="sm"
                  rounded="xl"
                  onPress={() => setAdding(true)}
                  style={[TILE, { backgroundColor: theme.colors.surfaceSunken }]}>
                  <Icon name="plus-circle" size={24} color={theme.colors.primary} />
                  <AppText size="xs" weight="medium" align="center" numberOfLines={1} tone="textMuted">
                    {t('customize.add')}
                  </AppText>
                </Card>
              </Sortable.Handle>
            );
          }
          const id = item as FeatureId;
          const feature = FEATURES[id];
          return (
            <Sortable.Handle>
              <Card padding="sm" rounded="xl" style={TILE}>
                <Icon name={feature.icon} size={24} color={theme.colors.primary} />
                <AppText size="xs" weight="medium" align="center" numberOfLines={1}>
                  {feature.label}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t('customize.remove')}: ${feature.title}`}
                  hitSlop={8}
                  onPress={() => save(visible.filter((slot) => slot !== id))}
                  style={{ position: 'absolute', top: spacing.xs, left: spacing.xs }}>
                  <Icon name="minus-circle" size={20} color={theme.colors.danger} weight="fill" />
                </Pressable>
              </Card>
            </Sortable.Handle>
          );
        }}
      />

      <Sheet visible={adding} onClose={() => setAdding(false)} title={t('customize.addShortcut')}>
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
                const next = toggleSlot(visible, id, MAX_SHORTCUTS);
                save(next);
                if (next.length >= MAX_SHORTCUTS || addable.length === 1) setAdding(false);
              }}
            />
          </View>
        ))}
      </Sheet>
    </>
  );
}
