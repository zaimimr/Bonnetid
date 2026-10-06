import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/lib/i18n';
import { AppText } from '@/components/ui';
import { useEidMode } from '@/hooks/useEidMode';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

export function EidBanner() {
  const theme = useTheme();
  const mode = useEidMode();

  if (!mode) return null;

  const name =
    mode.eid === 'adha'
      ? t('season.eidAlAdha')
      : t('season.eidAlFitr');

  return (
    <View
      style={{
        backgroundColor: theme.colors.eidSurface,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      }}>
      <Ionicons name="moon-outline" size={18} color={theme.colors.onEidSurface} />
      <View style={{ flex: 1 }}>
        <AppText size="sm" weight="semibold" style={{ color: theme.colors.onEidSurface }}>
          {mode.phase === 'eve'
            ? t('season.tomorrow', { name })
            : t('season.eidMubarak')}
        </AppText>
        {mode.phase === 'day' && (
          <AppText size="xs" style={{ color: theme.colors.eidSurfaceMuted }}>
            {name}
          </AppText>
        )}
      </View>
    </View>
  );
}
