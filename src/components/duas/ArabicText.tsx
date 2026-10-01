import { Platform, Text, useWindowDimensions } from 'react-native';
import { useTheme } from '@/theme';
import { arabicType, spacing } from '@/theme/tokens';

export function ArabicText({ children }: { children: string }) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const scale =
    Platform.OS === 'ios' ? Math.min(Math.max(fontScale || 1, 1), arabicType.maxScale) : 1;

  return (
    <Text
      selectable
      accessibilityLanguage="ar"
      lineBreakStrategyIOS="standard"
      textBreakStrategy="balanced"
      maxFontSizeMultiplier={arabicType.maxScale}
      style={{
        fontFamily: arabicType.family,
        fontSize: arabicType.size,
        lineHeight: arabicType.size * arabicType.leading * scale,
        color: theme.colors.textPrimary,
        textAlign: 'center',
        writingDirection: 'rtl',
        paddingVertical: spacing.sm,
      }}>
      {children}
    </Text>
  );
}
