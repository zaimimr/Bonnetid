import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { radius } from '@/theme/tokens';

const TILE_SIZE = 40;

export function IconTile({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: radius.md,
        backgroundColor: theme.colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {children}
    </View>
  );
}
