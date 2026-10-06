import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Divider, ListRow, Screen } from '@/components/ui';
import { useAutoCalculationMethod } from '@/hooks/useEffectiveCalculationMethod';
import {
  CALCULATION_METHOD_OPTIONS,
  calculationMethodLabel,
  type CalculationMethodKey,
} from '@/lib/calculationMethods';
import { track } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { useActiveLocation, useSettings } from '@/store/settings';
import { t } from '@/lib/i18n';

export default function CalculationMethodScreen() {
  const theme = useTheme();
  const location = useActiveLocation();
  const chosen = useSettings((state) => state.calculationMethod);
  const setCalculationMethod = useSettings((state) => state.setCalculationMethod);
  const autoMethod = useAutoCalculationMethod(location);

  const select = (method: CalculationMethodKey | null) => {
    setCalculationMethod(method);
    track('calculation_method_changed', { method: method ?? 'auto' });
  };

  const checkmark = <Ionicons name="checkmark" size={22} color={theme.colors.primary} />;
  const autoLabel = calculationMethodLabel(autoMethod);
  const autoSubtitle = location.country
    ? t('settings.commonIn', { autoLabel, country: location.country })
    : autoLabel;

  return (
    <Screen scroll edges={[]}>
      <Card padding="sm" rounded="xl" style={{ marginTop: spacing.lg }}>
        <ListRow
          title={t('settings.automatic')}
          subtitle={autoSubtitle}
          trailing={chosen == null ? checkmark : undefined}
          onPress={() => select(null)}
          style={{ paddingHorizontal: spacing.md }}
        />
      </Card>

      <AppText
        size="xs"
        tone="textMuted"
        style={{ marginTop: spacing.sm, paddingHorizontal: spacing.md }}>
        {t('settings.theAppPicksThe')}
      </AppText>

      <Card padding="sm" rounded="xl" style={{ marginTop: spacing.lg }}>
        {CALCULATION_METHOD_OPTIONS.map((option, index) => (
          <View key={option.value}>
            {index > 0 && <Divider />}
            <ListRow
              title={option.label}
              subtitle={option.description}
              trailing={option.value === chosen ? checkmark : undefined}
              onPress={() => select(option.value)}
              style={{ paddingHorizontal: spacing.md }}
            />
          </View>
        ))}
      </Card>

      <AppText
        size="xs"
        tone="textMuted"
        style={{ marginTop: spacing.sm, paddingHorizontal: spacing.md }}>
        {t('settings.theMethodSetsThe')}
      </AppText>
    </Screen>
  );
}
