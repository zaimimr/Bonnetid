import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Divider, ListRow, Screen } from '@/components/ui';
import {
  CALCULATION_METHOD_OPTIONS,
  type CalculationMethodOption,
} from '@/lib/calculationMethods';
import { track } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { useSettings } from '@/store/settings';

export default function CalculationMethodScreen() {
  const theme = useTheme();
  const current = useSettings((state) => state.calculationMethod);
  const setCalculationMethod = useSettings((state) => state.setCalculationMethod);

  const select = (option: CalculationMethodOption) => {
    setCalculationMethod(option.value);
    track('calculation_method_changed', { method: option.value });
  };

  return (
    <Screen scroll edges={[]}>
      <Card padding="sm" rounded="xl" style={{ marginTop: spacing.lg }}>
        {CALCULATION_METHOD_OPTIONS.map((option, index) => (
          <View key={option.value}>
            {index > 0 && <Divider />}
            <ListRow
              title={option.label}
              subtitle={option.description}
              trailing={
                option.value === current ? (
                  <Ionicons name="checkmark" size={22} color={theme.colors.primary} />
                ) : undefined
              }
              onPress={() => select(option)}
              style={{ paddingHorizontal: spacing.md }}
            />
          </View>
        ))}
      </Card>

      <AppText
        size="xs"
        tone="textMuted"
        style={{ marginTop: spacing.sm, paddingHorizontal: spacing.md }}>
        Metoden bestemmer solvinklene for fajr og isha. Den brukes bare når appen regner ut tidene
        selv, ikke for norske byer.
      </AppText>
    </Screen>
  );
}
