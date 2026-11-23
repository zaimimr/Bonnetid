import { formatGregorianShort, formatHijri, weekdayName } from '@/lib/hijri';
import { vippsUrlFrom } from '@/lib/mosqueDonations';
import { formatDurationShort } from '@/lib/time';
import type { Mosque } from '@/api/types';
import { StyleSheet, View, type TextStyle } from 'react-native';
import {
  Art,
  B,
  Card,
  clockOf,
  Glyph,
  Header,
  Label,
  Pattern,
  Pill,
  PRAYER_GLYPH,
  PrayerRows,
  Qr,
  Strip,
  styles as kit,
  T,
  Timeline,
  type StripItem,
} from './kit';
import type { ArtChoice, DuaFont, HideKey } from './settings';
import { ink, type Brand } from './theme';
import {
  nowAndNext,
  pauseInfo,
  taraweehStart,
  TARAWEEH_RAKAT,
  type ScreenId,
  type TvDay,
  type TvPrayer,
  type TvState,
} from './tvModel';

export type Ctx = {
  now: Date;
  mosque: Mosque;
  state: TvState;
  brand: Brand;
  art: ArtChoice;
  duaFont: DuaFont;
  translation: boolean;
  texture: boolean;
  hall: string;
  pauses: number;
  hide: readonly HideKey[];
  iqamahLead: number;
  dim: boolean;
};

const shows = (ctx: Ctx, key: HideKey) => !ctx.hide.includes(key);
const withoutFajrEnd = (prayers: TvPrayer[]) => prayers.filter((p) => p.name !== 'fajr_endtime');

const MINUTE = 60_000;

const capital = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const dateOf = (date: Date) => `${capital(weekdayName(date.getDay()))} ${formatGregorianShort(date)}`;
const hijriOf = (day: TvDay | null) => (day?.hijri ? formatHijri(day.hijri.hijri_date, day.hijri.hijri_month_text) : null);
const inText = (now: Date, target: Date) => `om ${formatDurationShort(Math.max(0, target.getTime() - now.getTime()))}`;
const find = (day: TvDay | null, name: string) => day?.prayers.find((p) => p.name === name) ?? null;
const prayersOf = (day: TvDay) => day.prayers.filter((p) => p.isPrayer);
const shown = (prayer: TvPrayer) => prayer.iqamah ?? prayer.azan;

function vippsOf(mosque: Mosque) {
  const number = mosque.vipps_number?.trim() || null;
  return { number, url: vippsUrlFrom(mosque.vipps_url) };
}

function dateLine(ctx: Ctx, dark = false, withHijri = true) {
  const hijri = withHijri ? hijriOf(ctx.state.today) : null;
  return (
    <>
      {dateOf(ctx.now)}
      {hijri ? (
        <>
          {' · '}
          <B color={dark ? ink.gold400 : ctx.brand.d}>{hijri}</B>
        </>
      ) : null}
    </>
  );
}

function hijriFirst(ctx: Ctx, color: string, rest: string) {
  const hijri = hijriOf(ctx.state.today);
  return (
    <>
      {hijri ? <B color={color}>{hijri}</B> : null}
      {hijri ? ` · ${rest}` : rest}
    </>
  );
}

type Hero = { label: string; icon: ReturnType<typeof glyphOf>; name: string; line: string; pill: string };

function glyphOf(prayer: TvPrayer | null) {
  return prayer ? PRAYER_GLYPH[prayer.name] : 'clock';
}

function heroOf(ctx: Ctx): Hero {
  const { now, state } = ctx;
  const { current, next } = nowAndNext(state);
  const timeLine = (p: TvPrayer) => (p.iqamah ? `Iqamah ${clockOf(p.iqamah)} · azan ${clockOf(p.azan)}` : `Azan ${clockOf(p.azan)}`);
  if (current) {
    const waiting = current.iqamah && now < current.iqamah;
    return {
      label: 'Nåværende bønn',
      icon: glyphOf(current),
      name: current.label,
      line: timeLine(current),
      pill: waiting
        ? `Iqamah ${inText(now, current.iqamah as Date)}`
        : next
          ? `${next.label} ${inText(now, next.azan)}`
          : '',
    };
  }
  return {
    label: 'Neste bønn',
    icon: glyphOf(next),
    name: next?.label ?? '',
    line: next ? timeLine(next) : '',
    pill: next ? `Azan ${inText(now, next.azan)}` : '',
  };
}

function Root({ children, style, pattern }: { children: React.ReactNode; style?: object; pattern?: React.ReactNode }) {
  return (
    <View style={[s.tv, style]}>
      {pattern}
      {children}
    </View>
  );
}

function Main(ctx: Ctx) {
  const { brand, now, state, mosque } = ctx;
  const hero = heroOf(ctx);
  const current = nowAndNext(state).current;
  const vipps = vippsOf(mosque);
  const note = !shows(ctx, 'main.note')
    ? null
    : mosque.announcement?.trim()
      ? { title: mosque.announcement.trim(), sub: vipps.number ? `Vipps ${vipps.number}` : null }
      : vipps.number
        ? { title: 'Støtt moskeen', sub: `Vipps ${vipps.number}` }
        : null;
  const timeline = shows(ctx, 'main.timeline');
  const prayers = shows(ctx, 'main.fajrEnd') ? state.today.prayers : withoutFajrEnd(state.today.prayers);
  return (
    <Root pattern={ctx.texture ? <Pattern id="ma" color={ink.mark} opacity={0.45} size={120} /> : null}>
      <Header brand={brand} name={mosque.name} line={dateLine(ctx, false, shows(ctx, 'main.hijri'))} clock={clockOf(now)} />
      <View style={s.row}>
        <Card style={s.hero}>
          <Label icon={hero.icon} text={hero.label} brand={brand} />
          <T style={[s.mainName, { color: brand.b }]}>{hero.name}</T>
          <T style={s.mainLine}>{hero.line}</T>
          {hero.pill ? <Pill text={hero.pill} brand={brand} style={s.autoTop} /> : null}
        </Card>
        <Card style={s.rowsCard}>
          <PrayerRows prayers={prayers} current={current?.name ?? null} brand={brand} />
        </Card>
      </View>
      <View style={s.bottom}>
        {timeline ? (
          <Card style={s.tlCard}>
            <Timeline prayers={prayersOf(state.today)} now={now} brand={brand} />
          </Card>
        ) : null}
        {note ? (
          <View style={[s.ann, !timeline && kit.grow]}>
            <Glyph name="megaphone" size={60} color={ink.gold600} />
            <View style={kit.flexShrink}>
              <T style={s.annTitle} lines={3}>
                {note.title}
              </T>
              {note.sub ? <T style={s.annSub}>{note.sub}</T> : null}
            </View>
          </View>
        ) : null}
      </View>
    </Root>
  );
}

