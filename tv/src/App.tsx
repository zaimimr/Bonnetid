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
import { ScrollView, Pressable, StyleSheet, useTVEventHandler, useWindowDimensions, View } from 'react-native';
import { T } from './kit';
import { SCREEN_NAMES, SCREENS } from './screens';
import { ART_OPTIONS, DUA_FONTS, HALL_OPTIONS, useTaraweeh, useTvSettings } from './settings';
import { BRAND_OPTIONS, brandColors, ink } from './theme';
import { DUA_SHOW_MINUTES, pickScreen, type BaseScreen, type ScreenId } from './tvModel';
import { useMosqueList, useTvData } from './useTvData';

const DAY = 86_400_000;
const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 30 * DAY, retry: 3 } } });
const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'tv-query-v1' });

const BASES: BaseScreen[] = ['main', 'lobby', 'plakat', 'rad'];
const PREVIEWS: (ScreenId | null)[] = [null, ...(Object.keys(SCREENS) as ScreenId[])];
const ART_NAMES: Record<(typeof ART_OPTIONS)[number], string> = {
  mosque: 'Moské',
  kaaba: 'Kaaba',
  lantern: 'Lykt',
  moon: 'Måne og stjerner',
  none: 'Ingen',
};
const BRAND_NAMES = ['Grønn', 'Blå', 'Vinrød', 'Lilla'];

function cycle<T>(list: readonly T[], value: T): T {
  return list[(list.indexOf(value) + 1) % list.length];
}

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

function Row({ label, value, onPress, first }: { label: string; value: string; onPress: () => void; first?: boolean }) {
  return (
    <Pressable onPress={onPress} hasTVPreferredFocus={first} style={({ focused }) => [s.row, focused && s.rowFocused]}>
      {({ focused }) => (
        <>
          <T style={[s.rowLabel, focused && s.rowTextFocused]}>{label}</T>
          <T style={[s.rowValue, focused && s.rowTextFocused]} lines={1}>
            {value}
          </T>
        </>
      )}
    </Pressable>
  );
}

function MosquePicker({ onDone }: { onDone: () => void }) {
  const list = useMosqueList();
  const orgNr = useTvSettings((state) => state.orgNr);
  const set = useTvSettings((state) => state.set);
  const mosques = useMemo(
    () => [...(list.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'nb')),
    [list.data],
  );
  if (!list.data) return <Message title={list.isError ? 'Fikk ikke hentet moskeene' : 'Henter moskeer'} />;
  return (
    <View style={s.setup}>
      <T style={s.setupTitle}>Velg moské</T>
      <ScrollView style={s.list}>
        {mosques.map((item, index) => (
          <Row
            key={item.org_nr}
            label={item.name}
            value={item.address ?? ''}
            first={orgNr ? item.org_nr === orgNr : index === 0}
            onPress={() => {
              set({ orgNr: item.org_nr });
              onDone();
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Setup({ onClose }: { onClose: () => void }) {
  const settings = useTvSettings();
  const list = useMosqueList();
  const [picking, setPicking] = useState(settings.orgNr == null);
  if (picking) return <MosquePicker onDone={() => setPicking(false)} />;
  const mosque = list.data?.find((item) => item.org_nr === settings.orgNr);
  const { set } = settings;
  return (
    <View style={s.setup}>
      <T style={s.setupTitle}>Innstillinger</T>
      <View style={s.list}>
        <Row first label="Moské" value={mosque?.name ?? settings.orgNr ?? ''} onPress={() => setPicking(true)} />
        <Row label="Hovedskjerm" value={SCREEN_NAMES[settings.base]} onPress={() => set({ base: cycle(BASES, settings.base) })} />
        <Row
          label="Farge"
          value={BRAND_NAMES[BRAND_OPTIONS.indexOf(settings.brand as (typeof BRAND_OPTIONS)[number])] ?? settings.brand}
          onPress={() => set({ brand: cycle(BRAND_OPTIONS, settings.brand as (typeof BRAND_OPTIONS)[number]) })}
        />
        <Row label="Tegning" value={ART_NAMES[settings.art]} onPress={() => set({ art: cycle(ART_OPTIONS, settings.art) })} />
        <Row label="Sal" value={settings.hall} onPress={() => set({ hall: cycle(HALL_OPTIONS, settings.hall as (typeof HALL_OPTIONS)[number]) })} />
        <Row label="Dua-skrift" value={settings.duaFont} onPress={() => set({ duaFont: cycle(DUA_FONTS, settings.duaFont) })} />
        <Row label="Oversettelse" value={settings.translation ? 'På' : 'Av'} onPress={() => set({ translation: !settings.translation })} />
        <Row label="Mønster" value={settings.texture ? 'På' : 'Av'} onPress={() => set({ texture: !settings.texture })} />
        <Row
          label="Forhåndsvis"
          value={settings.preview ? SCREEN_NAMES[settings.preview] : 'Automatisk'}
          onPress={() => set({ preview: cycle(PREVIEWS, settings.preview) })}
        />
        <Row label="Ferdig" value="" onPress={onClose} />
      </View>
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
  const screen = settings.preview ?? pickScreen({ ...data.state, now, duaUntil }, settings.base);
  const Screen = SCREENS[screen];
  return (
    <Screen
      now={now}
      mosque={data.mosque}
      state={{ ...data.state, now, duaUntil }}
      brand={brand}
      art={settings.art}
      duaFont={settings.duaFont}
      translation={settings.translation}
      texture={settings.texture}
      hall={settings.hall}
      pauses={taraweeh.night === data.nightKey ? taraweeh.pauses : 1}
    />
  );
}

function Root() {
  useKeepAwake();
  const now = useClock();
  const hydrated = useHydrated();
  const orgNr = useTvSettings((state) => state.orgNr);
  const [setup, setSetup] = useState(false);
  const { data } = useTvData(orgNr, now);
  const screen = data
    ? pickScreen({ ...data.state, now, duaUntil: useTaraweeh.getState().duaUntil ? new Date(useTaraweeh.getState().duaUntil as number) : null }, useTvSettings.getState().base)
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
  if (setup || !orgNr) return <Setup onClose={() => setSetup(false)} />;
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
  setup: { width: 1920, height: 1080, backgroundColor: ink.page, paddingVertical: 72, paddingHorizontal: 240, gap: 32 },
  setupTitle: { fontSize: 64, fontWeight: '800', color: ink.text },
  list: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    height: 76,
    paddingHorizontal: 32,
    borderRadius: 20,
    marginBottom: 8,
    backgroundColor: ink.card,
    borderWidth: 2,
    borderColor: ink.line,
  },
  rowFocused: { backgroundColor: ink.text, borderColor: ink.text },
  rowLabel: { fontSize: 34, fontWeight: '700', color: ink.text, flex: 1 },
  rowValue: { fontSize: 30, color: ink.muted, maxWidth: 900 },
  rowTextFocused: { color: ink.white },
});
