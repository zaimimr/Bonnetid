import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { IconButton } from './IconButton';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityLabel="Lukk"
          onPress={onClose}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: theme.colors.overlay }}
        />
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingTop: spacing.lg,
            paddingHorizontal: spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
            maxHeight: '85%',
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md }}>
            <AppText size="xl" weight="bold" heading style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }}>
              {title}
            </AppText>
            <IconButton name="close" accessibilityLabel="Lukk" onPress={onClose} />
          </View>
          <ScrollView bounces={false}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}
