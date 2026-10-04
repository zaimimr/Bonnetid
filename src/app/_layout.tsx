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
import { Stack } from 'expo-router';
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

const DAY = 24 * 60 * 60 * 1000;

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
  buster: 'v9',
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

  return (
    <>
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
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="mosques"
          options={{
            headerShown: true,
            title: 'Moskeer',
            headerBackTitle: 'Tilbake',
          }}
        />
        <Stack.Screen
          name="place-picker"
          options={{
            headerShown: true,
            title: 'Velg sted',
            headerBackTitle: 'Tilbake',
          }}
        />
        <Stack.Screen
          name="tracker"
          options={{
            headerShown: true,
            title: 'Bønnesporing',
            headerBackTitle: 'Tilbake',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: 'Innstillinger',
            headerBackTitle: 'Tilbake',
          }}
        />
        <Stack.Screen
          name="tasbih"
          options={{
            headerShown: true,
            title: 'Tasbih',
            headerBackTitle: 'Tilbake',
          }}
        />
        <Stack.Screen
          name="duas/index"
          options={{
            headerShown: true,
            title: 'Dua og dhikr',
            headerBackTitle: 'Tilbake',
          }}
        />
        <Stack.Screen
          name="duas/[id]"
          options={{
            headerShown: true,
            title: 'Dua',
            headerBackTitle: 'Tilbake',
          }}
        />
        <Stack.Screen
          name="irn"
          options={{
            headerShown: true,
            title: 'Islamsk Råd Norge',
            headerBackTitle: 'Tilbake',
          }}
        />
        <Stack.Screen
          name="notification-sound"
          options={{
            headerShown: true,
            title: 'Varsellyd',
            headerBackTitle: 'Tilbake',
          }}
        />
        <Stack.Screen
          name="notification-prayers"
          options={{
            headerShown: true,
            title: 'Bønnevarsler',
            headerBackTitle: 'Tilbake',
          }}
        />
        <Stack.Screen
          name="notification-check"
          options={{
            headerShown: true,
            title: 'Varselsjekk',
            headerBackTitle: 'Tilbake',
          }}
        />
        <Stack.Screen
          name="fasting-reminders"
          options={{
            headerShown: true,
            title: 'Faste og merkedager',
            headerBackTitle: 'Tilbake',
          }}
        />
        <Stack.Screen
          name="calculation-method"
          options={{
            headerShown: true,
            title: 'Beregningsmetode',
            headerBackTitle: 'Tilbake',
          }}
        />
        <Stack.Screen
          name="asr-method"
          options={{
            headerShown: true,
            title: 'Asr-metode',
            headerBackTitle: 'Tilbake',
          }}
        />
        <Stack.Screen
          name="arabic-font"
          options={{
            headerShown: true,
            title: 'Arabisk skrift',
            headerBackTitle: 'Tilbake',
          }}
        />
        <Stack.Screen
          name="mosque-picker"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Velg moské',
          }}
        />
        <Stack.Screen
          name="day/[date]"
          options={{
            headerShown: true,
            title: '',
            headerBackTitle: 'Tilbake',
          }}
        />
        <Stack.Screen
          name="mosque/[orgNr]"
          options={{
            headerShown: true,
            title: '',
            headerBackTitle: 'Tilbake',
          }}
        />
        <Stack.Screen
          name="whats-new"
          options={{
            headerShown: true,
            title: 'Hva er nytt',
            headerBackTitle: 'Tilbake',
          }}
        />
        <Stack.Screen
          name="feedback"
          options={{
            headerShown: true,
            title: 'Tilbakemelding',
            headerBackTitle: 'Tilbake',
          }}
        />
      </Stack>
      <WhatsNewHost />
      <SurveyHost />
    </>
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
