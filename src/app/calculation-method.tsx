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
    ? t({
        nb: `${autoLabel}, vanlig i ${location.country}`,
        en: `${autoLabel}, common in ${location.country}`,
        ar: `${autoLabel}، الشائعة في ${location.country}`,
        ur: `${autoLabel}، ${location.country} میں عام`,
      })
    : autoLabel;

  return (
    <Screen scroll edges={[]}>
      <Card padding="sm" rounded="xl" style={{ marginTop: spacing.lg }}>
        <ListRow
          title={t({ nb: 'Automatisk', en: 'Automatic', ar: 'تلقائي', ur: 'خودکار' })}
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
        {t({
          nb: 'Appen velger metoden som brukes i landet du er i. Du kan overstyre den under.',
          en: 'The app picks the method used in the country you are in. You can override it below.',
          ar: 'يختار التطبيق الطريقة المعتمدة في البلد الذي أنت فيه. يمكنك تغييرها أدناه.',
          ur: 'ایپ وہ طریقہ منتخب کرتی ہے جو آپ کے موجودہ ملک میں رائج ہے۔ آپ اسے نیچے تبدیل کر سکتے ہیں۔',
        })}
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
        {t({
          nb: 'Metoden bestemmer solvinklene for fajr og isha. Den brukes bare når appen regner ut tidene selv, ikke for norske byer.',
          en: 'The method sets the sun angles for Fajr and Isha. It is only used when the app calculates the times itself, not for Norwegian cities.',
          ar: 'تحدد الطريقة زوايا الشمس للفجر والعشاء. ولا تُستخدم إلا عندما يحسب التطبيق الأوقات بنفسه، وليس للمدن النرويجية.',
          ur: 'یہ طریقہ فجر اور عشاء کے لیے سورج کے زاویے طے کرتا ہے۔ یہ صرف تب استعمال ہوتا ہے جب ایپ خود اوقات کا حساب لگاتی ہے، نارویجن شہروں کے لیے نہیں۔',
        })}
      </AppText>
    </Screen>
  );
}
