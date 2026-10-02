import { Platform, Text, useWindowDimensions } from 'react-native';
import { useTheme } from '@/theme';
import { arabicFonts, arabicType, spacing, type ArabicFontKey } from '@/theme/tokens';
import { useSettings } from '@/store/settings';

export function ArabicText({ children, font }: { children: string; font?: ArabicFontKey }) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const setting = useSettings((state) => state.duaArabicFont);
  const type = arabicFonts[font ?? setting] ?? arabicFonts.amiri;
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
        fontSize: type.size,
        lineHeight: type.size * type.leading * scale,
        color: theme.colors.textPrimary,
        textAlign: 'center',
        writingDirection: 'rtl',
        paddingVertical: spacing.sm,
      }}>
      {children}
    </Text>
  );
}
