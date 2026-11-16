import { View } from 'react-native';
import type { PrayerDay } from '@/api/types';
import { useMosque } from '@/api/queries';
import { Icon } from '@/components/icons';
import { MosqueLogo } from '@/components/mosque/MosqueLogo';
import { AppText, Card, Divider, ListRow, Screen } from '@/components/ui';
import { useMosqueAsrOverride } from '@/hooks/useEffectiveAsrMethod';
import { useNow } from '@/hooks/useNow';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import { ASR_METHOD_OPTIONS, asrMethodLabel, type AsrMethodOption } from '@/lib/asrMethods';
import { asrTimeFor } from '@/lib/prayerSchedule';
import { track } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { opacity, spacing } from '@/theme/tokens';
import { useActiveMosque, useSettings, type AsrMethodPreference } from '@/store/settings';
import { t } from '@/lib/i18n';

function methodLine(day: PrayerDay, method: AsrMethodPreference): string {
  if (method !== 'irn') return asrMethodLabel(method);
  if (day.asr === day.shadow_2x) return t('settings.asrIrnWinterNow');
  if (day.asr === day.shadow_1x) return t('settings.asrIrnSummerNow');
  return asrMethodLabel(method);
}

export default function AsrMethodScreen() {
  const theme = useTheme();
  const mosque = useActiveMosque();
  const { data: mosqueData } = useMosque(mosque?.orgNr ?? '', { enabled: mosque != null });
  const asrMethod = useSettings((state) => state.asrMethod);
  const setAsrMethod = useSettings((state) => state.setAsrMethod);
  const asrOverride = useMosqueAsrOverride();
  const now = useNow(60_000);
  const { today } = usePrayerDay(now);

  const locked = asrOverride != null;
  const current = asrOverride ?? asrMethod ?? 'irn';
  const asrToday = today ? asrTimeFor(today, current) : null;

  const select = (option: AsrMethodOption) => {
    if (locked) return;
    setAsrMethod(option.value);
    track('asr_method_changed', { method: option.value });
  };

  return (
    <Screen scroll edges={[]}>
      {(asrToday || (locked && mosque)) && (
        <Card rounded="xl" style={{ marginTop: spacing.lg, gap: spacing.md }}>
          {locked && mosque && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <MosqueLogo uri={mosqueData?.logo ?? null} size="sm" />
              <View style={{ flex: 1 }}>
                <AppText size="md" weight="semibold">
                  {mosque.name}
                </AppText>
                <AppText size="xs" weight="medium" tone="primary">
                  {t('settings.mosqueChoseAsrMethod')}
                </AppText>
              </View>
            </View>
          )}
          {today && asrToday && (
            <View>
              <AppText size="sm" weight="semibold" tone="textMuted">
                {t('settings.asrToday')}
              </AppText>
              <AppText size="display" weight="bold" tabular>
                {asrToday}
              </AppText>
              <AppText size="sm" tone="textMuted">
                {methodLine(today, current)}
              </AppText>
            </View>
          )}
        </Card>
      )}

      <Card padding="sm" rounded="xl" style={{ marginTop: spacing.lg, opacity: locked ? opacity.disabled : 1 }}>
        {ASR_METHOD_OPTIONS.map((option, index) => (
          <View key={option.value}>
            {index > 0 && <Divider />}
            <ListRow
              title={option.label}
              subtitle={option.description}
              trailing={
                option.value === current ? (
                  <Icon name="check" size={22} color={theme.colors.primary} />
                ) : undefined
              }
              onPress={locked ? undefined : () => select(option)}
              style={{ paddingHorizontal: spacing.md }}
            />
          </View>
        ))}
      </Card>
    </Screen>
  );
}
