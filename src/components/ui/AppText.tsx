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
  | 'onHero'
  | 'onHeroMuted'
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

export function AppText({
  size = 'md',
  weight = 'regular',
  tone = 'textPrimary',
  color,
  align,
  heading = false,
  tabular = false,
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

  return <Text {...rest} style={[computed, style]} />;
}
