import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Divider, ListRow, Screen } from '@/components/ui';
import { useLocationAsrDefault, useMosqueAsrOverride } from '@/hooks/useEffectiveAsrMethod';
import { ASR_METHOD_OPTIONS, type AsrMethodOption } from '@/lib/asrMethods';
import { track } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { opacity, spacing } from '@/theme/tokens';
import { useSettings } from '@/store/settings';

export default function AsrMethodScreen() {
  const theme = useTheme();
  const mosque = useSettings((state) => state.mosque);
  const asrMethod = useSettings((state) => state.asrMethod);
  const setAsrMethod = useSettings((state) => state.setAsrMethod);
  const asrOverride = useMosqueAsrOverride();
  const asrLocationDefault = useLocationAsrDefault();

  const locked = asrOverride != null;
  const current = asrOverride ?? asrMethod ?? asrLocationDefault ?? 'shadow_1x';

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
          {`${mosque.name} bestemmer asr-metoden`}
        </AppText>
      )}
    </Screen>
  );
}
