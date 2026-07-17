import { View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { spacing } from '@/theme/tokens';

export type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SectionHeader({ title, subtitle, trailing, style }: SectionHeaderProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginTop: spacing.xl,
          marginBottom: spacing.md,
        },
        style,
      ]}>
      <View style={{ gap: spacing.xxs, flex: 1 }}>
        <AppText size="lg" weight="bold" heading>
          {title}
        </AppText>
        {subtitle ? (
          <AppText size="sm" tone="textMuted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}
