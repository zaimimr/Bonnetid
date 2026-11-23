import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useTVEventHandler, View } from 'react-native';
import { T } from './kit';
import { SCREEN_NAMES, SCREENS } from './screens';
import { ART_OPTIONS, DUA_FONTS, HALL_OPTIONS, useTaraweeh, useTvSettings } from './settings';
import { BRAND_OPTIONS, brandColors, ink } from './theme';
import { pickScreen, type BaseScreen, type ScreenId } from './tvModel';
import { useMosqueList, useTvData } from './useTvData';

type Choice = { name: string; help?: string; swatch?: string; font?: string };

type Setting = {
  key: string;
  label: string;
  help: string;
  screen: ScreenId;
  value: string;
  choices?: Choice[];
  index?: number;
  pick?: (index: number) => void;
  press?: () => void;
};

const BASES: { id: BaseScreen; help: string }[] = [
  { id: 'main', help: 'Alle dagens bønnetider i stort format. Passer i bønnesalen.' },
  { id: 'lobby', help: 'Neste bønn, dagens tider og kunngjøringer. Passer ved inngangen.' },
  { id: 'plakat', help: 'Kunngjøringer og Vipps-kode i stort format.' },
  { id: 'rad', help: 'Dagens tider med en tegning og navnet på rommet.' },
];
const BRAND_NAMES = ['Grønn', 'Blå', 'Vinrød', 'Lilla'];
const ART_NAMES = ['Moské', 'Kaaba', 'Lykt', 'Måne og stjerner', 'Ingen tegning'];
const FONT_NAMES = ['Amiri', 'Scheherazade', 'Naskh', 'Kufi', 'Ruqaa', 'Nastaliq'];
const SHOW_HIDE: Choice[] = [{ name: 'Vis' }, { name: 'Skjul' }];
const PREVIEWS = Object.keys(SCREENS) as ScreenId[];
const SCALE = 0.5;

function Row({
  setting,
  focused,
  first,
  onFocus,
}: {
  setting: Setting;
  focused: boolean;
  first: boolean;
  onFocus: () => void;
}) {
  const onPress = setting.press ?? (() => setting.pick?.(((setting.index ?? 0) + 1) % (setting.choices?.length ?? 1)));
  const arrows = focused && setting.choices && setting.choices.length > 1;
  return (
    <Pressable onPress={onPress} onFocus={onFocus} hasTVPreferredFocus={first} style={[s.row, focused && s.rowFocused]}>
      <T style={[s.rowLabel, focused && s.onDark]} lines={1}>
        {setting.label}
      </T>
      <T style={[s.rowValue, focused && s.onDark]} lines={1}>
        {arrows ? `‹  ${setting.value}  ›` : setting.value}
      </T>
    </Pressable>
  );
}

function Preview({ screen, now }: { screen: ScreenId; now: Date }) {
  const settings = useTvSettings();
  const pauses = useTaraweeh((state) => state.pauses);
  const { data } = useTvData(settings.orgNr, now);
  const brand = useMemo(() => brandColors(settings.brand), [settings.brand]);
  if (!data) {
    return (
      <View style={[s.frame, s.frameEmpty]}>
        <T style={s.help}>Henter bønnetider</T>
      </View>
    );
  }
  const Screen = SCREENS[screen];
  return (
    <View style={s.frame}>
      <View style={s.stage}>
        <Screen
          now={now}
          mosque={data.mosque}
          state={{ ...data.state, now, duaUntil: null }}
          brand={brand}
          art={settings.art}
          duaFont={settings.duaFont}
          translation={settings.translation}
          texture={settings.texture}
          hall={settings.hall}
          pauses={Math.max(1, pauses)}
        />
      </View>
    </View>
  );
}

