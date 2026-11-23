import QRCode from 'qrcode';
import { useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Path, Pattern as SvgPattern, Rect } from 'react-native-svg';
import { ICON_PATHS, type TvIconName } from './iconPaths';
import type { ArtChoice } from './settings';
import { ink, initialsOf, num, type Brand } from './theme';
import type { TvPrayer } from './tvModel';

export type GlyphName = TvIconName | 'sunrise' | 'sunset';

const HORIZON = ['M24 192H232', 'M72 192a56 56 0 0 1 112 0'];
const ARROWS = { sunrise: 'M128 76V24M100 52l28-28 28 28', sunset: 'M128 24V76M100 48l28 28 28-28' };

export function Glyph({ name, size, color }: { name: GlyphName; size: number; color: string }) {
  if (name === 'sunrise' || name === 'sunset') {
    return (
      <Svg width={size} height={size} viewBox="0 0 256 256">
        {[...HORIZON, ARROWS[name]].map((d) => (
          <Path key={d} d={d} fill="none" stroke={color} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256">
      <Path d={ICON_PATHS[name]} fill={color} />
    </Svg>
  );
}

export const PRAYER_GLYPH: Record<string, GlyphName> = {
  fajr: 'moon-stars',
  fajr_endtime: 'sunrise',
  duhr: 'sun',
  asr: 'cloud-sun',
  maghrib: 'sunset',
  isha: 'moon',
};

const PATH8 = 'M20 20H60V60H20Z M40 11.7L68.3 40L40 68.3L11.7 40Z M0 0L20 20M80 0L60 20M0 80L20 60M80 80L60 60';

export function Pattern({
  id,
  color,
  opacity,
  size,
  frame,
}: {
  id: string;
  color: string;
  opacity: number;
  size: number;
  frame?: StyleProp<ViewStyle>;
}) {
  const scale = size / 80;
  return (
    <Svg style={frame ?? StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <SvgPattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          <Path
            d={PATH8}
            scale={scale}
            fill="none"
            stroke={color}
            strokeWidth={2 / scale}
            opacity={opacity}
          />
        </SvgPattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

const MOSQUE_ART = [
  'M20 388H580',
  'M150 388V244H450V388',
  'M184 244H416',
  'M204 244C204 168 252 132 300 104C348 132 396 168 396 244',
  'M300 104V74',
  'M306 50a14 14 0 1 0 0 22a11 11 0 1 1 0-22Z',
  'M206 388V318a30 30 0 0 1 60 0V388',
  'M270 388V304a30 30 0 0 1 60 0V388',
  'M334 388V318a30 30 0 0 1 60 0V388',
  'M78 388V172M122 388V172M68 212H132M78 172L100 116L122 172M100 116V90',
  'M478 388V172M522 388V172M468 212H532M478 172L500 116L522 172M500 116V90',
  'M184 290H150M416 290H450',
];

const ART: Record<Exclude<ArtChoice, 'none'>, string[]> = {
  mosque: MOSQUE_ART,
  kaaba: [
    'M60 388H540',
    'M140 130L300 92L460 130L300 168Z',
    'M140 130V330L300 372V168M460 130V330L300 372',
    'M140 178L300 218L460 178M140 202L300 242L460 202',
    'M384 330V262L424 252V320',
  ],
  lantern: [
    'M300 38V62',
    'M246 108C246 80 274 62 300 62C326 62 354 80 354 108',
    'M232 108H368',
    'M248 108L228 140V284L250 316H350L372 284V140L352 108',
    'M228 140H372M228 284H372',
    'M272 262V196a28 28 0 0 1 56 0V262Z',
    'M300 168V156',
    'M262 316L282 350H318L338 316',
    'M300 350V376',
  ],
  moon: [
    'M330 56A156 156 0 1 0 486 268A126 126 0 1 1 330 56Z',
    'M470 76Q476.48 105.52 506 112Q476.48 118.48 470 148Q463.52 118.48 434 112Q463.52 105.52 470 76Z',
    'M540 192Q543.96 210.04 562 214Q543.96 217.96 540 236Q536.04 217.96 518 214Q536.04 210.04 540 192Z',
    'M412 24Q414.88 37.12 428 40Q414.88 42.88 412 56Q409.12 42.88 396 40Q409.12 37.12 412 24Z',
  ],
};

export function Art({ kind, width, color }: { kind: ArtChoice; width: number; color: string }) {
  if (kind === 'none') return null;
  const stroke = { fill: 'none', stroke: color, strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <Svg width={width} height={(width * 400) / 600} viewBox="0 0 600 400">
      {kind === 'lantern' ? <Circle cx={300} cy={26} r={12} {...stroke} /> : null}
      {ART[kind].map((d) => (
        <Path key={d} d={d} {...stroke} />
      ))}
    </Svg>
  );
}

export function Qr({ value, size }: { value: string; size: number }) {
  const path = useMemo(() => {
    const code = QRCode.create(value, { errorCorrectionLevel: 'M' });
    const count = code.modules.size;
    let d = '';
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (code.modules.get(row, col)) d += `M${col} ${row}h1v1h-1z`;
      }
    }
    return { d, count };
  }, [value]);
  return (
    <Svg width={size} height={size} viewBox={`-2 -2 ${path.count + 4} ${path.count + 4}`}>
      <Rect x={-2} y={-2} width={path.count + 4} height={path.count + 4} fill={ink.white} />
      <Path d={path.d} fill={ink.text} />
    </Svg>
  );
}

export function T({ style, children, lines }: { style?: StyleProp<TextStyle>; children: ReactNode; lines?: number }) {
  return (
    <Text style={[styles.text, style]} numberOfLines={lines} adjustsFontSizeToFit={lines != null} minimumFontScale={0.5}>
      {children}
    </Text>
  );
}

export function Header({
  brand,
  name,
  line,
  clock,
  dark,
  logoStyle,
  logoColor,
  nameStyle,
  lineStyle,
  clockStyle,
}: {
  brand: Brand;
  name: string;
  line: ReactNode;
  clock?: string | null;
  dark?: boolean;
  logoStyle?: StyleProp<ViewStyle>;
  logoColor?: string;
  nameStyle?: StyleProp<TextStyle>;
  lineStyle?: StyleProp<TextStyle>;
  clockStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={styles.hdr}>
      <View style={styles.lk}>
        <View style={[styles.logo, { backgroundColor: brand.b }, logoStyle]}>
          <T style={[styles.logoText, logoColor ? { color: logoColor } : null]}>{initialsOf(name)}</T>
        </View>
        <View style={styles.flexShrink}>
          <T style={[styles.mn, dark && { color: ink.mist100 }, nameStyle]} lines={1}>
            {name}
          </T>
          <T style={[styles.dt, dark && { color: ink.mist500 }, lineStyle]}>{line}</T>
        </View>
      </View>
      {clock ? <T style={[styles.clk, dark && { color: ink.mist100 }, clockStyle]}>{clock}</T> : null}
    </View>
  );
}

export function B({ color, children }: { color: string; children: ReactNode }) {
  return <Text style={{ color, fontWeight: '700' }}>{children}</Text>;
}

export function Card({ style, dark, children }: { style?: StyleProp<ViewStyle>; dark?: boolean; children: ReactNode }) {
  return <View style={[styles.card, dark && styles.cardDark, style]}>{children}</View>;
}

export function Label({
  icon,
  text,
  brand,
  color,
  iconColor,
  size = 30,
  iconSize = 40,
}: {
  icon: GlyphName;
  text: string;
  brand: Brand;
  color?: string;
  iconColor?: string;
  size?: number;
  iconSize?: number;
}) {
  return (
    <View style={styles.lbl}>
      <Glyph name={icon} size={iconSize} color={iconColor ?? brand.b} />
      <T style={[styles.lblText, { fontSize: size }, color ? { color } : null]}>{text}</T>
    </View>
  );
}

export function Pill({ text, brand, style, textStyle, icon = 'clock', iconSize = 44 }: {
  text: string;
  brand: Brand;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: GlyphName;
  iconSize?: number;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: brand.s }, style]}>
      <Glyph name={icon} size={iconSize} color={brand.d} />
      <T style={[styles.pillText, { color: brand.d }, textStyle]}>{text}</T>
    </View>
  );
}

export const clockOf = (date: Date | null | undefined) =>
  date && !Number.isNaN(date.getTime())
    ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    : '';

export function PrayerRows({ prayers, current, brand }: { prayers: TvPrayer[]; current: string | null; brand: Brand }) {
  return (
    <View>
      <View style={styles.ph}>
        <T style={[styles.phText, styles.grow]}>Bønn</T>
        <T style={[styles.phText, styles.col]}>Azan</T>
        <T style={[styles.phText, styles.col]}>Iqamah</T>
      </View>
      {prayers.map((prayer) => {
        const on = prayer.name === current;
        return (
          <View key={prayer.name} style={[styles.pr, on && { backgroundColor: brand.s }]}>
            <View style={[styles.grow, styles.prName]}>
              <Glyph name={PRAYER_GLYPH[prayer.name]} size={40} color={on ? brand.b : ink.muted} />
              <T style={[styles.prText, on && { fontWeight: '800', color: brand.d }]}>{prayer.label}</T>
            </View>
            <T style={[styles.prText, styles.col, styles.prMuted, on && { color: brand.d }]}>{clockOf(prayer.azan)}</T>
            <T style={[styles.prText, styles.col, styles.prBold, on && { color: brand.d }]}>{clockOf(prayer.iqamah)}</T>
          </View>
        );
      })}
    </View>
  );
}

export function Timeline({ prayers, now, brand }: { prayers: TvPrayer[]; now: Date; brand: Brand }) {
  const [width, setWidth] = useState(0);
  const first = prayers[0]?.azan.getTime() ?? now.getTime();
  const last = prayers[prayers.length - 1]?.azan.getTime() ?? now.getTime();
  const lo = first - 65 * 60_000;
  const hi = last + 70 * 60_000;
  const at = (time: number) => Math.min(Math.max((time - lo) / (hi - lo), 0), 1) * width;
  const nowX = at(now.getTime());
  return (
    <View style={styles.tl} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <View style={styles.tlt}>
        <View style={[styles.tlf, { width: nowX, backgroundColor: brand.b }]} />
      </View>
      {width > 0
        ? prayers.map((prayer) => {
            const x = at(prayer.azan.getTime());
            const passed = x <= nowX;
            return (
              <View key={prayer.name} style={StyleSheet.absoluteFill} pointerEvents="none">
                <View
                  style={[styles.tlm, { left: x - 12 }, passed && { borderColor: brand.b, backgroundColor: brand.b }]}
                />
                <View style={[styles.tlx, { left: x - 110 }]}>
                  <T style={styles.tlxText}>{prayer.label}</T>
                  <T style={styles.tlxTime}>{clockOf(prayer.azan)}</T>
                </View>
              </View>
            );
          })
        : null}
      {width > 0 ? <View style={[styles.tln, { left: nowX - 24, borderColor: brand.b }]} /> : null}
    </View>
  );
}

export type StripItem = { key: string; icon: GlyphName; label: string; time: string; current: boolean };

export function Strip({ items, brand }: { items: StripItem[]; brand: Brand }) {
  return (
    <View style={styles.strip}>
      {items.map((item) => (
        <View key={item.key} style={[styles.stripCell, item.current && { backgroundColor: brand.s }]}>
          <Glyph name={item.icon} size={44} color={item.current ? brand.b : ink.muted} />
          <View>
            <T style={[styles.stripLabel, item.current && { color: brand.d }]}>{item.label}</T>
            <T style={[styles.stripTime, item.current && { color: brand.d }]}>{item.time}</T>
          </View>
        </View>
      ))}
    </View>
  );
}

export const styles = StyleSheet.create({
  text: { color: ink.text, ...num },
  grow: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  col: { width: 170, textAlign: 'right' },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 48 },
  lk: { flexDirection: 'row', alignItems: 'center', gap: 24, flexShrink: 1 },
  logo: { width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 38, fontWeight: '800', letterSpacing: -0.8, color: ink.white },
  mn: { fontSize: 44, fontWeight: '700', letterSpacing: -0.4, lineHeight: 50 },
  dt: { fontSize: 26, color: ink.muted, marginTop: 6, fontWeight: '500' },
  dtb: { fontSize: 26, fontWeight: '700' },
  clk: { fontSize: 112, fontWeight: '300', letterSpacing: -3.4, lineHeight: 118 },
  card: { backgroundColor: ink.card, borderWidth: 2, borderColor: ink.line, borderRadius: 32 },
  cardDark: { backgroundColor: '#151F1B', borderColor: '#27362F' },
  lbl: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  lblText: { fontSize: 30, fontWeight: '600', color: ink.muted },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 16,
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  pillText: { fontSize: 40, fontWeight: '700' },
  ph: { flexDirection: 'row', paddingTop: 8, paddingHorizontal: 28, paddingBottom: 12 },
  phText: { fontSize: 24, fontWeight: '600', color: ink.muted },
  pr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, height: 84, borderRadius: 24 },
  prName: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  prText: { fontSize: 40, fontWeight: '500' },
  prMuted: { color: ink.muted },
  prBold: { fontWeight: '700' },
  tl: { height: 124 },
  tlt: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 22,
    height: 12,
    borderRadius: 6,
    backgroundColor: ink.track,
    overflow: 'hidden',
  },
  tlf: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  tlm: {
    position: 'absolute',
    top: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ink.white,
    borderWidth: 4,
    borderColor: ink.mark,
  },
  tln: {
    position: 'absolute',
    top: 4,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ink.white,
    borderWidth: 8,
  },
  tlx: { position: 'absolute', top: 60, width: 220, alignItems: 'center' },
  tlxText: { fontSize: 22, color: ink.muted, fontWeight: '500' },
  tlxTime: { fontSize: 30, fontWeight: '700' },
  strip: { flexDirection: 'row', gap: 12 },
  stripCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  stripLabel: { fontSize: 26, color: ink.muted, fontWeight: '600' },
  stripTime: { fontSize: 40, fontWeight: '700' },
});