function VippsBox({ mosque, brand, size, label, style }: { mosque: Mosque; brand: Brand; size: number; label: string; style?: object }) {
  const vipps = vippsOf(mosque);
  if (!vipps.number) return null;
  return (
    <View style={[s.vp, style]}>
      {vipps.url ? <Qr value={vipps.url} size={size} /> : null}
      <View>
        <T style={s.vpLabel}>{label}</T>
        <T style={[s.vpNumber, { color: brand.b }]}>{vipps.number}</T>
      </View>
    </View>
  );
}

function Lobby(ctx: Ctx) {
  const { brand, now, state, mosque } = ctx;
  const hero = heroOf(ctx);
  const current = nowAndNext(state).current;
  const announcement = shows(ctx, 'lobby.note') ? mosque.announcement?.trim() : undefined;
  return (
    <Root>
      <Header brand={brand} name={mosque.name} line={dateLine(ctx)} clock={clockOf(now)} />
      <View style={s.row}>
        <View style={s.side}>
          <Card style={s.nx}>
            <Label icon={hero.icon} text={hero.label} brand={brand} />
            <T style={[s.lobbyName, { color: brand.b }]} lines={1}>
              {hero.name}
            </T>
            {hero.pill ? <Pill text={hero.pill} brand={brand} textStyle={s.smallPill} iconSize={36} /> : null}
          </Card>
          {shows(ctx, 'lobby.times') ? (
            <Card style={s.mini}>
              {prayersOf(state.today).map((prayer) => {
                const on = prayer.name === current?.name;
                return (
                  <View key={prayer.name} style={[s.mr, on && { backgroundColor: brand.s }]}>
                    <Glyph name={PRAYER_GLYPH[prayer.name]} size={38} color={on ? brand.b : ink.muted} />
                    <T style={[s.mrText, on && { fontWeight: '800', color: brand.d }]}>{prayer.label}</T>
                    <T style={[s.mrText, s.mrTime, on && { color: brand.d }]}>{clockOf(shown(prayer))}</T>
                  </View>
                );
              })}
            </Card>
          ) : null}
        </View>
        <View style={[s.post, { backgroundColor: brand.d }]}>
          {ctx.texture ? <Pattern id="la" color={ink.white} opacity={0.1} size={120} /> : null}
          <View style={[s.tag, { backgroundColor: brand.b }]}>
            <Glyph name={announcement ? 'megaphone' : 'star-and-crescent'} size={36} color={ink.white} />
            <T style={s.tagText}>{announcement ? 'Fra moskeen' : 'Velkommen'}</T>
          </View>
          <T style={s.postTitle} lines={4}>
            {announcement || mosque.name}
          </T>
          {!announcement && mosque.address ? <T style={[s.postSub, { color: brand.t }]}>{mosque.address}</T> : null}
          <View style={s.postFoot}>
            {shows(ctx, 'lobby.vipps') ? <VippsBox mosque={mosque} brand={brand} size={160} label="Støtt med Vipps" /> : null}
          </View>
        </View>
      </View>
    </Root>
  );
}

function stripOf(ctx: Ctx, jumuah = false): StripItem[] {
  const current = nowAndNext(ctx.state).current;
  return prayersOf(ctx.state.today).map((prayer) => {
    if (jumuah && prayer.name === 'duhr') {
      const first = ctx.state.jummah[0];
      return { key: 'jumuah', icon: 'mosque', label: 'Jumuah', time: clockOf(first ?? shown(prayer)), current: true };
    }
    return {
      key: prayer.name,
      icon: PRAYER_GLYPH[prayer.name],
      label: prayer.label,
      time: clockOf(shown(prayer)),
      current: !jumuah && prayer.name === current?.name,
    };
  });
}

