import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { requestCoords, resolvePlaceName, useTravelPrompt } from '@/hooks/useTravelDetection';
import { track, trackError } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';
import { calculatedLocation, useSettings } from '@/store/settings';

type Choice = {
  key: 'calculated' | 'norway' | 'city';
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

const CHOICES: Choice[] = [
  {
    key: 'calculated',
    icon: 'navigate-outline',
    title: 'Lokale tider',
    description: 'Regn ut bønnetidene der du er nå. Uten jamaat-tider og moskeer.',
  },
  {
    key: 'norway',
    icon: 'flag-outline',
    title: 'Behold norsk tid',
    description: 'Fortsett med byen din i Norge, vist i din lokale klokke.',
  },
  {
    key: 'city',
    icon: 'search-outline',
    title: 'Velg by',
    description: 'Bytt til en annen norsk by.',
  },
];

export function TravelModeSheet() {
  const theme = useTheme();
  const router = useRouter();
  const { visible, state, dismiss } = useTravelPrompt();
  const setLocation = useSettings((settings) => settings.setLocation);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const applyLocalTimes = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const coords = state.coords ?? (await requestCoords());
      if (!coords) {
        setFailed(true);
        return;
      }
      const name = await resolvePlaceName(coords);
      setLocation(calculatedLocation(name, coords.lat, coords.lon));
      track('travel_mode_chosen', { choice: 'calculated' });
      dismiss();
    } catch (error) {
      setFailed(true);
      trackError(error, 'travel-mode');
    } finally {
      setBusy(false);
    }
  };

  const choose = (choice: Choice) => {
    if (busy) return;
    if (choice.key === 'calculated') {
      applyLocalTimes().catch(() => {});
      return;
    }
    track('travel_mode_chosen', { choice: choice.key });
    dismiss();
    if (choice.key === 'city') router.push('/location-picker');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={dismiss}>
      <View style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing.xl,
            gap: spacing.lg,
          }}>
          <View style={{ gap: spacing.xs }}>
            <AppText size="xl" weight="bold" heading>
              Du ser ut til å være utenfor Norge
            </AppText>
            <AppText size="sm" tone="textMuted">
              {state.permissionDenied
                ? 'Bønnetidene i appen gjelder Norge. Hva vil du gjøre?'
                : 'Bønnetidene i appen kommer fra norske steder. Hva vil du gjøre?'}
            </AppText>
          </View>

          <View style={{ gap: spacing.sm }}>
            {CHOICES.map((choice) => (
              <Pressable
                key={choice.key}
                onPress={() => choose(choice)}
                disabled={busy}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.md,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceSunken,
                    minHeight: 56,
                  },
                  pressed && { opacity: opacity.pressed },
                  busy && { opacity: opacity.disabled },
                ]}>
                {busy && choice.key === 'calculated' ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Ionicons name={choice.icon} size={22} color={theme.colors.primary} />
                )}
                <View style={{ flex: 1, gap: spacing.xxs }}>
                  <AppText weight="semibold">{choice.title}</AppText>
                  <AppText size="sm" tone="textMuted">
                    {choice.description}
                  </AppText>
                </View>
              </Pressable>
            ))}
          </View>

          {failed && (
            <AppText size="sm" tone="danger" align="center">
              Fant ikke posisjonen din. Gi appen tilgang til posisjon, eller velg en norsk by.
            </AppText>
          )}

          <AppText size="xs" tone="textMuted" align="center">
            Appen bytter aldri på egen hånd. Du kan endre valget i Innstillinger.
          </AppText>
        </View>
      </View>
    </Modal>
  );
}
