import '@/lib/i18n';
import { Amiri_400Regular } from '@expo-google-fonts/amiri';
import { ArefRuqaa_400Regular } from '@expo-google-fonts/aref-ruqaa';
import { NotoNaskhArabic_400Regular } from '@expo-google-fonts/noto-naskh-arabic';
import { NotoNastaliqUrdu_400Regular } from '@expo-google-fonts/noto-nastaliq-urdu';
import { ReemKufi_400Regular } from '@expo-google-fonts/reem-kufi';
import { ScheherazadeNew_400Regular } from '@expo-google-fonts/scheherazade-new';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, useTVEventHandler, useWindowDimensions, View } from 'react-native';
import { T } from './kit';
import { SCREENS } from './screens';
import { rotationOf, screenOptionsOf, useTaraweeh, useTvSettings } from './settings';
import { Setup } from './Setup';
import { brandColors, ink } from './theme';
import { DUA_SHOW_MINUTES, pickScreen } from './tvModel';
import { useTvData } from './useTvData';

const DAY = 86_400_000;
const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 30 * DAY, retry: 3 } } });
const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'tv-query-v1' });

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useHydrated() {
  const [ready, setReady] = useState(
    () => useTvSettings.persist.hasHydrated() && useTaraweeh.persist.hasHydrated(),
  );
  useEffect(() => {
    const check = () => setReady(useTvSettings.persist.hasHydrated() && useTaraweeh.persist.hasHydrated());
    const offA = useTvSettings.persist.onFinishHydration(check);
    const offB = useTaraweeh.persist.onFinishHydration(check);
    check();
    return () => {
      offA();
      offB();
    };
  }, []);
  return ready;
}

function Stage({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / 1920, height / 1080);
  return (
    <View style={s.stage}>
      <View style={{ width: 1920, height: 1080, transform: [{ scale }] }}>{children}</View>
    </View>
  );
}

function Message({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={s.message}>
      <T style={s.messageTitle}>{title}</T>
      {sub ? <T style={s.messageSub}>{sub}</T> : null}
    </View>
  );
}

function Board({ orgNr, now }: { orgNr: string; now: Date }) {
  const settings = useTvSettings();
  const taraweeh = useTaraweeh();
  const { data, error } = useTvData(orgNr, now);
  const brand = useMemo(() => brandColors(settings.brand), [settings.brand]);
  if (!data) return <Message title={error ? 'Fikk ikke hentet bønnetidene' : 'Henter bønnetider'} sub={error ? 'Prøver igjen snart' : undefined} />;
  const duaUntil = taraweeh.duaUntil ? new Date(taraweeh.duaUntil) : null;
  const screen = settings.preview ?? pickScreen({ ...data.state, now, duaUntil }, rotationOf(settings));
  const Screen = SCREENS[screen];
  return (
    <Screen
      now={now}
      mosque={data.mosque}
      state={{ ...data.state, now, duaUntil }}
      brand={brand}
      {...screenOptionsOf(settings)}
      pauses={taraweeh.night === data.nightKey ? taraweeh.pauses : 1}
    />
  );
}

function Root() {
  useKeepAwake();
  const now = useClock();
  const hydrated = useHydrated();
  const orgNr = useTvSettings((state) => state.orgNr);
  const configured = useTvSettings((state) => state.configured);
  const [setup, setSetup] = useState(false);
  const { data } = useTvData(orgNr, now);
  const screen = data
    ? pickScreen({ ...data.state, now, duaUntil: useTaraweeh.getState().duaUntil ? new Date(useTaraweeh.getState().duaUntil as number) : null }, rotationOf(useTvSettings.getState()))
    : null;

  useTVEventHandler((event) => {
    if (event.eventType === 'longSelect' || event.eventType === 'playPause') {
      setSetup(true);
      return;
    }
    if (setup || event.eventType !== 'select' || !data?.nightKey) return;
    if (screen === 'taraweeh' || screen === 'dua') {
      useTaraweeh.getState().press(data.nightKey, Date.now(), DUA_SHOW_MINUTES * 60_000);
    }
  });

  if (!hydrated) return <Message title="Bønnetid" />;
  if (setup || !configured || !orgNr) return <Setup now={now} onClose={() => setSetup(false)} />;
  return <Board orgNr={orgNr} now={now} />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Amiri_400Regular,
    ScheherazadeNew_400Regular,
    NotoNaskhArabic_400Regular,
    ReemKufi_400Regular,
    ArefRuqaa_400Regular,
    NotoNastaliqUrdu_400Regular,
  });
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 30 * DAY, buster: 'tv-v1' }}>
      <Stage>{fontsLoaded ? <Root /> : <Message title="Bønnetid" />}</Stage>
    </PersistQueryClientProvider>
  );
}

const s = StyleSheet.create({
  stage: { flex: 1, backgroundColor: ink.page, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  message: { width: 1920, height: 1080, backgroundColor: ink.page, alignItems: 'center', justifyContent: 'center', gap: 16 },
  messageTitle: { fontSize: 72, fontWeight: '800', color: ink.text },
  messageSub: { fontSize: 36, color: ink.muted },
});
