import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PostHogMaskView } from 'posthog-react-native';
import { Card, Divider, ListRow } from '@/components/ui';
import { ROW, SettingsPage } from '@/components/settings/shared';
import { useTheme } from '@/theme';
import { asrMethodLabel } from '@/lib/asrMethods';
import { calculationMethodLabel } from '@/lib/calculationMethods';
import { useMosqueAsrOverride } from '@/hooks/useEffectiveAsrMethod';
import { useAutoCalculationMethod } from '@/hooks/useEffectiveCalculationMethod';
import { useActiveLocation, useActiveMosque, useSettings } from '@/store/settings';
import { t } from '@/lib/i18n';

export default function PrayerTimesSettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const location = useActiveLocation();
  const calculationMethod = useSettings((state) => state.calculationMethod);
  const autoCalculationMethod = useAutoCalculationMethod(location);
  const calculated = location.mode === 'calculated';
  const mosque = useActiveMosque();
  const asrMethod = useSettings((state) => state.asrMethod);
  const asrOverride = useMosqueAsrOverride();

  return (
    <SettingsPage>
      <Card padding="sm" rounded="xl">
        <PostHogMaskView>
          <ListRow
            title={t({ nb: 'Sted', en: 'Location', ar: 'الموقع', ur: 'مقام' })}
            subtitle={
              calculated
                ? t({
                    nb: `${location.name} · lokale tider, følger posisjonen din`,
                    en: `${location.name} · local times, follows your location`,
                    ar: `${location.name} · أوقات محلية، يتبع موقعك`,
                    ur: `${location.name} · مقامی اوقات، آپ کے مقام کے مطابق`,
                  })
                : t({
                    nb: `${location.name} · følger posisjonen din`,
                    en: `${location.name} · follows your location`,
                    ar: `${location.name} · يتبع موقعك`,
                    ur: `${location.name} · آپ کے مقام کے مطابق`,
                  })
            }
            leading={<Ionicons name="location-outline" size={20} color={theme.colors.primary} />}
            style={ROW}
          />
        </PostHogMaskView>
        {!calculated && (
          <>
            <Divider />
            <ListRow
              title={t({ nb: 'Min moské', en: 'My mosque', ar: 'مسجدي', ur: 'میری مسجد' })}
              subtitle={mosque?.name ?? t({ nb: 'Ikke valgt', en: 'Not selected', ar: 'غير محدد', ur: 'منتخب نہیں' })}
              leading={<Ionicons name="business-outline" size={20} color={theme.colors.primary} />}
              chevron
              onPress={() => router.push('/mosque-picker')}
              style={ROW}
            />
          </>
        )}
        <Divider />
        <ListRow
          title={t({ nb: 'Asr-metode', en: 'Asr method', ar: 'طريقة العصر', ur: 'عصر کا طریقہ' })}
          subtitle={
            asrOverride && mosque
              ? t({
                  nb: `Styres av ${mosque.name}`,
                  en: `Set by ${mosque.name}`,
                  ar: `يحددها ${mosque.name}`,
                  ur: `${mosque.name} کی طرف سے طے شدہ`,
                })
              : asrMethodLabel(asrMethod ?? 'irn')
          }
          leading={<Ionicons name="partly-sunny-outline" size={20} color={theme.colors.primary} />}
          chevron
          onPress={() => router.push('/asr-method')}
          style={ROW}
        />
        {calculated && (
          <>
            <Divider />
            <ListRow
              title={t({ nb: 'Beregningsmetode', en: 'Calculation method', ar: 'طريقة الحساب', ur: 'حساب کا طریقہ' })}
              subtitle={
                calculationMethod
                  ? calculationMethodLabel(calculationMethod)
                  : `${t({ nb: 'Automatisk', en: 'Automatic', ar: 'تلقائي', ur: 'خودکار' })} · ${calculationMethodLabel(autoCalculationMethod)}`
              }
              leading={<Ionicons name="calculator-outline" size={20} color={theme.colors.primary} />}
              chevron
              onPress={() => router.push('/calculation-method')}
              style={ROW}
            />
          </>
        )}
      </Card>
    </SettingsPage>
  );
}
