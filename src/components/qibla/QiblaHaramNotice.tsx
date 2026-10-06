import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/lib/i18n';
import { AppText, Card } from '@/components/ui';
import { formatDistance } from '@/lib/geo';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

export type QiblaHaramNoticeProps = {
  distanceKm: number;
};

export function QiblaHaramNotice({ distanceKm }: QiblaHaramNoticeProps) {
  const theme = useTheme();

  return (
    <Card rounded="xl" style={{ alignItems: 'center', gap: spacing.md }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.full,
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Ionicons name="cube" size={30} color={theme.colors.onPrimarySoft} />
      </View>
      <AppText size="xl" weight="bold" heading align="center">
        {t({ nb: 'Du står ved Kaba', en: 'You are at the Kaaba', ar: 'أنت عند الكعبة', ur: 'آپ کعبہ کے پاس ہیں' })}
      </AppText>
      <AppText tone="textSecondary" align="center">
        {t({
          nb: `Omtrent ${formatDistance(distanceKm)} unna. Så nær er kompasset ubrukelig, fordi Kaba er smalere enn feilmarginen til GPS-en. Vend deg mot Kaba slik du ser den.`,
          en: `About ${formatDistance(distanceKm)} away. This close the compass is useless, because the Kaaba is narrower than the GPS margin of error. Face the Kaaba as you see it.`,
          ar: `على بعد ${formatDistance(distanceKm)} تقريبًا. على هذا القرب لا تفيد البوصلة، لأن الكعبة أضيق من هامش خطأ نظام تحديد المواقع. توجّه إلى الكعبة كما تراها.`,
          ur: `تقریباً ${formatDistance(distanceKm)} دور۔ اتنے قریب قطب نما کام نہیں آتا، کیونکہ کعبہ GPS کی غلطی کی حد سے چھوٹا ہے۔ کعبہ کو دیکھ کر اس کی طرف رخ کریں۔`,
        })}
      </AppText>
    </Card>
  );
}
