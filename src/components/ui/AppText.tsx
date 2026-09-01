import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/theme';
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  type FontSizeToken,
  type FontWeightToken,
} from '@/theme/tokens';
import type { ThemeColors } from '@/theme/theme';

export type TextTone = keyof Pick<
  ThemeColors,
  | 'textPrimary'
  | 'textSecondary'
  | 'textMuted'
  | 'textInverse'
  | 'primary'
  | 'accent'
  | 'danger'
  | 'success'
  | 'onPrimary'
  | 'onPrimarySoft'
>;

export type AppTextProps = TextProps & {
  size?: FontSizeToken;
  weight?: FontWeightToken;
  tone?: TextTone;
  color?: string;
  align?: TextStyle['textAlign'];
  heading?: boolean;
  tabular?: boolean;
};

const maxFontScale: Record<FontSizeToken, number> = {
  xs: 1.8,
  sm: 1.8,
  md: 1.7,
  lg: 1.6,
  xl: 1.5,
  xxl: 1.4,
  display: 1.3,
};

export function AppText({
  size = 'md',
  weight = 'regular',
  tone = 'textPrimary',
  color,
  align,
  heading = false,
  tabular = false,
  maxFontSizeMultiplier,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();

  const computed: TextStyle = {
    fontSize: fontSize[size],
    fontWeight: fontWeight[weight],
    color: color ?? theme.colors[tone],
    textAlign: align,
    lineHeight: fontSize[size] * (heading ? lineHeight.tight : lineHeight.normal),
    fontFamily: heading ? fontFamily.heading : fontFamily.body,
    fontVariant: tabular ? ['tabular-nums'] : undefined,
  };

  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? maxFontScale[size]}
      style={[computed, style]}
    />
  );
}
