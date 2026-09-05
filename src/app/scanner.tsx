import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Disclaimer } from '@/components/halal/Disclaimer';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { isValidBarcode } from '@/api/openFoodFacts';
import { HALAL_METHOD } from '@/lib/halalCopy';
import { track } from '@/lib/telemetry';
import { useScanHistory } from '@/store/halalScans';
import { useTheme } from '@/theme';
import { palette, radius, spacing } from '@/theme/tokens';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;
const FRAME_SCRIM = 'rgba(0, 0, 0, 0.45)';
const FRAME_INK = palette.neutral0;

export default function ScannerScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [active, setActive] = useState(true);
  const lastScan = useRef<string | null>(null);
  const historyCount = useScanHistory((state) => state.entries.length);

  useFocusEffect(
    useCallback(() => {
      lastScan.current = null;
      setActive(true);
      return () => setActive(false);
    }, []),
  );

  const onBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      const barcode = result.data.trim();
      if (!active || lastScan.current === barcode || !isValidBarcode(barcode)) return;
      lastScan.current = barcode;
      setActive(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      track('halal_barcode_scanned', { type: result.type });
      router.push({ pathname: '/scan/[barcode]', params: { barcode } });
    },
    [active, router],
  );

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <Screen scroll>
        <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
          <Card rounded="xl">
            <View style={{ alignItems: 'center', gap: spacing.md }}>
              <Ionicons name="barcode-outline" size={40} color={theme.colors.textMuted} />
              <AppText weight="semibold" align="center">
                Gi appen tilgang til kameraet
              </AppText>
              <AppText size="sm" tone="textSecondary" align="center">
                Halal-skanneren leser strekkoden på pakningen. Bildet forlater aldri telefonen.
              </AppText>
              {permission.canAskAgain && (
                <Button label="Gi kameratilgang" onPress={() => requestPermission()} />
              )}
            </View>
          </Card>
          <Disclaimer />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false} edges={[]}>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
            onBarcodeScanned={active ? onBarcodeScanned : undefined}
          />
          <ScanFrame />
        </View>

        <View
          style={{
            backgroundColor: theme.colors.surface,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.xl + insets.bottom,
            gap: spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}>
          <AppText size="sm" tone="textSecondary">
            {HALAL_METHOD}
          </AppText>
          <Disclaimer compact />
          <Button
            label={
              historyCount > 0 ? `Tidligere skanninger (${historyCount})` : 'Tidligere skanninger'
            }
            variant="secondary"
            fullWidth
            onPress={() => router.push('/scan-history')}
          />
        </View>
      </View>
    </Screen>
  );
}

function ScanFrame() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.frameLayer]} pointerEvents="none">
      <View style={styles.window} />
      <View style={styles.hint}>
        <AppText size="sm" weight="semibold" color={FRAME_INK} align="center">
          Hold strekkoden inne i rammen
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frameLayer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  window: {
    width: '78%',
    aspectRatio: 1.6,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: FRAME_INK,
    opacity: 0.9,
  },
  hint: {
    backgroundColor: FRAME_SCRIM,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    maxWidth: '80%',
  },
});
