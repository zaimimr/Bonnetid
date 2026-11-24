import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, TVEventControl, useTVEventHandler, View } from 'react-native';
import { Qr, T } from './kit';
import { newPair, pairUrl } from './remote';
import { SCREEN_NAMES, SCREENS } from './screens';
import {
  ART_OPTIONS,
  DUA_FONTS,
  HALL_OPTIONS,
  IQAMAH_LEADS,
  rotationOf,
  screenOptionsOf,
  useTaraweeh,
  useTvSettings,
  type HideKey,
} from './settings';
import { BRAND_OPTIONS, brandColors, ink } from './theme';
import { ROTATION_SECONDS, rotationScreen, rotationSlot, type BaseScreen, type ScreenId } from './tvModel';
import { useMosqueList, useTvData } from './useTvData';

type Choice = { name: string; help?: string; swatch?: string; font?: string };

type Item = {
  key: string;
  label: string;
  help: string;
  screen?: ScreenId;
  value?: string;
  checked?: boolean;
  swatch?: string;
  preferred?: boolean;
  choices?: Choice[];
  index?: number;
  pick?: (index: number) => void;
  press?: () => void;
  move?: (dir: -1 | 1) => void;
  focus?: () => void;
  play?: boolean;
};

type PageSpec = {
  title: string;
  lead?: string;
  items: Item[];
  play?: boolean;
  orgNr?: string | null;
  hint?: string;
  qr?: string | null;
};

const BASES: BaseScreen[] = ['main', 'lobby', 'plakat', 'rad'];
const BASE_HELP: Record<BaseScreen, string> = {
  main: 'Alle dagens bønnetider i stort format. Passer i bønnesalen.',
  lobby: 'Neste bønn, dagens tider og kunngjøringer. Passer ved inngangen.',
  plakat: 'Kunngjøringer og Vipps-kode i stort format.',
  rad: 'Dagens tider med en tegning og navnet på rommet.',
};
const AUTO_HELP = 'Kommer av seg selv når det er tid: Iqamah, Jumuah, Ramadan, natt og Eid.';
const PLACES: { name: string; help: string; rotation: BaseScreen[]; seconds?: number; hall?: string }[] = [
  { name: 'Bønnesal', help: 'Viser alle dagens bønnetider i stort format.', rotation: ['main'] },
  { name: 'Inngang', help: 'Bytter mellom neste bønn og kunngjøringer hvert 20. sekund.', rotation: ['lobby', 'plakat'], seconds: 20 },
  { name: 'Kvinneavdeling', help: 'Dagens tider med navnet på rommet øverst.', rotation: ['rad'], hall: 'Kvinneavdelingen' },
  {
    name: 'Kafé eller annet rom',
    help: 'Bytter mellom kunngjøringer, neste bønn og alle dagens tider.',
    rotation: ['plakat', 'lobby', 'main'],
    seconds: 20,
  },
];
const SECONDS_SUB: Record<number, string> = { 10: 'Raskt', 20: 'Anbefalt', 30: 'Rolig', 60: 'Svært rolig' };
const BRAND_NAMES = ['Grønn', 'Blå', 'Vinrød', 'Lilla'];
const ART_NAMES = ['Moské', 'Kaaba', 'Lykt', 'Måne og stjerner', 'Ingen tegning'];
const FONT_NAMES = ['Amiri', 'Scheherazade', 'Naskh', 'Kufi', 'Ruqaa', 'Nastaliq'];
const CUSTOMIZABLE: ScreenId[] = ['main', 'lobby', 'plakat', 'rad', 'iqamah', 'jumuah', 'dua', 'hvile'];
const WIZARD_STEP: Record<string, number> = {
  'w-city': 1,
  'w-mosque': 1,
  'w-place': 2,
  'w-rotation': 3,
  'w-seconds': 4,
  'w-color': 5,
  'w-done': 6,
};
const SCALE = 0.5;
const HINT = '▲ ▼ flytter. OK velger. Tilbake-knappen går ett steg tilbake. Alt lagres med en gang.';

function joinNames(names: string[]): string {
  if (names.length < 2) return names.join('');
  return `${names.slice(0, -1).join(', ')} og ${names[names.length - 1]}`;
}

function placeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (match, gap: string, letter: string) => gap + letter.toUpperCase())
    .replace(/ (I|Og|På) /g, (word) => word.toLowerCase());
}

function countMosques(count: number): string {
  return `${count} ${count === 1 ? 'moské' : 'moskeer'}`;
}

function Row({ item, focused, onFocus }: { item: Item; focused: boolean; onFocus: () => void }) {
  const onPress = item.press ?? (() => item.pick?.(((item.index ?? 0) + 1) % (item.choices?.length ?? 1)));
  const arrows = focused && item.choices && item.choices.length > 1;
  return (
    <Pressable onPress={onPress} onFocus={onFocus} hasTVPreferredFocus={item.preferred} style={[s.row, focused && s.rowFocused]}>
      {item.checked != null ? (
        <View style={[s.box, item.checked && s.boxOn, focused && s.boxFocused]}>
          {item.checked ? <T style={s.check}>✓</T> : null}
        </View>
      ) : null}
      {item.swatch ? <View style={[s.swatch, { backgroundColor: item.swatch }]} /> : null}
      <T style={[s.rowLabel, focused && s.onDark]} lines={1}>
        {item.label}
      </T>
      <T style={[s.rowValue, focused && s.onDark]} lines={1}>
        {arrows ? `‹  ${item.value ?? ''}  ›` : (item.value ?? '')}
      </T>
    </Pressable>
  );
}

