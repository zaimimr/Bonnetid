import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { hitSlop, opacity, spacing } from '@/theme/tokens';

export type DuaLinkProps = {
  label: string;
} & ({ duaId: string; category?: never } | { category: string; duaId?: never });

export function DuaLink({ duaId, category, label }: DuaLinkProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="link"
      hitSlop={hitSlop}
      onPress={() =>
        duaId
          ? router.push({ pathname: '/duas/[id]', params: { id: duaId } })
          : router.push({ pathname: '/duas', params: { category } })
      }
      style={({ pressed }) => ({ marginTop: spacing.md, opacity: pressed ? opacity.pressed : 1 })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Ionicons name="book-outline" size={16} color={theme.colors.primary} />
        <AppText size="sm" weight="semibold" tone="primary" style={{ flexShrink: 1 }}>
          {label}
        </AppText>
        <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
      </View>
    </Pressable>
  );
}
