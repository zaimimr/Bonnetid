import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Sheet } from '@/components/ui';
import { openStoreReview } from '@/lib/review';
import { appVersion, track } from '@/lib/telemetry';
import { useSettings } from '@/store/settings';
import { spacing } from '@/theme/tokens';

const STORE_LABEL = Platform.OS === 'ios' ? 'Vurder i App Store' : 'Vurder på Google Play';

export type FeedbackSheetProps = {
  visible: boolean;
  onClose: () => void;
  hasTicket: boolean;
  unread: number;
};

export function FeedbackSheet({ visible, onClose, hasTicket, unread }: FeedbackSheetProps) {
  const router = useRouter();
  const markReviewRequested = useSettings((state) => state.markReviewRequested);
  const messagesLabel = hasTicket ? (unread > 0 ? `Meldinger (${unread})` : 'Meldinger') : 'Skriv til oss';

  return (
    <Sheet visible={visible} onClose={onClose} title="Gi tilbakemelding">
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
