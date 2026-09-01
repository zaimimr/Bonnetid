import { View } from 'react-native';
import { AppText, type TextTone } from '@/components/ui';
import { spacing, type FontSizeToken, type FontWeightToken } from '@/theme/tokens';

export const TIME_COLUMN_WIDTH = 64;

export type TimeCellProps = {
  value: string;
  label: string;
  stacked: boolean;
  width?: number;
  size?: FontSizeToken;
  weight?: FontWeightToken;
  tone?: TextTone;
};

export function TimeCell({
  value,
  label,
  stacked,
  width,
  size = 'md',
  weight = 'medium',
  tone = 'textPrimary',
}: TimeCellProps) {
  if (stacked) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs }}>
        {label ? (
          <AppText size="xs" tone="textMuted">
            {label}
          </AppText>
        ) : null}
        <AppText size={size} weight={weight} tone={tone} tabular>
          {value}
        </AppText>
      </View>
    );
  }

  return (
    <AppText
      size={size}
      weight={weight}
      tone={tone}
      align="right"
      tabular
      style={width ? { width } : undefined}>
      {value}
    </AppText>
  );
}

export function TimeCellRow({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        columnGap: spacing.lg,
        rowGap: spacing.xxs,
      }}>
      {children}
    </View>
  );
}