export function MosquePicker({ onDone }: { onDone: () => void }) {
  const list = useMosqueList();
  const orgNr = useTvSettings((state) => state.orgNr);
  const set = useTvSettings((state) => state.set);
  const mosques = useMemo(
    () => [...(list.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'nb')),
    [list.data],
  );
  return (
    <View style={s.page}>
      <View style={s.pickerHead}>
        <T style={s.title}>Velg moské</T>
        <T style={s.help}>Bønnetidene på skjermen hentes fra moskeen du velger. Bla med ▲ ▼ og trykk OK.</T>
      </View>
      {list.data ? (
        <ScrollView style={s.pickerList}>
          {mosques.map((item, index) => (
            <Pressable
              key={item.org_nr}
              hasTVPreferredFocus={orgNr ? item.org_nr === orgNr : index === 0}
              onPress={() => {
                set({ orgNr: item.org_nr });
                onDone();
              }}
              style={({ focused }) => [s.row, s.pickerRow, focused && s.rowFocused]}
            >
              {({ focused }) => (
                <>
                  <T style={[s.rowLabel, focused && s.onDark]} lines={1}>
                    {item.name}
                  </T>
                  <T style={[s.rowValue, focused && s.onDark]} lines={1}>
                    {item.address ?? ''}
                  </T>
                </>
              )}
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <T style={s.help}>{list.isError ? 'Fikk ikke hentet moskeene. Prøver igjen snart.' : 'Henter moskeer'}</T>
      )}
    </View>
  );
}

export function Setup({ now, onClose }: { now: Date; onClose: () => void }) {
  const settings = useTvSettings();
  const list = useMosqueList();
  const { data } = useTvData(settings.orgNr, now);
  const [picking, setPicking] = useState(settings.orgNr == null);
  const [focusKey, setFocusKey] = useState('mosque');
  const { set } = settings;
  const auto = data ? pickScreen({ ...data.state, now, duaUntil: null }, settings.base) : settings.base;
  const close = () => {
    set({ preview: null });
    onClose();
  };

  const baseIndex = Math.max(0, BASES.findIndex((base) => base.id === settings.base));
  const brandIndex = Math.max(0, BRAND_OPTIONS.indexOf(settings.brand as (typeof BRAND_OPTIONS)[number]));
  const artIndex = ART_OPTIONS.indexOf(settings.art);
  const hallIndex = Math.max(0, HALL_OPTIONS.indexOf(settings.hall as (typeof HALL_OPTIONS)[number]));
  const fontIndex = DUA_FONTS.indexOf(settings.duaFont);
  const previewIndex = settings.preview ? PREVIEWS.indexOf(settings.preview) + 1 : 0;
  const mosque = list.data?.find((item) => item.org_nr === settings.orgNr);

  const all: (Setting | false)[] = [
    {
      key: 'mosque',
      label: 'Moské',
      help: 'Bønnetidene på skjermen hentes fra denne moskeen. Trykk OK for å velge en annen.',
      screen: settings.base,
      value: mosque?.name ?? '',
      press: () => setPicking(true),
    },
    {
      key: 'base',
      label: 'Skjermtype',
      help: 'Hva skjermen viser til vanlig. Ved iqamah, Jumuah, Ramadan og om natten bytter den selv.',
      screen: settings.base,
      value: SCREEN_NAMES[settings.base],
      choices: BASES.map((base) => ({ name: SCREEN_NAMES[base.id], help: base.help })),
      index: baseIndex,
      pick: (index) => set({ base: BASES[index].id }),
    },
    {
      key: 'brand',
      label: 'Farge',
      help: 'Hovedfargen på skjermen.',
      screen: settings.base,
      value: BRAND_NAMES[brandIndex],
      choices: BRAND_OPTIONS.map((hex, index) => ({ name: BRAND_NAMES[index], swatch: hex })),
      index: brandIndex,
      pick: (index) => set({ brand: BRAND_OPTIONS[index] }),
    },
    settings.base === 'rad' && {
      key: 'art',
      label: 'Tegning',
      help: 'Tegningen som vises på skjermen.',
      screen: 'rad',
      value: ART_NAMES[artIndex],
      choices: ART_NAMES.map((name) => ({ name })),
      index: artIndex,
      pick: (index) => set({ art: ART_OPTIONS[index] }),
    },
    settings.base === 'rad' && {
      key: 'hall',
      label: 'Navn på rommet',
      help: 'Vises øverst på skjermen, under navnet på moskeen.',
      screen: 'rad',
      value: settings.hall,
      choices: HALL_OPTIONS.map((name) => ({ name })),
      index: hallIndex,
      pick: (index) => set({ hall: HALL_OPTIONS[index] }),
    },
    {
      key: 'texture',
      label: 'Mønster i bakgrunnen',
      help: 'Et svakt islamsk stjernemønster bak innholdet.',
      screen: settings.base,
      value: settings.texture ? 'Vis' : 'Skjul',
      choices: SHOW_HIDE,
      index: settings.texture ? 0 : 1,
      pick: (index) => set({ texture: index === 0 }),
    },
    {
      key: 'font',
      label: 'Skrift for duaen',
      help: 'Under Ramadan vises duaen mellom hver fjerde rakat i taraweeh. Velg skriften den vises med.',
      screen: 'dua',
      value: FONT_NAMES[fontIndex],
      choices: DUA_FONTS.map((font, index) => ({ name: FONT_NAMES[index], font: `${font}_400Regular` })),
      index: fontIndex,
      pick: (index) => set({ duaFont: DUA_FONTS[index] }),
    },
    {
      key: 'translation',
      label: 'Norsk oversettelse av duaen',
      help: 'Viser norsk tekst under den arabiske duaen.',
      screen: 'dua',
      value: settings.translation ? 'Vis' : 'Skjul',
      choices: SHOW_HIDE,
      index: settings.translation ? 0 : 1,
      pick: (index) => set({ translation: index === 0 }),
    },
    {
      key: 'preview',
      label: 'Se de andre skjermene',
      help: 'Skjermen bytter selv gjennom dagen. Her kan du se hvordan hver av dem ser ut. Det endrer ingenting.',
      screen: settings.preview ?? auto,
      value: settings.preview ? SCREEN_NAMES[settings.preview] : 'Akkurat nå',
      choices: [{ name: 'Akkurat nå' }, ...PREVIEWS.map((id) => ({ name: SCREEN_NAMES[id] }))],
      index: previewIndex,
      pick: (index) => set({ preview: index === 0 ? null : PREVIEWS[index - 1] }),
    },
    {
      key: 'done',
      label: 'Ferdig',
      help: 'Alt er lagret. Trykk OK for å gå tilbake til skjermen.',
      screen: auto,
      value: '',
      press: close,
    },
  ];
  const rows = all.filter((row): row is Setting => row !== false);
  const focused = rows.find((row) => row.key === focusKey) ?? rows[0];

  useTVEventHandler((event) => {
    if (picking || !focused.choices || !focused.pick) return;
    const length = focused.choices.length;
    const index = focused.index ?? 0;
    if (event.eventType === 'right') focused.pick((index + 1) % length);
    if (event.eventType === 'left') focused.pick((index - 1 + length) % length);
  });

  if (picking) return <MosquePicker onDone={() => setPicking(false)} />;

  return (
    <View style={[s.page, s.split]}>
      <View style={s.left}>
        <T style={s.title}>Innstillinger</T>
        <View style={s.rows}>
          {rows.map((row, index) => (
            <Row
              key={row.key}
              setting={row}
              first={index === 0}
              focused={row.key === focused.key}
              onFocus={() => setFocusKey(row.key)}
            />
          ))}
        </View>
      </View>
      <View style={s.right}>
        <Preview screen={focused.screen} now={now} />
        <T style={s.focusLabel}>{focused.label}</T>
        <T style={s.help}>{focused.choices?.[focused.index ?? 0]?.help ?? focused.help}</T>
        {focused.choices ? (
          <View style={s.chips}>
            {focused.choices.map((choice, index) => {
              const on = index === focused.index;
              return (
                <View key={choice.name} style={[s.chip, on && s.chipOn]}>
                  {choice.swatch ? <View style={[s.swatch, { backgroundColor: choice.swatch }]} /> : null}
                  <T style={[s.chipText, on && s.onDark]}>{choice.name}</T>
                  {choice.font ? <Text style={[s.sample, { fontFamily: choice.font }, on && s.onDark]}>الله</Text> : null}
                </View>
              );
            })}
          </View>
        ) : null}
        <View style={s.hintBox}>
          <T style={s.hint}>▲ ▼ flytter mellom innstillingene. OK eller ◀ ▶ bytter valg. Alt lagres med en gang.</T>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { width: 1920, height: 1080, backgroundColor: ink.page, paddingHorizontal: 56, paddingVertical: 48 },
  split: { flexDirection: 'row', gap: 48 },
  left: { width: 800, gap: 24 },
  right: { flex: 1, gap: 20 },
  title: { fontSize: 56, fontWeight: '800', color: ink.text },
  rows: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    height: 80,
    paddingHorizontal: 28,
    borderRadius: 20,
    backgroundColor: ink.card,
    borderWidth: 2,
    borderColor: ink.line,
  },
  rowFocused: { backgroundColor: ink.text, borderColor: ink.text },
  rowLabel: { fontSize: 34, fontWeight: '700', color: ink.text, flexShrink: 0 },
  rowValue: { fontSize: 32, color: ink.body, flex: 1, textAlign: 'right' },
  onDark: { color: ink.white },
  hintBox: { flex: 1, justifyContent: 'flex-end' },
  hint: { fontSize: 28, lineHeight: 38, color: ink.body },
  frame: {
    width: 1920 * SCALE,
    height: 1080 * SCALE,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: ink.line,
    backgroundColor: ink.card,
  },
  frameEmpty: { alignItems: 'center', justifyContent: 'center' },
  stage: {
    position: 'absolute',
    width: 1920,
    height: 1080,
    left: (1920 * (SCALE - 1)) / 2,
    top: (1080 * (SCALE - 1)) / 2,
    transform: [{ scale: SCALE }],
  },
  focusLabel: { fontSize: 44, fontWeight: '800', color: ink.text, marginTop: 8 },
  help: { fontSize: 32, lineHeight: 44, color: ink.body },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 60,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: ink.line,
    backgroundColor: ink.card,
  },
  chipOn: { backgroundColor: ink.text, borderColor: ink.text },
  chipText: { fontSize: 28, fontWeight: '600', color: ink.text },
  sample: { fontSize: 30, color: ink.text },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: ink.white },
  pickerHead: { gap: 12, marginBottom: 24, maxWidth: 1400 },
  pickerList: { flex: 1 },
  pickerRow: { marginBottom: 8 },
});
