import type { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@/theme/theme';
import type { HalalVerdict } from '@/lib/halalVerdict';

export type VerdictStyle = {
  tint: string;
  surface: string;
  onSurface: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export function verdictStyle(theme: Theme, verdict: HalalVerdict): VerdictStyle {
  if (verdict === 'avoid') {
    return {
      tint: theme.colors.verdictAvoid,
      surface: theme.colors.verdictAvoidSurface,
      onSurface: theme.colors.onVerdictAvoidSurface,
      icon: 'close-circle-outline',
    };
  }
  if (verdict === 'clear') {
    return {
      tint: theme.colors.verdictClear,
      surface: theme.colors.verdictClearSurface,
      onSurface: theme.colors.onVerdictClearSurface,
      icon: 'checkmark-circle-outline',
    };
  }
  return {
    tint: theme.colors.verdictUncertain,
    surface: theme.colors.verdictUncertainSurface,
    onSurface: theme.colors.onVerdictUncertainSurface,
    icon: 'help-circle-outline',
  };
}
