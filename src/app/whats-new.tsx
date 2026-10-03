import { View } from 'react-native';
import { Screen } from '@/components/ui';
import { WhatsNewList } from '@/components/whatsNew/WhatsNewList';
import { WHATS_NEW } from '@/lib/whatsNew';
import { spacing } from '@/theme/tokens';

export default function WhatsNewScreen() {
  return (
    <Screen scroll edges={[]}>
      <View style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}>
        <WhatsNewList entries={WHATS_NEW} />
      </View>
    </Screen>
  );
}
