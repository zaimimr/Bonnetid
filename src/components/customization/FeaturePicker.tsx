import { View } from 'react-native';
import { Icon } from '@/components/icons';
import { Card, Divider, IconTile, ListRow, Toggle } from '@/components/ui';
import { ROW } from '@/components/settings/shared';
import { FEATURES, useAvailableFeatures } from '@/components/customization/features';
import { OrderButtons } from '@/components/customization/OrderButtons';
import { moveSlot, toggleSlot, type FeatureId } from '@/lib/customization';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

export function FeaturePicker({
  value,
  max,
  onChange,
}: {
  value: FeatureId[];
  max: number;
  onChange: (next: FeatureId[]) => void;
}) {
  const theme = useTheme();
  const available = useAvailableFeatures();
  const selected = value.filter((id) => available.includes(id));
  const rows = [...selected, ...available.filter((id) => !selected.includes(id))];

  return (
    <Card padding="sm" rounded="xl">
      {rows.map((id, index) => {
        const feature = FEATURES[id];
        const on = selected.includes(id);
        const position = selected.indexOf(id);
        return (
          <View key={id}>
            {index > 0 && <Divider />}
            <ListRow
              title={feature.title}
              leading={
                <IconTile>
                  <Icon name={feature.icon} size={20} color={theme.colors.primary} />
                </IconTile>
              }
              trailing={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  {on && (
                    <OrderButtons
                      label={feature.title}
                      canUp={position > 0}
                      canDown={position < selected.length - 1}
                      onMove={(delta) => onChange(moveSlot(selected, id, delta))}
                    />
                  )}
                  <Toggle
                    value={on}
                    disabled={!on && selected.length >= max}
                    accessibilityLabel={feature.title}
                    onValueChange={() => onChange(toggleSlot(selected, id, max))}
                  />
                </View>
              }
              style={ROW}
            />
          </View>
        );
      })}
    </Card>
  );
}