function Preview({ screen, play, orgNr, now }: { screen: ScreenId; play: boolean; orgNr: string | null; now: Date }) {
  const settings = useTvSettings();
  const pauses = useTaraweeh((state) => state.pauses);
  const { data } = useTvData(orgNr, now);
  const brand = useMemo(() => brandColors(settings.brand), [settings.brand]);
  const rotation = rotationOf(settings);
  const playing = play && rotation.screens.length > 1;
  const shown = playing ? rotationScreen(rotation, now) : screen;
  const slot = rotationSlot(rotation, now);
  const period = rotation.seconds * 1000;
  const progress = ((now.getTime() % period) + 1000) / period;
  const Screen = SCREENS[shown];
  return (
    <View style={s.previewBox}>
      {data ? (
        <View style={s.frame}>
          <View style={s.stage}>
            <Screen
              now={now}
              mosque={data.mosque}
              state={{ ...data.state, now, duaUntil: null }}
              brand={brand}
              {...screenOptionsOf(settings)}
              pauses={Math.max(1, pauses)}
            />
          </View>
        </View>
      ) : (
        <View style={[s.frame, s.frameEmpty]}>
          <T style={s.help}>{orgNr ? 'Henter bønnetider' : 'Velg en moské for å se skjermen'}</T>
        </View>
      )}
      {playing ? (
        <View style={s.segments}>
          {rotation.screens.map((id, index) => (
            <View key={id} style={s.segment}>
              <View style={s.track}>
                <View style={[s.fill, { width: `${index === slot ? Math.min(1, progress) * 100 : index < slot ? 100 : 0}%` }]} />
              </View>
              <T style={[s.segmentLabel, index === slot && s.segmentOn]} lines={1}>
                {SCREEN_NAMES[id]}
              </T>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Page({ spec, step, note, now }: { spec: PageSpec; step?: number; note?: string; now: Date }) {
  const initial = spec.items.find((item) => item.preferred) ?? spec.items[0];
  const [focusKey, setFocusKey] = useState(initial?.key ?? '');
  const orgNr = useTvSettings((state) => state.orgNr);
  const focused = spec.items.find((item) => item.key === focusKey) ?? initial;
  const items = spec.items.map((item) => (item.key === initial?.key ? { ...item, preferred: true } : { ...item, preferred: false }));

  useTVEventHandler((event) => {
    if (!focused || (event.eventType !== 'left' && event.eventType !== 'right')) return;
    const dir = event.eventType === 'right' ? 1 : -1;
    if (focused.choices && focused.pick) {
      const length = focused.choices.length;
      focused.pick(((focused.index ?? 0) + dir + length) % length);
      return;
    }
    focused.move?.(dir);
  });

  const helpText = focused?.choices?.[focused.index ?? 0]?.help ?? focused?.help ?? '';
  return (
    <View style={[s.page, s.split]}>
      <View style={s.left}>
        {step ? <T style={s.step}>{`Steg ${step} av 6`}</T> : null}
        <T style={s.title}>{spec.title}</T>
        {spec.lead ? <T style={s.lead}>{spec.lead}</T> : null}
        <ScrollView style={s.list} contentContainerStyle={s.rows}>
          {items.map((item) => (
            <Row
              key={item.key}
              item={item}
              focused={item.key === focused?.key}
              onFocus={() => {
                setFocusKey(item.key);
                item.focus?.();
              }}
            />
          ))}
        </ScrollView>
      </View>
      <View style={s.right}>
        {spec.qr !== undefined ? (
          <View style={[s.frame, s.frameEmpty]}>{spec.qr ? <Qr value={spec.qr} size={480} /> : <T style={s.help}>Lager kode</T>}</View>
        ) : (
          <Preview screen={focused?.screen ?? 'main'} play={focused?.play ?? spec.play ?? false} orgNr={spec.orgNr ?? orgNr} now={now} />
        )}
        {focused ? <T style={s.focusLabel}>{focused.label}</T> : null}
        <T style={s.help}>{helpText}</T>
        {note ? <T style={s.note}>{note}</T> : null}
        {focused?.choices ? (
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
          <T style={s.hint}>{spec.hint ?? HINT}</T>
        </View>
      </View>
    </View>
  );
}

type Tile = { key: string; label: string; value: string; swatch?: string; press: () => void };

function Menu({ tiles, onDone, onNewCode, qr, now }: { tiles: Tile[]; onDone: () => void; onNewCode: () => void; qr: string | null; now: Date }) {
  const orgNr = useTvSettings((state) => state.orgNr);
  const [focus, setFocus] = useState('');
  return (
    <View style={[s.page, s.split]}>
      <View style={s.left}>
        <T style={s.menuTitle}>Innstillinger</T>
        <View style={s.tiles}>
          {tiles.map((tile, index) => (
            <Pressable
              key={tile.key}
              onPress={tile.press}
              onFocus={() => setFocus(tile.key)}
              hasTVPreferredFocus={index === 0}
              style={[s.tile, focus === tile.key && s.tileFocused]}
            >
              <T style={[s.tileLabel, focus === tile.key && s.onDarkMuted]}>{tile.label}</T>
              <View style={s.tileValueRow}>
                {tile.swatch ? <View style={[s.bigSwatch, { backgroundColor: tile.swatch }]} /> : null}
                <T style={[s.tileValue, focus === tile.key && s.onDark]} lines={1}>
                  {tile.value}
                </T>
                <T style={[s.chevron, focus === tile.key && s.onDark]}>›</T>
              </View>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={onDone} onFocus={() => setFocus('done')} style={[s.done, focus === 'done' && s.doneFocused]}>
          <T style={s.doneText}>Ferdig</T>
        </Pressable>
      </View>
      <View style={s.right}>
        <Preview screen="main" play orgNr={orgNr} now={now} />
        <View style={s.phoneCard}>
          <View style={s.qrBox}>{qr ? <Qr value={qr} size={220} /> : null}</View>
          <View style={s.phoneText}>
            <T style={s.phoneTitle}>Eller bruk mobilen</T>
            <T style={s.help}>Pek kameraet på mobilen mot koden.</T>
            <Pressable onPress={onNewCode} onFocus={() => setFocus('code')} style={[s.codeButton, focus === 'code' && s.tileFocused]}>
              <T style={[s.codeText, focus === 'code' && s.onDark]}>Lag ny kode</T>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export function Setup({ now, onClose }: { now: Date; onClose: () => void }) {
  const settings = useTvSettings();
  const list = useMosqueList();
  const [route, setRoute] = useState<string[]>(() => [settings.configured && settings.orgNr ? 'menu' : 'w-start']);
  const [city, setCity] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<string | null>(null);
  const [note, setNote] = useState<string | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { set } = settings;
  const top = route[route.length - 1];
  const wizard = top.startsWith('w-');

  const go = (next: string) => {
    setNote(undefined);
    setRoute([...route, next]);
  };
  const back = () => {
    setNote(undefined);
    if (route.length > 1) {
      setRoute(route.slice(0, -1));
      return;
    }
    if (settings.configured && settings.orgNr) close();
  };
  const close = () => {
    set({ preview: null });
    onClose();
  };
  const onBack = useEffectEvent(back);

  useEffect(() => {
    TVEventControl.enableTVMenuKey();
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => {
      sub.remove();
      TVEventControl.disableTVMenuKey();
    };
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    if (top === 'menu' && !useTvSettings.getState().pairId) newPair();
  }, [top]);

  const cities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const mosque of list.data ?? []) {
      const name = mosque.post?.city ?? 'Andre steder';
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'nb'));
  }, [list.data]);
  const current = list.data?.find((mosque) => mosque.org_nr === settings.orgNr);
  const rotationNames = settings.rotation.map((id) => SCREEN_NAMES[id]);
  const brandIndex = Math.max(0, BRAND_OPTIONS.indexOf(settings.brand as (typeof BRAND_OPTIONS)[number]));
  const secondsIndex = Math.max(0, ROTATION_SECONDS.indexOf(settings.seconds as (typeof ROTATION_SECONDS)[number]));

  const preview = (orgNr: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCandidate(orgNr), 700);
  };

  const toggle = (key: HideKey): Item => {
    const shown = !settings.hide.includes(key);
    return {
      key,
      label: '',
      help: '',
      checked: shown,
      value: shown ? 'Vises' : 'Skjult',
      press: () => set({ hide: shown ? [...settings.hide, key] : settings.hide.filter((item) => item !== key) }),
    };
  };
  const shown = (key: HideKey, label: string, help: string, screen: ScreenId): Item => ({ ...toggle(key), label, help, screen });
  const choice = <V,>(
    key: string,
    label: string,
    help: string,
    screen: ScreenId,
    options: readonly V[],
    names: string[],
    value: V,
    apply: (value: V) => void,
    extra?: (index: number) => Partial<Choice>,
  ): Item => {
    const index = Math.max(0, options.indexOf(value));
    return {
      key,
      label,
      help,
      screen,
      value: names[index],
      choices: names.map((name, i) => ({ name, ...extra?.(i) })),
      index,
      pick: (i) => apply(options[i]),
    };
  };
  const visibility = (key: string, label: string, help: string, screen: ScreenId, value: boolean, apply: (value: boolean) => void): Item => ({
    key,
    label,
    help,
    screen,
    checked: value,
    value: value ? 'Vises' : 'Skjult',
    press: () => apply(!value),
  });

  const rotationItems = (): Item[] => {
    const order = [...settings.rotation, ...BASES.filter((id) => !settings.rotation.includes(id))];
    return order.map((id) => {
      const position = settings.rotation.indexOf(id);
      const on = position >= 0;
      return {
        key: id,
        label: SCREEN_NAMES[id],
        help: BASE_HELP[id],
        screen: id,
        checked: on,
        value: on ? `Nr. ${position + 1}` : 'Av',
        press: () => {
          if (on && settings.rotation.length === 1) {
            setNote('Minst én skjerm må være på.');
            return;
          }
          setNote(undefined);
          set({ rotation: on ? settings.rotation.filter((item) => item !== id) : [...settings.rotation, id] });
        },
        move: (dir) => {
          const target = position + dir;
          if (!on || target < 0 || target >= settings.rotation.length) return;
          const next = [...settings.rotation];
          next[position] = next[target];
          next[target] = id;
          set({ rotation: next });
        },
      };
    });
  };
  const rotationHint = 'OK slår skjermen av eller på. ◀ ▶ flytter den frem eller bak i rekkefølgen. Tilbake-knappen går ett steg tilbake.';

  const cityPage = (title: string, step: string): PageSpec => ({
    title,
    lead: 'Velg stedet moskeen ligger.',
    orgNr: settings.orgNr,
    items: list.data
      ? cities.map(([name, count]) => ({
          key: name,
          label: placeName(name),
          help: `${countMosques(count)} i ${placeName(name)}.`,
          value: countMosques(count),
          preferred: current?.post?.city === name,
          press: () => {
            setCity(name);
            setCandidate(null);
            go(step);
          },
        }))
      : [
          {
            key: 'loading',
            label: list.isError ? 'Fikk ikke hentet moskeene' : 'Henter moskeer',
            help: list.isError ? 'Prøver igjen snart.' : '',
          },
        ],
  });
  const mosquePage = (after: () => void): PageSpec => ({
    title: city ? placeName(city) : 'Moské',
    lead: 'Velg moskeen. Skjermen til høyre viser bønnetidene dens.',
    orgNr: candidate ?? settings.orgNr,
    items: (list.data ?? [])
      .filter((mosque) => (mosque.post?.city ?? 'Andre steder') === city)
      .sort((a, b) => a.name.localeCompare(b.name, 'nb'))
      .map((mosque) => ({
        key: mosque.org_nr,
        label: mosque.name,
        value: mosque.address ?? '',
        help: [mosque.address, mosque.post ? `${mosque.post.code} ${placeName(mosque.post.city)}` : null].filter(Boolean).join(', '),
        preferred: mosque.org_nr === settings.orgNr,
        focus: () => preview(mosque.org_nr),
        press: () => {
          set({ orgNr: mosque.org_nr });
          setCandidate(null);
          after();
        },
      })),
  });

  const screenPage = (id: ScreenId): PageSpec => {
    const pages: Record<ScreenId, Item[]> = {
      main: [
        shown('main.fajrEnd', 'Fajr slutter', 'Viser når tiden for Fajr er ute.', 'main'),
        shown('main.timeline', 'Tidslinje', 'En linje nederst som viser hvor langt dagen har kommet.', 'main'),
        shown('main.note', 'Kunngjøring og Vipps', 'Moskeens kunngjøring og Vipps-nummer.', 'main'),
        shown('main.hijri', 'Hijri-dato', 'Den islamske datoen ved siden av vanlig dato.', 'main'),
      ],
      lobby: [
        shown('lobby.times', 'Dagens tider', 'Alle dagens bønnetider i en liste.', 'lobby'),
        shown('lobby.note', 'Kunngjøring', 'Moskeens kunngjøring.', 'lobby'),
        shown('lobby.vipps', 'Vipps-kode', 'Vipps-nummeret for gaver.', 'lobby'),
      ],
      plakat: [
        shown('plakat.note', 'Kunngjøring', 'Moskeens kunngjøring.', 'plakat'),
        shown('plakat.vipps', 'Vipps-kode', 'Vipps-nummeret for gaver.', 'plakat'),
      ],
      rad: [
        choice('art', 'Tegning', 'Tegningen som vises på skjermen.', 'rad', ART_OPTIONS, ART_NAMES, settings.art, (art) => set({ art })),
        choice(
          'hall',
          'Navn på rommet',
          'Vises øverst, under navnet på moskeen.',
          'rad',
          HALL_OPTIONS,
          [...HALL_OPTIONS],
          settings.hall as (typeof HALL_OPTIONS)[number],
          (hall) => set({ hall }),
        ),
        shown('rad.fajrEnd', 'Fajr slutter', 'Viser når tiden for Fajr er ute.', 'rad'),
        shown('rad.timeline', 'Tidslinje', 'En linje som viser hvor langt dagen har kommet.', 'rad'),
      ],
      iqamah: [
        choice(
          'lead',
          'Start nedtellingen',
          'Hvor lenge før iqamah skjermen begynner å telle ned.',
          'iqamah',
          IQAMAH_LEADS,
          IQAMAH_LEADS.map((minutes) => `${minutes} min før`),
          settings.iqamahLead as (typeof IQAMAH_LEADS)[number],
          (iqamahLead) => set({ iqamahLead }),
        ),
        shown('iqamah.tips', 'Påminnelser', 'Korte påminnelser under nedtellingen, som å slå av mobilen.', 'iqamah'),
      ],
      jumuah: [shown('jumuah.vipps', 'Fredagsinnsamling', 'Vipps-nummeret for fredagsinnsamlingen.', 'jumuah')],
      dua: [
        choice(
          'font',
          'Skrift',
          'Skriften den arabiske duaen vises med.',
          'dua',
          DUA_FONTS,
          FONT_NAMES,
          settings.duaFont,
          (duaFont) => set({ duaFont }),
          (i) => ({ font: `${DUA_FONTS[i]}_400Regular` }),
        ),
        visibility('translation', 'Norsk oversettelse', 'Norsk tekst under den arabiske duaen.', 'dua', settings.translation, (translation) =>
          set({ translation }),
        ),
      ],
      hvile: [
        {
          key: 'dim',
          label: 'Demp skjermen',
          help: 'Gjør skjermen mørkere om natten, fra Isha til Fajr.',
          screen: 'hvile' as const,
          checked: settings.dim,
          value: settings.dim ? 'På' : 'Av',
          press: () => set({ dim: !settings.dim }),
        },
      ],
      ramadan: [],
      taraweeh: [],
      eid: [],
    };
    const items = pages[id];
    return { title: SCREEN_NAMES[id], lead: 'Velg hva som vises. Skjermen til høyre endrer seg med en gang.', items };
  };

  const secondsItems = (after?: () => void): Item[] =>
    ROTATION_SECONDS.map((seconds) => ({
      key: `${seconds}`,
      label: `${seconds} sekunder`,
      value: SECONDS_SUB[seconds],
      help: `Hver skjerm vises i ${seconds} sekunder før neste kommer.`,
      checked: settings.seconds === seconds,
      preferred: settings.seconds === seconds,
      focus: () => set({ seconds }),
      press: after ?? (() => set({ seconds })),
    }));

  const specFor = (key: string): PageSpec => {
    const qr = settings.pairId && settings.pairSecret ? pairUrl(settings.pairId, settings.pairSecret) : null;
    const openPhone = (next: string) => {
      if (!settings.pairId) newPair();
      go(next);
    };
    switch (key) {
      case 'w-start':
        return {
          title: 'Velkommen',
          lead: 'Skjermen viser bønnetidene til moskeen. Hvordan vil du sette den opp?',
          items: [
            {
              key: 'phone',
              label: 'Med mobilen',
              help: 'Skann en kode med mobilen og velg alt der. Enklest hvis du har mobilen for hånden.',
              press: () => openPhone('w-phone'),
            },
            {
              key: 'remote',
              label: 'Med fjernkontrollen',
              help: 'Velg alt her på skjermen, steg for steg.',
              press: () => go('w-city'),
            },
          ],
        };
      case 'w-phone':
        return {
          title: 'Skann koden med mobilen',
          lead: 'Åpne kameraet på mobilen og pek det mot koden. Velg moské på mobilen, så starter skjermen av seg selv innen et halvt minutt.',
          qr,
          items: [{ key: 'remote', label: 'Bruk fjernkontrollen i stedet', help: 'Velg alt her på skjermen, steg for steg.', press: () => go('w-city') }],
        };
      case 'w-city':
        return cityPage('Hvilken moské er skjermen i?', 'w-mosque');
      case 'w-mosque':
        return mosquePage(() => go('w-place'));
      case 'w-place':
        return {
          title: 'Hvor henger skjermen?',
          lead: 'Vi velger skjermene for deg. Du kan endre alt etterpå.',
          items: PLACES.map((place) => ({
            key: place.name,
            label: place.name,
            help: place.help,
            screen: place.rotation[0],
            value: place.rotation.length > 1 || SCREEN_NAMES[place.rotation[0]] !== place.name ? joinNames(place.rotation.map((id) => SCREEN_NAMES[id])) : '',
            press: () => {
              set({
                rotation: place.rotation,
                ...(place.seconds ? { seconds: place.seconds } : {}),
                ...(place.hall ? { hall: place.hall } : {}),
              });
              go('w-rotation');
            },
          })),
        };
      case 'w-rotation':
        return {
          title: 'Hvilke skjermer skal vises?',
          lead: AUTO_HELP,
          hint: rotationHint,
          items: [
            ...rotationItems(),
            {
              key: 'next',
              label: 'Neste',
              help: `Skjermen viser ${joinNames(rotationNames)}.`,
              play: true,
              press: () => go(settings.rotation.length > 1 ? 'w-seconds' : 'w-color'),
            },
          ],
        };
      case 'w-seconds':
        return {
          title: 'Hvor lenge skal hver skjerm vises?',
          lead: 'Se til høyre hvordan skjermene bytter.',
          play: true,
          items: secondsItems(() => go('w-color')),
        };
      case 'w-color':
        return {
          title: 'Hvilken farge?',
          lead: 'Velg fargen som passer moskeen.',
          play: true,
          items: BRAND_OPTIONS.map((hex, index) => ({
            key: hex,
            label: BRAND_NAMES[index],
            help: 'Fargen brukes på tidene og overskriftene.',
            swatch: hex,
            preferred: index === brandIndex,
            focus: () => set({ brand: hex }),
            press: () => go('w-done'),
          })),
        };
      case 'w-done':
        return {
          title: 'Alt er klart',
          lead: `Skjermen viser ${joinNames(rotationNames)}${settings.rotation.length > 1 ? ` og bytter hvert ${settings.seconds}. sekund` : ''}. ${AUTO_HELP} Hold inne OK på fjernkontrollen når du vil endre noe.`,
          play: true,
          items: [
            {
              key: 'start',
              label: 'Start skjermen',
              help: 'Alt er lagret.',
              press: () => {
                set({ configured: true });
                close();
              },
            },
          ],
        };
      case 'rotation':
        return {
          title: 'Skjermer',
          lead: AUTO_HELP,
          hint: rotationHint,
          items: [
            ...rotationItems(),
            {
              key: 'seconds',
              label: 'Tid per skjerm',
              help: 'Hvor lenge hver skjerm vises før neste kommer.',
              value: `${settings.seconds} sekunder`,
              choices: ROTATION_SECONDS.map((seconds) => ({ name: `${seconds} s`, help: SECONDS_SUB[seconds] })),
              index: secondsIndex,
              play: true,
              pick: (index) => set({ seconds: ROTATION_SECONDS[index] }),
            },
            {
              key: 'details',
              label: 'Velg hva hver skjerm viser',
              value: '›',
              help: 'Slå av og på ting som tider, kunngjøringer og Vipps-kode.',
              press: () => go('screens'),
            },
          ],
        };
      case 'screens':
        return {
          title: 'Tilpass en skjerm',
          items: CUSTOMIZABLE.map((id) => ({
            key: id,
            label: SCREEN_NAMES[id],
            help: settings.rotation.includes(id as BaseScreen) ? 'Med i skjermrunden.' : BASES.includes(id as BaseScreen) ? 'Ikke med i skjermrunden.' : 'Kommer av seg selv når det er tid.',
            screen: id,
            value: '›',
            press: () => go(`screen:${id}`),
          })),
        };
      case 'look':
        return {
          title: 'Farge',
          items: [
            choice('brand', 'Farge', 'Hovedfargen på skjermen.', settings.rotation[0], BRAND_OPTIONS, BRAND_NAMES, settings.brand as (typeof BRAND_OPTIONS)[number], (brand) => set({ brand }), (i) => ({
              swatch: BRAND_OPTIONS[i],
            })),
            visibility('texture', 'Mønster i bakgrunnen', 'Et svakt islamsk stjernemønster bak innholdet.', settings.rotation[0], settings.texture, (texture) =>
              set({ texture }),
            ),
          ],
        };
      case 'city':
        return cityPage('Moské', 'mosque');
      case 'mosque':
        return mosquePage(() => setRoute(['menu']));
      default:
        return screenPage(key.slice('screen:'.length) as ScreenId);
    }
  };

  if (top === 'menu') {
    const qr = settings.pairId && settings.pairSecret ? pairUrl(settings.pairId, settings.pairSecret) : null;
    return (
      <Menu
        now={now}
        qr={qr}
        onDone={close}
        onNewCode={() => {
          newPair();
        }}
        tiles={[
          { key: 'mosque', label: 'Moské', value: current ? placeName(current.name) : 'Velg moské', press: () => go('city') },
          {
            key: 'rotation',
            label: 'Skjermer',
            value: settings.rotation.length > 1 ? `${joinNames(rotationNames)}, ${settings.seconds} sek hver` : rotationNames[0],
            press: () => go('rotation'),
          },
          { key: 'look', label: 'Farge', value: BRAND_NAMES[brandIndex], swatch: settings.brand, press: () => go('look') },
        ]}
      />
    );
  }

  return (
    <Page
      key={`${top}-${list.data ? 'ready' : 'loading'}`}
      spec={specFor(top)}
      step={wizard ? WIZARD_STEP[top] : undefined}
      note={note}
      now={now}
    />
  );
}

const s = StyleSheet.create({
  page: { width: 1920, height: 1080, backgroundColor: ink.page, paddingHorizontal: 56, paddingVertical: 48 },
  split: { flexDirection: 'row', gap: 48 },
  left: { width: 800, gap: 16 },
  right: { flex: 1, gap: 16 },
  step: { fontSize: 28, fontWeight: '700', color: ink.muted },
  title: { fontSize: 52, fontWeight: '800', color: ink.text },
  lead: { fontSize: 30, lineHeight: 42, color: ink.body },
  list: { flex: 1, marginTop: 8 },
  rows: { gap: 8, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    height: 80,
    paddingHorizontal: 28,
    borderRadius: 20,
    backgroundColor: ink.card,
    borderWidth: 2,
    borderColor: ink.line,
  },
  rowFocused: { backgroundColor: ink.text, borderColor: ink.text },
  rowLabel: { fontSize: 34, fontWeight: '700', color: ink.text, flexShrink: 0, maxWidth: 520 },
  rowValue: { fontSize: 30, color: ink.body, flex: 1, textAlign: 'right' },
  onDark: { color: ink.white },
  onDarkMuted: { color: ink.track },
  menuTitle: { fontSize: 64, fontWeight: '800', color: ink.text, marginBottom: 16 },
  tiles: { gap: 16 },
  tile: { height: 150, paddingHorizontal: 36, justifyContent: 'center', gap: 6, borderRadius: 24, backgroundColor: ink.card, borderWidth: 2, borderColor: ink.line },
  tileFocused: { backgroundColor: ink.text, borderColor: ink.text },
  tileLabel: { fontSize: 28, fontWeight: '600', color: ink.muted },
  tileValueRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  tileValue: { flex: 1, fontSize: 44, fontWeight: '800', color: ink.text },
  chevron: { fontSize: 56, color: ink.muted },
  bigSwatch: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: ink.white },
  done: { marginTop: 'auto', height: 110, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: ink.accent, borderWidth: 4, borderColor: ink.accent },
  doneFocused: { backgroundColor: ink.text, borderColor: ink.text },
  doneText: { fontSize: 44, fontWeight: '800', color: ink.white },
  phoneCard: { flexDirection: 'row', gap: 32, alignItems: 'center', padding: 28, borderRadius: 24, backgroundColor: ink.card, borderWidth: 2, borderColor: ink.line },
  qrBox: { width: 220, height: 220 },
  phoneText: { flex: 1, gap: 12, alignItems: 'flex-start' },
  phoneTitle: { fontSize: 40, fontWeight: '800', color: ink.text },
  codeButton: { marginTop: 8, height: 64, paddingHorizontal: 28, borderRadius: 32, justifyContent: 'center', borderWidth: 2, borderColor: ink.line },
  codeText: { fontSize: 28, fontWeight: '700', color: ink.text },
  box: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: ink.mark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: ink.text, borderColor: ink.text },
  boxFocused: { borderColor: ink.white },
  check: { fontSize: 26, fontWeight: '800', color: ink.white },
  hintBox: { flex: 1, justifyContent: 'flex-end' },
  hint: { fontSize: 28, lineHeight: 38, color: ink.body },
  previewBox: { gap: 12 },
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
  segments: { flexDirection: 'row', gap: 12, width: 1920 * SCALE },
  segment: { flex: 1, gap: 6 },
  track: { height: 8, borderRadius: 4, backgroundColor: ink.track, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: ink.text },
  segmentLabel: { fontSize: 22, color: ink.muted },
  segmentOn: { color: ink.text, fontWeight: '700' },
  focusLabel: { fontSize: 40, fontWeight: '800', color: ink.text, marginTop: 4 },
  help: { fontSize: 30, lineHeight: 42, color: ink.body },
  note: { fontSize: 30, fontWeight: '700', color: ink.gold800 },
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
});
