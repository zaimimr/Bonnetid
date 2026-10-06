import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { useActiveLocation, useIsCalculatedMode } from '@/store/settings';
import { PostHogMaskView } from 'posthog-react-native';

export function TravelBanner() {
  const theme = useTheme();
  const location = useActiveLocation();
  const travelling = useIsCalculatedMode();

  if (!travelling) return null;

  return (
    <View
      style={{
        backgroundColor: theme.colors.travelSurface,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      }}>
      <Ionicons name="airplane-outline" size={18} color={theme.colors.onTravelSurface} />
      <View style={{ flex: 1 }}>
        <PostHogMaskView>
          <AppText size="sm" weight="semibold" style={{ color: theme.colors.onTravelSurface }}>
            {`Reisemodus · ${location.name}`}
          </AppText>
        </PostHogMaskView>
        <AppText size="xs" style={{ color: theme.colors.travelSurfaceMuted }}>
          Lokale tider
        </AppText>
      </View>
    </View>
  );
}
