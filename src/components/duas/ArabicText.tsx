import { Platform, Text, useWindowDimensions } from 'react-native';
import { useTheme } from '@/theme';
import { arabicFonts, arabicSizes, arabicType, spacing, type ArabicFontKey } from '@/theme/tokens';
import { useSettings } from '@/store/settings';

export function ArabicText({ children, font }: { children: string; font?: ArabicFontKey }) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const setting = useSettings((state) => state.duaArabicFont);
  const sizeSetting = useSettings((state) => state.duaArabicSize);
  const type = arabicFonts[font ?? setting] ?? arabicFonts.amiri;
  const size = type.size * (arabicSizes[sizeSetting] ?? arabicSizes.medium).scale;
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
        fontFamily: type.family,
        fontSize: size,
        lineHeight: size * type.leading * scale,
        color: theme.colors.textPrimary,
        textAlign: 'center',
        writingDirection: 'rtl',
        paddingVertical: spacing.sm,
      }}>
      {children}
    </Text>
  );
}
