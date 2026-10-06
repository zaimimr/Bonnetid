import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Divider, ListRow, Screen } from '@/components/ui';
import { useMosqueAsrOverride } from '@/hooks/useEffectiveAsrMethod';
import { ASR_METHOD_OPTIONS, type AsrMethodOption } from '@/lib/asrMethods';
import { track } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { opacity, spacing } from '@/theme/tokens';
import { useActiveMosque, useSettings } from '@/store/settings';
import { t } from '@/lib/i18n';

export default function AsrMethodScreen() {
  const theme = useTheme();
  const mosque = useActiveMosque();
  const asrMethod = useSettings((state) => state.asrMethod);
  const setAsrMethod = useSettings((state) => state.setAsrMethod);
  const asrOverride = useMosqueAsrOverride();

  const locked = asrOverride != null;
  const current = asrOverride ?? asrMethod ?? 'irn';

  const select = (option: AsrMethodOption) => {
    if (locked) return;
    setAsrMethod(option.value);
    track('asr_method_changed', { method: option.value });
  };

  return (
    <Screen scroll edges={[]}>
      <Card padding="sm" rounded="xl" style={{ marginTop: spacing.lg, opacity: locked ? opacity.disabled : 1 }}>
        {ASR_METHOD_OPTIONS.map((option, index) => (
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
              onPress={locked ? undefined : () => select(option)}
              style={{ paddingHorizontal: spacing.md }}
            />
          </View>
        ))}
      </Card>

      {locked && mosque && (
        <AppText
          size="xs"
          tone="textMuted"
          style={{ marginTop: spacing.sm, paddingHorizontal: spacing.md }}>
          {t({
            nb: `${mosque.name} bestemmer asr-metoden`,
            en: `${mosque.name} sets the Asr method`,
            ar: `${mosque.name} يحدد طريقة حساب العصر`,
            ur: `${mosque.name} عصر کا طریقہ طے کرتی ہے`,
          })}
        </AppText>
      )}
    </Screen>
  );
}
