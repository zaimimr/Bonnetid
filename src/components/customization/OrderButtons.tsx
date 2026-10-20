import { View } from 'react-native';
import { IconButton } from '@/components/ui';
import { t } from '@/lib/i18n';

export function OrderButtons({
  label,
  canUp,
  canDown,
  onMove,
}: {
  label: string;
  canUp: boolean;
  canDown: boolean;
  onMove: (delta: number) => void;
}) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <IconButton
        name="caret-up"
        accessibilityLabel={`${t('customize.moveUp')}: ${label}`}
        disabled={!canUp}
        onPress={() => onMove(-1)}
      />
      <IconButton
        name="caret-down"
        accessibilityLabel={`${t('customize.moveDown')}: ${label}`}
        disabled={!canDown}
        onPress={() => onMove(1)}
      />
    </View>
  );
}
