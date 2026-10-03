import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, Sheet } from '@/components/ui';
import { openStoreReview } from '@/lib/review';
import { appVersion, track } from '@/lib/telemetry';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

const STORE_LABEL = Platform.OS === 'ios' ? 'Vurder i App Store' : 'Vurder på Google Play';

export function ReviewSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const router = useRouter();
  const markReviewRequested = useSettings((state) => state.markReviewRequested);

  return (
    <Sheet visible={visible} onClose={onClose} title="Vurder Bønnetid">
      <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.xs }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {Array.from({ length: 5 }, (_, index) => (
            <Ionicons key={index} name="star" size={32} color={theme.colors.accent} />
          ))}
        </View>
        <AppText tone="textSecondary" align="center">
          En vurdering hjelper andre å finne Bønnetid.
        </AppText>
      </View>
      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
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
          label="Skriv til oss"
          variant="secondary"
          fullWidth
          onPress={() => {
            onClose();
            track('review_feedback_chosen');
            router.push('/feedback');
          }}
        />
      </View>
    </Sheet>
  );
}
