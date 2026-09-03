import { useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { radius } from '@/theme/tokens';

export type MosqueLogoSize = 'sm' | 'md' | 'lg';

const SIZES: Record<MosqueLogoSize, { plate: number; icon: number; radius: number }> = {
  sm: { plate: 40, icon: 20, radius: radius.md },
  md: { plate: 56, icon: 28, radius: radius.lg },
  lg: { plate: 88, icon: 44, radius: radius.xl },
};

export type MosqueLogoProps = {
  uri?: string | null;
  size?: MosqueLogoSize;
  style?: StyleProp<ViewStyle>;
};

export function MosqueLogo({ uri, size = 'md', style }: MosqueLogoProps) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);
  const { plate, icon, radius: cornerRadius } = SIZES[size];
  const showImage = Boolean(uri) && !failed;

  return (
    <View
      style={[
        {
          width: plate,
          height: plate,
          borderRadius: cornerRadius,
          backgroundColor: theme.colors.surfaceSunken,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}>
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          style={{ width: plate, height: plate }}
          contentFit="contain"
          cachePolicy="memory-disk"
          onError={() => setFailed(true)}
        />
      ) : (
        <Ionicons name="business-outline" size={icon} color={theme.colors.textMuted} />
      )}
    </View>
  );
}
