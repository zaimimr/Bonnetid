import { AmiriQuran_400Regular } from '@expo-google-fonts/amiri-quran';
import { NotoNaskhArabic_400Regular } from '@expo-google-fonts/noto-naskh-arabic/400Regular';
import { ScheherazadeNew_400Regular } from '@expo-google-fonts/scheherazade-new/400Regular';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultShouldDehydrateQuery, QueryCache, QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { PostHogProvider } from 'posthog-react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '@/theme';
import { configureNotificationHandler } from '@/lib/notifications';
import { posthog, trackError } from '@/lib/telemetry';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { useAnalyticsContext } from '@/hooks/useAnalyticsContext';
import { useNotificationScheduler } from '@/hooks/useNotificationScheduler';
import { useNotificationResponses } from '@/hooks/useNotificationResponses';
import { useAutoLocation } from '@/hooks/useAutoLocation';
import { useTravelMode } from '@/hooks/useTravelMode';
import { useFastingReminders } from '@/hooks/useFastingReminders';
import { useNotificationOpenFlag } from '@/hooks/useNotificationOpenFlag';
import { WhatsNewHost } from '@/components/whatsNew/WhatsNewHost';
import { SurveyHost } from '@/components/survey/SurveyHost';
import { useWidgetSync } from '@/hooks/useWidgetSync';
import { useNow } from '@/hooks/useNow';
import { usePrayerLogSync } from '@/hooks/usePrayerLogSync';
import { useSettings, useSettingsHydrated } from '@/store/settings';
import { language, t } from '@/lib/i18n';

const DAY = 24 * 60 * 60 * 1000;
const BACK = t({ nb: 'Tilbake', en: 'Back', ar: 'رجوع', ur: 'واپس' });

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) =>
      trackError(error, 'react-query', { queryKey: JSON.stringify(query.queryKey) }),
  }),
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      gcTime: 30 * DAY,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'bonnetid-query-cache',
  throttleTime: 2000,
});

const persistOptions = {
  persister,
  maxAge: 60 * DAY,
  buster: `v9-${language()}`,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: Parameters<typeof defaultShouldDehydrateQuery>[0]) =>
      defaultShouldDehydrateQuery(query) && !String(query.queryKey[0]).startsWith('support-'),
  },
};

configureNotificationHandler();
void SplashScreen.preventAutoHideAsync();

const isAndroid = Platform.OS === 'android';

