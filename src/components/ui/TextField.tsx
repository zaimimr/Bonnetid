import { TextInput, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme';
import { fontSize, radius, spacing } from '@/theme/tokens';

export type TextFieldProps = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  minHeight?: number;
};

export function TextField({ multiline, minHeight, ...props }: TextFieldProps) {
  const theme = useTheme();

  return (
    <TextInput
      {...props}
      multiline={multiline}
      placeholderTextColor={theme.colors.textMuted}
      maxFontSizeMultiplier={1.6}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={{
        backgroundColor: theme.colors.surfaceSunken,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: fontSize.md,
        color: theme.colors.textPrimary,
        minHeight: minHeight ?? (multiline ? 120 : undefined),
      }}
    />
  );
}
