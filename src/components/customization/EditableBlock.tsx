import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Sortable from 'react-native-sortables';
import { Icon, type IconName } from '@/components/icons';
import { AppText, Card } from '@/components/ui';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { t } from '@/lib/i18n';

export function EditableBlock({
  label,
  icon,
  onRemove,
  interactive = false,
  children,
}: {
  label: string;
  icon: IconName;
  onRemove?: () => void;
  interactive?: boolean;
  children: ReactNode;
}) {
  const theme = useTheme();
  const [empty, setEmpty] = useState(false);

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
      {onRemove && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('customize.remove')}: ${label}`}
          hitSlop={10}
          onPress={onRemove}>
          <Icon name="minus-circle" size={24} color={theme.colors.danger} weight="fill" />
        </Pressable>
      )}
      <AppText
        size="sm"
        weight="semibold"
        tone="textSecondary"
        numberOfLines={1}
        style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }}>
        {label}
      </AppText>
      <View
        accessible
        accessibilityLabel={`${t('customize.drag')}: ${label}`}
        style={{ padding: spacing.xs }}>
        <Icon name="dots-six-vertical" size={24} color={theme.colors.textMuted} />
      </View>
    </View>
  );

  const content = (
    <>
      <View
        pointerEvents={interactive ? 'auto' : 'none'}
        onLayout={(event) => setEmpty(event.nativeEvent.layout.height === 0)}
        style={{ gap: spacing.lg }}>
        {children}
      </View>
      {empty && (
        <Card
          rounded="xl"
          padding="md"
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Icon name={icon} size={24} color={theme.colors.primary} />
          <AppText size="sm" tone="textMuted" style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }}>
            {t('customize.showsWhenRelevant')}
          </AppText>
        </Card>
      )}
    </>
  );

  return interactive ? (
    <View>
      <Sortable.Handle>{header}</Sortable.Handle>
      {content}
    </View>
  ) : (
    <Sortable.Handle>
      {header}
      {content}
    </Sortable.Handle>
  );
}
