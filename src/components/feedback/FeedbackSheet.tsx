import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { t } from '@/lib/i18n';
import { Button, Sheet } from '@/components/ui';
import { openStoreReview } from '@/lib/review';
import { appVersion, track } from '@/lib/telemetry';
import { useSettings } from '@/store/settings';
import { spacing } from '@/theme/tokens';

const STORE_LABEL =
  Platform.OS === 'ios'
    ? t({ nb: 'Vurder i App Store', en: 'Rate on the App Store', ar: 'قيّم في App Store', ur: 'App Store پر درجہ بندی کریں' })
    : t({
        nb: 'Vurder på Google Play',
        en: 'Rate on Google Play',
        ar: 'قيّم في Google Play',
        ur: 'Google Play پر درجہ بندی کریں',
      });

const MESSAGES = t({ nb: 'Meldinger', en: 'Messages', ar: 'الرسائل', ur: 'پیغامات' });

export type FeedbackSheetProps = {
  visible: boolean;
  onClose: () => void;
  hasTicket: boolean;
  unread: number;
};

export function FeedbackSheet({ visible, onClose, hasTicket, unread }: FeedbackSheetProps) {
  const router = useRouter();
  const markReviewRequested = useSettings((state) => state.markReviewRequested);
  const messagesLabel = hasTicket
    ? unread > 0
      ? `${MESSAGES} (${unread})`
      : MESSAGES
    : t({ nb: 'Skriv til oss', en: 'Write to us', ar: 'راسلنا', ur: 'ہمیں لکھیں' });

  return (
    <Sheet visible={visible} onClose={onClose} title={t({ nb: 'Gi tilbakemelding', en: 'Give feedback', ar: 'أرسل ملاحظاتك', ur: 'رائے دیں' })}>
      <View style={{ gap: spacing.sm }}>
        <Button
          label={STORE_LABEL}
          fullWidth
          onPress={() => {
            onClose();
            markReviewRequested(appVersion());
            track('review_store_opened', { source: 'more' });
            openStoreReview();
          }}
        />
        <Button
          label={messagesLabel}
          variant="secondary"
          fullWidth
          onPress={() => {
            onClose();
            router.push('/feedback');
          }}
        />
      </View>
    </Sheet>
  );
}