function Plakat(ctx: Ctx) {
  const { brand, now, mosque } = ctx;
  const vipps = shows(ctx, 'plakat.vipps') ? vippsOf(mosque) : { number: null, url: null };
  const announcement = shows(ctx, 'plakat.note') ? mosque.announcement?.trim() : undefined;
  const poster = announcement
    ? { kick: 'Kunngjøring', icon: 'megaphone' as const, title: announcement, sub: null }
    : vipps.number
      ? { kick: 'Støtt moskeen', icon: 'heart' as const, title: 'Gi med Vipps', sub: mosque.address }
      : { kick: 'Velkommen', icon: 'star-and-crescent' as const, title: mosque.name, sub: mosque.address };
  return (
    <View style={s.full}>
      <View style={[s.po, { backgroundColor: brand.b }]}>
        {ctx.texture ? (
          <Pattern id="pa" color={ink.white} opacity={0.14} size={140} frame={s.poPattern} />
        ) : null}
        <View style={s.pl}>
          <View style={s.br}>
            <View style={s.brLogo}>
              <T style={[s.brLogoText, { color: brand.b }]}>{mosque.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</T>
            </View>
            <T style={s.brName} lines={1}>
              {mosque.name}
            </T>
          </View>
          <View style={[s.kick]}>
            <Glyph name={poster.icon} size={44} color={brand.s} />
            <T style={[s.kickText, { color: brand.s }]}>{poster.kick}</T>
          </View>
          <T style={s.pt1} lines={4}>
            {poster.title}
          </T>
          {poster.sub ? <T style={[s.plSub, { color: brand.s }]}>{poster.sub}</T> : null}
        </View>
        {vipps.number ? (
          <View style={s.qb}>
            {vipps.url ? <Qr value={vipps.url} size={320} /> : null}
            <T style={s.qbTitle}>Vipps</T>
            <T style={[s.qbNumber, { color: brand.b }]}>{vipps.number}</T>
          </View>
        ) : null}
      </View>
      <View style={s.bar}>
        <View style={kit.grow}>
          <Strip items={stripOf(ctx)} brand={brand} />
        </View>
        <T style={s.barClock}>{clockOf(now)}</T>
      </View>
    </View>
  );
}

function Rad(ctx: Ctx) {
  const { brand, now, state, mosque } = ctx;
  const hero = heroOf(ctx);
  const current = nowAndNext(state).current;
  const hijri = hijriOf(state.today);
  return (
    <Root pattern={ctx.texture ? <Pattern id="ra" color={ink.mark} opacity={0.45} size={120} /> : null}>
      <Header brand={brand} name={mosque.name} line={ctx.hall} />
      <View style={s.top2}>
        <View style={s.artBg} pointerEvents="none">
          <Art kind={ctx.art} width={690} color={brand.t} />
        </View>
        <View style={s.radText}>
          <Label icon={hero.icon} text={hero.label} brand={brand} />
          <T style={[s.radName, { color: brand.b }]} lines={1}>
            {hero.name}
          </T>
          {hero.pill ? <Pill text={hero.pill} brand={brand} /> : null}
        </View>
        <View style={s.big}>
          <T style={s.bigClock}>{clockOf(now)}</T>
          <T style={s.bigDate}>{dateOf(now)}</T>
          {hijri ? <T style={[s.bigDate, s.bold, { color: brand.d }]}>{hijri}</T> : null}
        </View>
      </View>
      <View style={s.cards}>
        {(shows(ctx, 'rad.fajrEnd') ? state.today.prayers : withoutFajrEnd(state.today.prayers)).map((prayer) => {
          const on = prayer.name === current?.name;
          const fg = on ? brand.s : ink.muted;
          return (
            <View key={prayer.name} style={[s.pc, on && { backgroundColor: brand.b, borderColor: brand.b }]}>
              <Glyph name={PRAYER_GLYPH[prayer.name]} size={48} color={fg} />
              <T style={[s.pcLabel, { color: fg }]} lines={1}>
                {prayer.label}
              </T>
              <T style={[s.pcTime, on && { color: ink.white }]}>{clockOf(shown(prayer))}</T>
              <T style={[s.pcSmall, { color: fg }]}>{prayer.iqamah ? `Azan ${clockOf(prayer.azan)}` : ' '}</T>
            </View>
          );
        })}
      </View>
      {shows(ctx, 'rad.timeline') ? (
        <Card style={s.radTl}>
          <Timeline prayers={prayersOf(state.today)} now={now} brand={brand} />
        </Card>
      ) : null}
    </Root>
  );
}

function Iqamah(ctx: Ctx) {
  const { brand, now, state, mosque } = ctx;
  const target =
    state.today.prayers.find((p) => p.iqamah && p.iqamah > now && p.azan <= now) ?? nowAndNext(state).current;
  const left = target?.iqamah ? Math.max(0, target.iqamah.getTime() - now.getTime()) : 0;
  const seconds = Math.ceil(left / 1000);
  const countdown = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const progress = 1 - Math.min(left / (ctx.iqamahLead * MINUTE), 1);
  const tips = [
    { icon: 'device-mobile' as const, title: 'Skru av lyden på mobilen', sub: 'Takk for at du tar hensyn' },
    { icon: 'users-three' as const, title: 'Rett radene', sub: 'Skulder mot skulder, fot mot fot' },
  ];
  return (
    <Root
      style={{ backgroundColor: brand.b }}
      pattern={ctx.texture ? <Pattern id="ia" color={brand.d} opacity={0.5} size={160} /> : null}
    >
      <Header
        brand={brand}
        name={mosque.name}
        line={`${dateOf(now)}${target ? ` · ${target.label}` : ''}`}
        clock={clockOf(now)}
        logoStyle={{ backgroundColor: ink.white }}
        logoColor={brand.b}
        nameStyle={s.white}
        lineStyle={{ color: brand.t }}
        clockStyle={s.white}
      />
      <View style={s.mid}>
        <View style={kit.lbl}>
          <Glyph name={glyphOf(target)} size={60} color={ink.white} />
          <T style={[s.iqLabel, { color: brand.s }]}>{`Iqamah ${target?.label ?? ''} om`}</T>
        </View>
        <T style={s.cd}>{countdown}</T>
        <View style={[s.bar2, { backgroundColor: brand.d }]}>
          <View style={[s.bar2Fill, { width: `${progress * 100}%` }]} />
        </View>
      </View>
      {shows(ctx, 'iqamah.tips') ? (
        <View style={s.tips}>
          {tips.map((tip) => (
            <View key={tip.title} style={[s.tip, { backgroundColor: brand.d }]}>
              <View style={s.tipIcon}>
                <Glyph name={tip.icon} size={54} color={brand.b} />
              </View>
              <View style={kit.flexShrink}>
                <T style={s.tipTitle}>{tip.title}</T>
                <T style={[s.tipSub, { color: brand.t }]}>{tip.sub}</T>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </Root>
  );
}

function Jumuah(ctx: Ctx) {
  const { brand, now, state, mosque } = ctx;
  const sessions = state.jummah;
  const upcoming = sessions.find((time) => time > now) ?? null;
  const vipps = shows(ctx, 'jumuah.vipps') ? vippsOf(mosque) : { number: null, url: null };
  return (
    <Root style={{ backgroundColor: brand.s }}>
      <Header brand={brand} name={mosque.name} line={dateLine(ctx)} clock={clockOf(now)} />
      <View style={s.row}>
        <Card style={[s.hero, { borderColor: brand.t }]}>
          <View style={s.jumuahArt} pointerEvents="none">
            <Art kind="mosque" width={540} color={brand.t} />
          </View>
          <Label icon="mosque" text="I dag" brand={brand} />
          <T style={[s.jumuahName, { color: brand.b }]}>Jumuah</T>
          <T style={s.mainLine}>{upcoming ? `Khutbah ${inText(now, upcoming)}` : 'Jumuah mubarak'}</T>
          <View style={s.ses}>
            {sessions.map((time, index) => {
              const on = time === (upcoming ?? sessions[sessions.length - 1]);
              return (
                <View key={time.toISOString()} style={[s.se, on && { backgroundColor: brand.s, borderColor: brand.t }]}>
                  <T style={[s.seLabel, on && { color: brand.d }]}>{`${index + 1}. Jumuah`}</T>
                  <T style={[s.seTime, on && { color: brand.d }]}>{clockOf(time)}</T>
                </View>
              );
            })}
          </View>
        </Card>
        {vipps.number ? (
          <Card style={[s.give, { backgroundColor: brand.b, borderColor: brand.b }]}>
            <T style={s.giveTitle}>Fredagsinnsamling</T>
            {vipps.url ? (
              <View style={s.giveQr}>
                <Qr value={vipps.url} size={280} />
              </View>
            ) : null}
            <T style={[s.giveSub, { color: brand.s }]}>Vipps til</T>
            <T style={s.giveNumber}>{vipps.number}</T>
          </Card>
        ) : null}
      </View>
      <Card style={[s.stripCard, { borderColor: brand.t }]}>
        <Strip items={stripOf(ctx, true)} brand={brand} />
      </Card>
    </Root>
  );
}

function shiftDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
}

function Ramadan(ctx: Ctx) {
  const { brand, now, state, mosque } = ctx;
  const day = state.ramadanDay ?? 1;
  const fajr = find(state.today, 'fajr');
  const maghrib = find(state.today, 'maghrib');
  const isha = find(state.today, 'isha');
  const taraweeh = taraweehStart(state.today);
  const rows = [
    fajr && { key: 'suhoor', icon: PRAYER_GLYPH.fajr, title: 'Suhoor slutter', sub: fajr.iqamah ? `Fajr-iqamah ${clockOf(fajr.iqamah)}` : null, time: fajr.azan, gold: false },
    maghrib && { key: 'iftar', icon: PRAYER_GLYPH.maghrib, title: 'Iftar', sub: maghrib.iqamah ? `Maghrib-iqamah ${clockOf(maghrib.iqamah)}` : null, time: maghrib.azan, gold: true },
    isha && { key: 'isha', icon: PRAYER_GLYPH.isha, title: isha.label, sub: isha.iqamah ? `Iqamah ${clockOf(isha.iqamah)}` : null, time: isha.azan, gold: false },
    taraweeh && { key: 'taraweeh', icon: 'mosque' as const, title: 'Taraweeh', sub: `${TARAWEEH_RAKAT} rakat`, time: taraweeh, gold: false },
  ].filter((row) => row != null);
  const lastTen = day < 21 ? formatGregorianShort(shiftDays(now, 21 - day)) : null;
  const iftar = maghrib && maghrib.azan > now ? `Iftar ${inText(now, maghrib.azan)}` : 'Iftar';
  return (
    <Root
      style={s.ramadanTv}
      pattern={ctx.texture ? <Pattern id="rc" color={ink.gold100} opacity={1} size={120} /> : null}
    >
      <Header
        brand={brand}
        name={mosque.name}
        line={hijriFirst(ctx, ink.gold800, dateOf(now))}
        clock={clockOf(now)}
        lineStyle={{ color: ink.gold700 }}
      />
      <View style={s.row}>
        <Card style={[s.hero, s.goldBorder, s.center]}>
          <Label icon="star-and-crescent" text="Faste" brand={brand} iconColor={ink.gold600} />
          <T style={[s.ramadanName, { color: brand.b }]} lines={2}>
            {iftar}
          </T>
          {maghrib ? <T style={s.ramadanSub}>{`Maghrib ${clockOf(maghrib.azan)}`}</T> : null}
        </Card>
        <Card style={[s.list, s.goldBorder]}>
          {rows.map((row) => (
            <View key={row.key} style={[s.r, row.gold && { backgroundColor: ink.gold50 }]}>
              <Glyph name={row.icon} size={52} color={row.gold ? ink.gold600 : brand.b} />
              <View style={kit.grow}>
                <T style={[s.rTitle, row.gold && { color: ink.gold800 }]}>{row.title}</T>
                {row.sub ? <T style={[s.rSub, row.gold && { color: ink.gold700 }]}>{row.sub}</T> : null}
              </View>
              <T style={[s.rTime, row.gold && { color: ink.gold800 }]}>{clockOf(row.time)}</T>
            </View>
          ))}
        </Card>
      </View>
      <View style={s.prog}>
        <View style={s.segs}>
          {Array.from({ length: 30 }, (_, index) => {
            const n = index + 1;
            return (
              <View
                key={n}
                style={[
                  s.seg,
                  n < day && { backgroundColor: brand.b, borderColor: brand.b },
                  n === day && { backgroundColor: ink.gold400, borderColor: ink.gold600 },
                ]}
              />
            );
          })}
        </View>
        <View style={s.progLabels}>
          <T style={[s.progText, s.bold, { color: ink.gold800 }]}>{`Dag ${day} av 30`}</T>
          {lastTen ? <T style={s.progText}>{`Siste ti netter fra ${lastTen}`}</T> : null}
        </View>
      </View>
      {mosque.announcement?.trim() ? (
        <T style={s.ramadanAnn} lines={1}>
          {mosque.announcement.trim()}
        </T>
      ) : null}
    </Root>
  );
}

function Taraweeh(ctx: Ctx) {
  const { brand, now, state, mosque } = ctx;
  const start = taraweehStart(state.today);
  const isha = find(state.today, 'isha');
  const suhoor = find(state.tomorrow, 'fajr');
  const vipps = vippsOf(mosque);
  const title = start && start > now ? `Taraweeh ${inText(now, start)}` : 'Taraweeh';
  const facts = [
    { icon: 'book-open' as const, label: 'Taraweeh', value: `${TARAWEEH_RAKAT} rakat` },
    suhoor && { icon: 'moon-stars' as const, label: 'Suhoor slutter i morgen', value: clockOf(suhoor.azan) },
  ].filter((fact) => fact != null);
  return (
    <Root style={s.dark}>
      <Header
        brand={brand}
        name={mosque.name}
        line={hijriFirst(ctx, ink.gold400, dateOf(now))}
        clock={clockOf(now)}
        dark
      />
      <View style={s.taraweehBody}>
        <Card dark style={s.info}>
          <Label icon="moon-stars" text="Ramadan-natt" brand={brand} color={ink.gold400} iconColor={ink.gold400} />
          <T style={s.taraweehName} lines={2}>
            {title}
          </T>
          <T style={s.taraweehSub}>
            {[isha?.iqamah ? `Isha-iqamah ${clockOf(isha.iqamah)}` : null, start ? `taraweeh ${clockOf(start)}` : null]
              .filter(Boolean)
              .join(' · ')}
          </T>
          <View style={s.autoTop}>
            {facts.map((fact) => (
              <View key={fact.label} style={s.fact}>
                <View style={kit.lbl}>
                  <Glyph name={fact.icon} size={32} color={brand.m} />
                  <T style={s.factLabel}>{fact.label}</T>
                </View>
                <T style={s.factValue}>{fact.value}</T>
              </View>
            ))}
          </View>
        </Card>
        <View style={s.camp}>
          {ctx.texture ? <Pattern id="tb" color={ink.gold400} opacity={0.08} size={140} /> : null}
          <View style={s.ch}>
            <Glyph name="heart" size={64} color={ink.gold400} />
            <View style={kit.flexShrink}>
              <T style={s.chTitle} lines={3}>
                {mosque.announcement?.trim() || 'Ramadan-innsamling'}
              </T>
              <T style={s.chSub}>{vipps.number ? 'Gi med Vipps' : 'Ramadan mubarak'}</T>
            </View>
          </View>
          {vipps.number ? (
            <VippsBox mosque={mosque} brand={brand} size={150} label="Gi med Vipps" style={[s.autoTop, s.alignStart]} />
          ) : (
            <T style={[s.amt, s.autoTop]}>{clockOf(now)}</T>
          )}
        </View>
      </View>
    </Root>
  );
}

const ARABIC: Record<DuaFont, { family: string; size: number; solo: number; line: number }> = {
  Amiri: { family: 'Amiri_400Regular', size: 58, solo: 76, line: 1.75 },
  ScheherazadeNew: { family: 'ScheherazadeNew_400Regular', size: 62, solo: 80, line: 1.75 },
  NotoNaskhArabic: { family: 'NotoNaskhArabic_400Regular', size: 50, solo: 66, line: 1.9 },
  ReemKufi: { family: 'ReemKufi_400Regular', size: 52, solo: 68, line: 1.8 },
  ArefRuqaa: { family: 'ArefRuqaa_400Regular', size: 56, solo: 72, line: 1.8 },
  NotoNastaliqUrdu: { family: 'NotoNastaliqUrdu_400Regular', size: 42, solo: 54, line: 2.5 },
};

const DUA_AR =
  'سُبْحَانَ ذِي الْمُلْكِ وَالْمَلَكُوتِ، سُبْحَانَ ذِي الْعِزَّةِ وَالْعَظَمَةِ وَالْهَيْبَةِ وَالْقُدْرَةِ وَالْكِبْرِيَاءِ وَالْجَبَرُوتِ، سُبْحَانَ الْمَلِكِ الْحَيِّ الَّذِي لَا يَنَامُ وَلَا يَمُوتُ، سُبُّوحٌ قُدُّوسٌ رَبُّنَا وَرَبُّ الْمَلَائِكَةِ وَالرُّوحِ، اللَّهُمَّ أَجِرْنَا مِنَ النَّارِ، ';
const DUA_AR_END = 'يَا مُجِيرُ يَا مُجِيرُ يَا مُجِيرُ';
const DUA_NB =
  'Ære være Ham som eier riket og herredømmet. Ære være Ham som har makten, storheten, ærefrykten, kraften, høyheten og overmakten. Ære være Kongen, Den Levende, som verken sover eller dør. Høylovet og hellig er vår Herre, englenes og Åndens Herre. Å Allah, bevar oss fra Ilden. Du som verner, Du som verner, Du som verner.';

function Dua(ctx: Ctx) {
  const { brand, now, mosque } = ctx;
  const info = pauseInfo(ctx.pauses);
  const font = ARABIC[ctx.duaFont];
  const fontSize = ctx.translation ? font.size : font.solo;
  const arabic: TextStyle = { fontFamily: font.family, fontSize, lineHeight: fontSize * font.line };
  const next = info.rakat < info.total ? `rakat ${info.rakat + 1}-${info.rakat + 4}` : 'witr';
  return (
    <Root style={[s.dark, s.gap28]}>
      <Header
        brand={brand}
        name={mosque.name}
        line={hijriFirst(ctx, ink.gold400, 'Taraweeh')}
        clock={clockOf(now)}
        dark
        logoStyle={s.duaLogo}
        nameStyle={s.duaName}
        clockStyle={s.duaClock}
      />
      <View style={s.duaProg}>
        <View style={kit.lbl}>
          <Glyph name="hand-palm" size={44} color={ink.gold400} />
          <T style={s.duaPause}>{`Pause etter ${info.rakat} av ${info.total} rakat`}</T>
        </View>
        <View style={s.duaSegs}>
          {Array.from({ length: info.total / 4 }, (_, index) => {
            const done = index < info.pause;
            const upcoming = index === info.pause;
            const color = done ? ink.mist300 : upcoming ? ink.gold400 : ink.mist500;
            return (
              <View
                key={index}
                style={[s.sg, done && { backgroundColor: ink.night800 }, upcoming && { borderColor: ink.gold400 }]}
              >
                <T style={[s.sgText, { color }]}>{`${index * 4 + 1}-${index * 4 + 4}`}</T>
                <View style={s.dots}>
                  {[0, 1, 2, 3].map((dot) => (
                    <View
                      key={dot}
                      style={[
                        s.dot,
                        done && { backgroundColor: brand.m, borderColor: brand.m },
                        upcoming && { borderColor: ink.gold400 },
                      ]}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </View>
      <View style={s.dua}>
        {ctx.texture ? <Pattern id="dp" color={ink.gold400} opacity={0.07} size={140} /> : null}
        <T style={[s.ar, arabic]}>
          {DUA_AR}
          <T style={[arabic, { color: ink.gold400 }]}>{DUA_AR_END}</T>
        </T>
        {ctx.translation ? <T style={s.no}>{DUA_NB}</T> : null}
      </View>
      <View style={s.ft}>
        <T style={s.ftText}>
          {'Neste: '}
          <B color={ink.mist100}>{next}</B>
        </T>
      </View>
    </Root>
  );
}

function Hvile(ctx: Ctx) {
  const { brand, now, state, mosque } = ctx;
  const { current, next, nextIsTomorrow } = nowAndNext(state);
  const isha = current?.name === 'isha' ? current : find(state.today, 'isha');
  const nextDay = nextIsTomorrow ? state.tomorrow : state.today;
  const rows = nextDay?.prayers ?? [];
  const dayDate = nextDay ? new Date(`${nextDay.iso}T12:00:00`) : now;
  return (
    <Root
      style={[s.dark, s.hvileTv]}
      pattern={ctx.texture ? <Pattern id="hc" color={ink.mist100} opacity={0.05} size={120} frame={s.hvilePattern} /> : null}
    >
      <Header
        brand={brand}
        name={mosque.name}
        line={dateLine(ctx, true)}
        dark
        logoStyle={s.hvileLogo}
        logoColor={ink.mist300}
        nameStyle={{ color: ink.mist300 }}
      />
      <View style={s.hvileBody}>
        <View style={s.lft}>
          <Label icon="moon" text={`Nå · ${isha?.label ?? 'Isha'}`} brand={brand} color={ink.mist500} iconColor={brand.m} />
          <T style={s.hvileClock}>{clockOf(now)}</T>
          {next ? <T style={s.hvileNext}>{`${next.label} ${inText(now, next.azan)}`}</T> : null}
          {next ? (
            <T style={s.hvileSub}>
              {`${isha?.label ?? 'Isha'} varer til ${next.label} kl. ${clockOf(next.azan)}${next.iqamah ? ` · iqamah ${clockOf(next.iqamah)}` : ''}`}
            </T>
          ) : null}
        </View>
        <Card dark style={s.lst}>
          <T style={s.lh}>Nå</T>
          {isha ? (
            <View style={[s.hr, { backgroundColor: brand.b }]}>
              <Glyph name="moon" size={40} color={brand.s} />
              <T style={[s.hrName, s.white]}>{isha.label}</T>
              <T style={[s.hrSmall, { color: brand.s }]}>{next ? `til ${clockOf(next.azan)}` : ''}</T>
              <T style={[s.hrTime, s.white]}>{clockOf(isha.azan)}</T>
            </View>
          ) : null}
          <T style={[s.lh, s.lhGap]}>{`${nextIsTomorrow ? 'I morgen' : 'I dag'}, ${weekdayName(dayDate.getDay())} ${formatGregorianShort(dayDate)}`}</T>
          {rows.map((prayer) => {
            const upcoming = prayer.name === 'fajr';
            return (
              <View key={prayer.name} style={[s.hr, upcoming && { backgroundColor: ink.night800, borderColor: brand.m, borderWidth: 2 }]}>
                <Glyph name={PRAYER_GLYPH[prayer.name]} size={40} color={upcoming ? brand.t : brand.m} />
                <T style={s.hrName}>{prayer.label}</T>
                <T style={s.hrSmall}>{prayer.iqamah ? clockOf(prayer.iqamah) : ''}</T>
                <T style={s.hrTime}>{clockOf(prayer.azan)}</T>
              </View>
            );
          })}
        </Card>
      </View>
      {ctx.dim ? <View style={s.dim} pointerEvents="none" /> : null}
    </Root>
  );
}

function Eid(ctx: Ctx) {
  const { brand, now, state, mosque } = ctx;
  const prayers = state.eidPrayers;
  const upcoming = prayers.find((time) => time > now) ?? null;
  const vipps = vippsOf(mosque);
  return (
    <Root
      style={{ backgroundColor: ink.gold50 }}
      pattern={ctx.texture ? <Pattern id="ep" color={ink.gold100} opacity={1} size={120} /> : null}
    >
      <Header
        brand={brand}
        name={mosque.name}
        line={hijriFirst(ctx, ink.gold800, dateOf(now))}
        clock={clockOf(now)}
        lineStyle={{ color: ink.gold700 }}
      />
      <View style={s.row}>
        <View style={[kit.grow, s.center]}>
          <Label icon="star-and-crescent" text="Eid mubarak" brand={brand} color={ink.gold700} iconColor={ink.gold600} size={40} iconSize={52} />
          <T style={[s.eidName, { color: brand.b }]} lines={2}>
            {upcoming ? `Eid-bønn ${inText(now, upcoming)}` : 'Eid mubarak'}
          </T>
          <View style={s.eidSes}>
            {prayers.map((time, index) => {
              const on = time === upcoming;
              return (
                <View key={time.toISOString()} style={[s.eidSe, on && { backgroundColor: brand.b, borderColor: brand.b }]}>
                  <T style={[s.eidSeLabel, on && { color: brand.t }]}>{`${index + 1}. Eid-bønn`}</T>
                  <T style={[s.eidSeTime, on && s.white]}>{clockOf(time)}</T>
                </View>
              );
            })}
          </View>
        </View>
        {vipps.number ? (
          <View style={s.fit}>
            <Glyph name="heart" size={64} color={ink.gold600} />
            <T style={s.fh}>Fitrah før bønnen</T>
            <T style={s.fs}>Merk betalingen med «fitrah».</T>
            <VippsBox mosque={mosque} brand={brand} size={180} label="Vipps" style={[s.autoTop, s.fv]} />
          </View>
        ) : null}
      </View>
      {mosque.announcement?.trim() ? (
        <View style={s.foot}>
          <Glyph name="map-pin" size={40} color={ink.gold600} />
          <T style={s.footText} lines={1}>
            {mosque.announcement.trim()}
          </T>
        </View>
      ) : null}
    </Root>
  );
}

export const SCREENS: Record<ScreenId, (ctx: Ctx) => React.ReactElement> = {
  main: Main,
  lobby: Lobby,
  plakat: Plakat,
  rad: Rad,
  iqamah: Iqamah,
  jumuah: Jumuah,
  ramadan: Ramadan,
  taraweeh: Taraweeh,
  dua: Dua,
  hvile: Hvile,
  eid: Eid,
};

export const SCREEN_NAMES: Record<ScreenId, string> = {
  main: 'Bønnesal',
  lobby: 'Inngang',
  plakat: 'Reklameskjerm',
  rad: 'Sal 2',
  iqamah: 'Iqamah',
  jumuah: 'Jumuah',
  ramadan: 'Ramadan iftar',
  taraweeh: 'Ramadan taraweeh',
  dua: 'Taraweeh-dua',
  hvile: 'Natt og hvile',
  eid: 'Eid-morgen',
};

const s = StyleSheet.create({
  tv: {
    width: 1920,
    height: 1080,
    backgroundColor: ink.page,
    paddingTop: 52,
    paddingHorizontal: 80,
    paddingBottom: 48,
    gap: 32,
    overflow: 'hidden',
  },
  full: { width: 1920, height: 1080, overflow: 'hidden' },
  white: { color: ink.white },
  bold: { fontWeight: '700' },
  center: { justifyContent: 'center' },
  autoTop: { marginTop: 'auto' },
  alignStart: { alignSelf: 'flex-start' },
  gap28: { gap: 28 },
  dark: { backgroundColor: ink.night950 },
  row: { flex: 1, flexDirection: 'row', gap: 32, minHeight: 0 },
  hero: { flex: 1, overflow: 'hidden', paddingVertical: 52, paddingHorizontal: 60 },
  mainName: { fontSize: 230, fontWeight: '800', letterSpacing: -8, lineHeight: 240, marginTop: 28, marginBottom: 12 },
  mainLine: { fontSize: 52, fontWeight: '600', color: ink.body },
  rowsCard: { width: 700, padding: 20, justifyContent: 'center' },
  bottom: { flexDirection: 'row', gap: 32 },
  tlCard: { flex: 1, paddingTop: 20, paddingHorizontal: 56, paddingBottom: 4 },
  ann: {
    width: 600,
    backgroundColor: ink.gold50,
    borderWidth: 2,
    borderColor: ink.gold100,
    borderRadius: 32,
    paddingVertical: 24,
    paddingHorizontal: 36,
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
  },
  annTitle: { fontSize: 28, fontWeight: '700', color: ink.gold800, lineHeight: 36 },
  annSub: { fontSize: 26, color: ink.gold700, marginTop: 6 },
  side: { width: 600, gap: 24 },
  nx: { paddingVertical: 36, paddingHorizontal: 40 },
  lobbyName: { fontSize: 132, fontWeight: '800', letterSpacing: -5, lineHeight: 140, marginTop: 14, marginBottom: 22 },
  smallPill: { fontSize: 32 },
  mini: { flex: 1, padding: 16, justifyContent: 'space-around' },
  mr: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingHorizontal: 24, height: 76, borderRadius: 22 },
  mrText: { fontSize: 36, fontWeight: '500' },
  mrTime: { marginLeft: 'auto', fontWeight: '700' },
  post: { flex: 1, overflow: 'hidden', borderRadius: 32, paddingVertical: 56, paddingHorizontal: 64 },
  tag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  tagText: { fontSize: 30, fontWeight: '700', color: ink.white },
  postTitle: { fontSize: 100, fontWeight: '800', lineHeight: 104, letterSpacing: -3, color: ink.white, marginTop: 36, marginBottom: 24, maxWidth: 960 },
  postSub: { fontSize: 36, lineHeight: 48, maxWidth: 860 },
  postFoot: { marginTop: 'auto', flexDirection: 'row', justifyContent: 'flex-end' },
  vp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
    backgroundColor: ink.white,
    borderRadius: 28,
    paddingVertical: 20,
    paddingLeft: 20,
    paddingRight: 36,
  },
  vpLabel: { fontSize: 24, color: ink.muted, fontWeight: '600' },
  vpNumber: { fontSize: 60, fontWeight: '800' },
  po: { flex: 1, overflow: 'hidden', paddingVertical: 72, paddingHorizontal: 96, flexDirection: 'row', gap: 72 },
  poPattern: { position: 'absolute', top: 0, right: 0, width: 820, height: '100%' },
  pl: { flex: 1 },
  br: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  brLogo: { width: 72, height: 72, borderRadius: 22, backgroundColor: ink.white, alignItems: 'center', justifyContent: 'center' },
  brLogoText: { fontSize: 28, fontWeight: '800' },
  brName: { fontSize: 34, fontWeight: '700', color: ink.white, flexShrink: 1 },
  kick: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 14 },
  kickText: { fontSize: 34, fontWeight: '600' },
  pt1: { fontSize: 136, fontWeight: '800', lineHeight: 134, letterSpacing: -4.8, color: ink.white, marginTop: 20, marginBottom: 28 },
  plSub: { fontSize: 40, lineHeight: 54, maxWidth: 900 },
  qb: { alignSelf: 'center', width: 520, backgroundColor: ink.white, borderRadius: 40, padding: 48, alignItems: 'center', gap: 16 },
  qbTitle: { fontSize: 48, fontWeight: '800' },
  qbNumber: { fontSize: 76, fontWeight: '800' },
  bar: {
    height: 150,
    backgroundColor: ink.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 64,
    gap: 40,
    borderTopWidth: 2,
    borderTopColor: ink.line,
  },
  barClock: { fontSize: 80, fontWeight: '300', letterSpacing: -2.4 },
  top2: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 48, minHeight: 0 },
  artBg: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', paddingLeft: 120 },
  radText: { flex: 1 },
  radName: { fontSize: 210, fontWeight: '800', letterSpacing: -8.4, lineHeight: 200, marginTop: 16, marginBottom: 28 },
  big: { width: 720, alignItems: 'flex-end' },
  bigClock: { fontSize: 220, fontWeight: '200', letterSpacing: -8.8, lineHeight: 230 },
  bigDate: { fontSize: 32, color: ink.muted, marginTop: 4, textAlign: 'right' },
  cards: { flexDirection: 'row', gap: 20 },
  pc: {
    flex: 1,
    backgroundColor: ink.white,
    borderWidth: 2,
    borderColor: ink.line,
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 28,
    gap: 4,
  },
  pcLabel: { fontSize: 28, fontWeight: '600', marginTop: 8 },
  pcTime: { fontSize: 60, fontWeight: '800', letterSpacing: -1.2 },
  pcSmall: { fontSize: 22 },
  radTl: { paddingTop: 20, paddingHorizontal: 64, paddingBottom: 4 },
  mid: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iqLabel: { fontSize: 48, fontWeight: '600' },
  cd: { fontSize: 320, fontWeight: '700', letterSpacing: -12.8, lineHeight: 330, color: ink.white, marginTop: 12, marginBottom: 44 },
  bar2: { width: 1100, height: 20, borderRadius: 10, overflow: 'hidden' },
  bar2Fill: { height: '100%', backgroundColor: ink.white },
  tips: { flexDirection: 'row', gap: 32 },
  tip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 28, borderRadius: 32, paddingVertical: 28, paddingHorizontal: 36 },
  tipIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: ink.white, alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontSize: 40, fontWeight: '700', color: ink.white },
  tipSub: { fontSize: 28, fontWeight: '500', marginTop: 4 },
  jumuahArt: { position: 'absolute', right: -16, top: 24 },
  jumuahName: { fontSize: 220, fontWeight: '800', letterSpacing: -8.8, lineHeight: 215, marginTop: 24, marginBottom: 16 },
  ses: { marginTop: 'auto', flexDirection: 'row', gap: 24 },
  se: { flex: 1, borderRadius: 28, paddingVertical: 28, paddingHorizontal: 36, backgroundColor: ink.page, borderWidth: 2, borderColor: ink.line },
  seLabel: { fontSize: 28, fontWeight: '600', color: ink.muted },
  seTime: { fontSize: 84, fontWeight: '800', letterSpacing: -1.7 },
  give: { width: 580, padding: 48, alignItems: 'center', justifyContent: 'center', gap: 18 },
  giveTitle: { fontSize: 44, fontWeight: '800', color: ink.white, textAlign: 'center' },
  giveQr: { padding: 16, backgroundColor: ink.white, borderRadius: 28, marginVertical: 8 },
  giveSub: { fontSize: 28 },
  giveNumber: { fontSize: 76, fontWeight: '800', color: ink.white },
  stripCard: { padding: 16 },
  ramadanTv: { backgroundColor: ink.gold50, gap: 28 },
  goldBorder: { borderColor: ink.gold100 },
  ramadanName: { fontSize: 160, fontWeight: '800', letterSpacing: -6.4, lineHeight: 160, marginTop: 20, marginBottom: 24 },
  ramadanSub: { fontSize: 40, fontWeight: '600', color: ink.body },
  list: { width: 620, padding: 20, justifyContent: 'space-around' },
  r: { flexDirection: 'row', alignItems: 'center', gap: 22, paddingVertical: 16, paddingHorizontal: 28, borderRadius: 24 },
  rTitle: { fontSize: 32, fontWeight: '700' },
  rSub: { fontSize: 24, color: ink.muted },
  rTime: { fontSize: 64, fontWeight: '800', letterSpacing: -1.3 },
  prog: { gap: 14 },
  segs: { flexDirection: 'row', gap: 8 },
  seg: { flex: 1, height: 20, borderRadius: 10, backgroundColor: ink.white, borderWidth: 2, borderColor: ink.gold100 },
  progLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progText: { fontSize: 28, color: ink.gold700 },
  ramadanAnn: { fontSize: 30, color: ink.body },
  taraweehBody: { flex: 1, flexDirection: 'row', gap: 32, minHeight: 0 },
  info: { width: 600, paddingVertical: 44, paddingHorizontal: 48 },
  taraweehName: { fontSize: 96, fontWeight: '800', letterSpacing: -3.8, lineHeight: 100, color: ink.mist100, marginVertical: 16 },
  taraweehSub: { fontSize: 32, fontWeight: '600', color: ink.mist300, lineHeight: 43 },
  fact: { paddingVertical: 18, borderTopWidth: 2, borderTopColor: ink.night700 },
  factLabel: { fontSize: 26, color: ink.mist500, fontWeight: '600' },
  factValue: { fontSize: 38, fontWeight: '700', color: ink.mist100, marginTop: 4 },
  camp: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: ink.night800,
    borderWidth: 2,
    borderColor: ink.night700,
    borderRadius: 32,
    paddingVertical: 56,
    paddingHorizontal: 64,
    gap: 32,
  },
  ch: { flexDirection: 'row', gap: 24, alignItems: 'center' },
  chTitle: { fontSize: 52, fontWeight: '800', lineHeight: 58, color: ink.mist100 },
  chSub: { fontSize: 30, color: ink.mist500, marginTop: 6 },
  amt: { fontSize: 180, fontWeight: '800', letterSpacing: -7, color: ink.mist100 },
  duaLogo: { width: 80, height: 80, borderRadius: 24 },
  duaName: { fontSize: 38 },
  duaClock: { fontSize: 88, color: ink.mist300 },
  duaProg: { flexDirection: 'row', alignItems: 'center', gap: 40 },
  duaPause: { fontSize: 36, fontWeight: '700', color: ink.gold400 },
  duaSegs: { flex: 1, flexDirection: 'row', gap: 16 },
  sg: {
    flex: 1,
    borderWidth: 2,
    borderColor: ink.night700,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sgText: { fontSize: 24, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: ink.nightDot },
  dua: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 40,
    backgroundColor: ink.night900,
    borderWidth: 2,
    borderColor: ink.night700,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    paddingVertical: 40,
    paddingHorizontal: 96,
  },
  ar: { color: ink.mist100, textAlign: 'center', writingDirection: 'rtl' },
  no: { fontSize: 30, color: ink.mist300, lineHeight: 44, maxWidth: 1500, textAlign: 'center' },
  ft: { flexDirection: 'row', justifyContent: 'space-between' },
  ftText: { fontSize: 28, color: ink.mist500 },
  hvileTv: { paddingTop: 64, paddingHorizontal: 104, paddingBottom: 56 },
  hvilePattern: { position: 'absolute', top: 0, left: 0, width: 1000, height: '100%' },
  hvileLogo: { backgroundColor: ink.night800, borderWidth: 2, borderColor: ink.night700 },
  dim: { ...StyleSheet.absoluteFill, backgroundColor: ink.night950, opacity: 0.5 },
  hvileBody: { flex: 1, flexDirection: 'row', gap: 64, alignItems: 'center', minHeight: 0 },
  lft: { flex: 1 },
  hvileClock: { fontSize: 260, fontWeight: '200', lineHeight: 250, letterSpacing: -10.4, color: ink.mist300 },
  hvileNext: { fontSize: 64, fontWeight: '800', letterSpacing: -1.3, color: ink.mist100, marginTop: 40 },
  hvileSub: { fontSize: 36, color: ink.mist500, marginTop: 12 },
  lst: { width: 680, paddingVertical: 24, paddingHorizontal: 32 },
  lh: { fontSize: 26, fontWeight: '600', color: ink.mist500, paddingHorizontal: 20, paddingBottom: 8 },
  lhGap: { paddingTop: 20 },
  hr: { flexDirection: 'row', alignItems: 'center', gap: 24, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  hrName: { flex: 1, fontSize: 34, fontWeight: '600', color: ink.mist100 },
  hrSmall: { fontSize: 26, color: ink.mist500, fontWeight: '500' },
  hrTime: { fontSize: 40, fontWeight: '700', minWidth: 110, textAlign: 'right', color: ink.mist100 },
  eidName: { fontSize: 180, fontWeight: '800', lineHeight: 176, letterSpacing: -7.2, marginTop: 20, marginBottom: 44 },
  eidSes: { flexDirection: 'row', gap: 24 },
  eidSe: { flex: 1, backgroundColor: ink.white, borderWidth: 2, borderColor: ink.gold100, borderRadius: 28, paddingVertical: 28, paddingHorizontal: 32 },
  eidSeLabel: { fontSize: 26, color: ink.gold700, fontWeight: '600' },
  eidSeTime: { fontSize: 76, fontWeight: '800', letterSpacing: -1.5 },
  fit: { width: 600, backgroundColor: ink.white, borderWidth: 2, borderColor: ink.gold100, borderRadius: 36, padding: 48, gap: 20 },
  fh: { fontSize: 48, fontWeight: '800' },
  fs: { fontSize: 30, color: ink.gold700, lineHeight: 42 },
  fv: { paddingLeft: 0, paddingVertical: 0 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  footText: { fontSize: 30, color: ink.gold700, flexShrink: 1 },
});