function RootNavigator() {
  const theme = useTheme();
  const now = useNow(60_000);
  const hydrated = useSettingsHydrated();
  useAutoLocation();
  useTravelMode();
  useNotificationScheduler();
  useNotificationResponses();
  useFastingReminders(now);
  useNotificationOpenFlag();
  const registerLaunch = useSettings((state) => state.registerLaunch);
  useEffect(() => {
    if (hydrated) registerLaunch();
  }, [hydrated, registerLaunch]);
  useScreenTracking();
  useAnalyticsContext();
  useWidgetSync(now);
  usePrayerLogSync(now);

  const [fontsLoaded, fontError] = useFonts({
    AmiriQuran_400Regular,
    NotoNaskhArabic_400Regular,
    ScheherazadeNew_400Regular,
  });

  useEffect(() => {
    if (!hydrated || (!fontsLoaded && !fontError)) return;
    SplashScreen.hideAsync().catch(() => {});
  }, [hydrated, fontsLoaded, fontError]);

  const baseNavigationTheme = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseNavigationTheme,
    colors: {
      ...baseNavigationTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          headerStyle: {
            backgroundColor: isAndroid ? theme.colors.background : theme.colors.surface,
          },
          headerShadowVisible: !isAndroid,
          headerTitleStyle: { color: theme.colors.textPrimary },
          headerTintColor: theme.colors.primary,
          headerBackButtonDisplayMode: 'minimal',
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="mosques"
          options={{
            headerShown: true,
            title: t({ nb: 'Moskeer', en: 'Mosques', ar: 'المساجد', ur: 'مساجد' }),
            headerBackTitle: BACK,
          }}
        />
        <Stack.Screen
          name="place-picker"
          options={{
            headerShown: true,
            title: t({ nb: 'Velg sted', en: 'Choose location', ar: 'اختر الموقع', ur: 'مقام منتخب کریں' }),
            headerBackTitle: BACK,
          }}
        />
        <Stack.Screen
          name="tracker"
          options={{
            headerShown: true,
            title: t({ nb: 'Bønnesporing', en: 'Prayer tracker', ar: 'متابعة الصلوات', ur: 'نماز ٹریکر' }),
            headerBackTitle: BACK,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: t({ nb: 'Innstillinger', en: 'Settings', ar: 'الإعدادات', ur: 'ترتیبات' }),
            headerBackTitle: BACK,
          }}
        />
        <Stack.Screen
          name="tasbih"
          options={{
            headerShown: true,
            title: t({ nb: 'Tasbih', en: 'Tasbih', ar: 'المسبحة', ur: 'تسبیح' }),
            headerBackTitle: BACK,
          }}
        />
        <Stack.Screen
          name="duas/index"
          options={{
            headerShown: true,
            title: t({ nb: 'Dua og dhikr', en: 'Dua and dhikr', ar: 'الأدعية والأذكار', ur: 'دعا اور ذکر' }),
            headerBackTitle: BACK,
          }}
        />
        <Stack.Screen
          name="duas/[id]"
          options={{
            headerShown: true,
            title: t({ nb: 'Dua', en: 'Dua', ar: 'دعاء', ur: 'دعا' }),
            headerBackTitle: BACK,
          }}
        />
        <Stack.Screen
          name="irn"
          options={{
            headerShown: true,
            title: t({ nb: 'Islamsk Råd Norge', en: 'Islamic Council of Norway', ar: 'المجلس الإسلامي النرويجي', ur: 'اسلامک کونسل ناروے' }),
            headerBackTitle: BACK,
          }}
        />
        <Stack.Screen
          name="notification-sound"
          options={{
            headerShown: true,
            title: t({ nb: 'Varsellyd', en: 'Notification sound', ar: 'صوت الإشعار', ur: 'اطلاع کی آواز' }),
            headerBackTitle: BACK,
          }}
        />
        <Stack.Screen
          name="notification-prayers"
          options={{
            headerShown: true,
            title: t({ nb: 'Bønnevarsler', en: 'Prayer notifications', ar: 'إشعارات الصلاة', ur: 'نماز کی اطلاعات' }),
            headerBackTitle: BACK,
          }}
        />
        <Stack.Screen
          name="notification-check"
          options={{
            headerShown: true,
            title: t({ nb: 'Varselsjekk', en: 'Notification check', ar: 'فحص الإشعارات', ur: 'اطلاعات کی جانچ' }),
            headerBackTitle: BACK,
          }}
        />
        <Stack.Screen
          name="fasting-reminders"
          options={{
            headerShown: true,
            title: t({ nb: 'Faste og merkedager', en: 'Fasting and special days', ar: 'الصيام والمناسبات', ur: 'روزے اور خاص دن' }),
            headerBackTitle: BACK,
          }}
        />
        <Stack.Screen
          name="calculation-method"
          options={{
            headerShown: true,
            title: t({ nb: 'Beregningsmetode', en: 'Calculation method', ar: 'طريقة الحساب', ur: 'حساب کا طریقہ' }),
            headerBackTitle: BACK,
          }}
        />
        <Stack.Screen
          name="asr-method"
          options={{
            headerShown: true,
            title: t({ nb: 'Asr-metode', en: 'Asr method', ar: 'طريقة العصر', ur: 'عصر کا طریقہ' }),
            headerBackTitle: BACK,
          }}
        />
        <Stack.Screen
          name="dua-settings"
          options={{
            headerShown: true,
            title: t({ nb: 'Duainnstillinger', en: 'Dua settings', ar: 'إعدادات الأدعية', ur: 'دعا کی ترتیبات' }),
            headerBackTitle: BACK,
          }}
        />
        <Stack.Screen
          name="mosque-picker"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: t({ nb: 'Velg moské', en: 'Choose mosque', ar: 'اختر المسجد', ur: 'مسجد منتخب کریں' }),
          }}
        />
        <Stack.Screen
          name="day/[date]"
          options={{
            headerShown: true,
            title: '',
            headerBackTitle: BACK,
          }}
        />
        <Stack.Screen
          name="mosque/[orgNr]"
          options={{
            headerShown: true,
            title: '',
            headerBackTitle: BACK,
          }}
        />
        <Stack.Screen
          name="whats-new"
          options={{
            headerShown: true,
            title: t({ nb: 'Hva er nytt', en: "What's new", ar: 'ما الجديد', ur: 'نیا کیا ہے' }),
            headerBackTitle: BACK,
          }}
        />
        <Stack.Screen
          name="feedback"
          options={{
            headerShown: true,
            title: t({ nb: 'Tilbakemelding', en: 'Feedback', ar: 'الملاحظات', ur: 'رائے' }),
            headerBackTitle: BACK,
          }}
        />
      </Stack>
      <WhatsNewHost />
      <SurveyHost />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PostHogProvider client={posthog} autocapture={false}>
        <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </PersistQueryClientProvider>
      </PostHogProvider>
    </GestureHandlerRootView>
  );
}
