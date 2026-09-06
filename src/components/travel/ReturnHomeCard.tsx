import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, Card } from '@/components/ui';
import { useTravelState } from '@/hooks/useTravelDetection';
import { track } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { useActiveLocation, useHomeLocation, useSettings } from '@/store/settings';

export function ReturnHomeCard() {
  const theme = useTheme();
  const location = useActiveLocation();
  const home = useHomeLocation();
  const setLocation = useSettings((settings) => settings.setLocation);
  const { signal } = useTravelState();

  if (location.mode !== 'calculated' || signal !== 'home' || !home) return null;

  const goHome = () => {
    setLocation(home);
    track('travel_mode_chosen', { choice: 'returned' });
  };

  return (
    <Card rounded="xl" style={{ backgroundColor: theme.colors.noticeSoft, gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Ionicons name="flag-outline" size={20} color={theme.colors.onNoticeSoft} />
        <AppText weight="semibold" tone="onNoticeSoft" style={{ flex: 1 }}>
          Velkommen tilbake til Norge
        </AppText>
      </View>
      <AppText size="sm" tone="onNoticeSoft">
        {`Du bruker lokale tider for ${location.name}. Vil du gå tilbake til ${home.name} med jamaat-tider og moskeer?`}
      </AppText>
      <Button label={`Bruk ${home.name}`} onPress={goHome} variant="secondary" size="sm" />
    </Card>
  );
}
