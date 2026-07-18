import { View } from 'react-native';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

export function Divider({ inset = spacing.md }: { inset?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: theme.colors.border,
        marginHorizontal: inset,
      }}
    />
  );
}
