import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Badge } from './Badge';
import { Card } from './Card';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

export type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  onPress: () => void;
  badge?: string;
  style?: StyleProp<ViewStyle>;
};

export function FeatureCard({ icon, title, onPress, badge, style }: FeatureCardProps) {
  const theme = useTheme();

  return (
    <Card rounded="xl" onPress={onPress} style={style}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.md,
            backgroundColor: theme.colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {icon}
        </View>
        <AppText weight="semibold" style={{ flex: 1 }}>
          {title}
        </AppText>
        {badge ? <Badge label={badge} /> : null}
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </View>
    </Card>
  );
}
