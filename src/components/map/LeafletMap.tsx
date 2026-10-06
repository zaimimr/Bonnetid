import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/lib/i18n';
import { AppText, Button } from '@/components/ui';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

const MAX_AUTOMATIC_RELOADS = 2;

type RecoveryState = {
  instance: number;
  deaths: number;
  exhausted: boolean;
};

const INITIAL_RECOVERY: RecoveryState = { instance: 0, deaths: 0, exhausted: false };

export type LeafletMapHandle = {
  run: (script: string) => void;
};

export type LeafletMapProps = {
  html: string;
  onReady?: () => void;
  onMessage?: (data: string) => void;
  fallbackMessage?: string;
};

export const LeafletMap = forwardRef<LeafletMapHandle, LeafletMapProps>(function LeafletMap(
  {
    html,
    onReady,
    onMessage,
    fallbackMessage = t({
      nb: 'Kartet ble avsluttet av systemet, sannsynligvis fordi enheten gikk tom for minne.',
      en: 'The system closed the map, probably because the device ran out of memory.',
      ar: 'أغلق النظام الخريطة، على الأرجح بسبب نفاد ذاكرة الجهاز.',
      ur: 'سسٹم نے نقشہ بند کر دیا، غالباً اس لیے کہ آلے کی میموری ختم ہو گئی۔',
    }),
  },
  ref,
) {
  const theme = useTheme();
  const webViewRef = useRef<WebView>(null);
  const [recovery, setRecovery] = useState<RecoveryState>(INITIAL_RECOVERY);

  useImperativeHandle(
    ref,
    () => ({
      run: (script: string) => {
        webViewRef.current?.injectJavaScript(`${script} true;`);
      },
    }),
    [],
  );

  const handleProcessGone = useCallback(() => {
    setRecovery((previous) => {
      const deaths = previous.deaths + 1;
      if (deaths > MAX_AUTOMATIC_RELOADS) {
        return { instance: previous.instance, deaths, exhausted: true };
      }
      return { instance: previous.instance + 1, deaths, exhausted: false };
    });
  }, []);

  const handleRetry = useCallback(() => {
    setRecovery((previous) => ({ instance: previous.instance + 1, deaths: 0, exhausted: false }));
  }, []);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const data = event.nativeEvent.data;
      if (data) onMessage?.(data);
    },
    [onMessage],
  );

  if (recovery.exhausted) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.md,
          padding: spacing.xl,
          backgroundColor: theme.colors.surfaceSunken,
        }}>
        <Ionicons name="map-outline" size={40} color={theme.colors.textMuted} />
        <AppText tone="textSecondary" align="center">
          {fallbackMessage}
        </AppText>
        <Button
          label={t({ nb: 'Prøv igjen', en: 'Try again', ar: 'حاول مرة أخرى', ur: 'دوبارہ کوشش کریں' })}
          variant="secondary"
          onPress={handleRetry}
        />
      </View>
    );
  }

  return (
    <WebView
      key={recovery.instance}
      ref={webViewRef}
      style={{ flex: 1, backgroundColor: theme.colors.surfaceSunken }}
      source={{ html }}
      originWhitelist={['*']}
      setSupportMultipleWindows={false}
      overScrollMode="never"
      androidLayerType="hardware"
      javaScriptCanOpenWindowsAutomatically={false}
      onLoadEnd={onReady}
      onMessage={handleMessage}
      onRenderProcessGone={handleProcessGone}
      onContentProcessDidTerminate={handleProcessGone}
    />
  );
});
