import type { ReactNode } from 'react';
import { Circle, Defs, G, Mask, Path, Rect } from 'react-native-svg';

import { PHOSPHOR } from './phosphor';

const SW = 16;

type Draw = (color: string, fill: boolean, id: string) => ReactNode;

function Stroke({ d, color, width = SW }: { d: string; color: string; width?: number }) {
  return (
    <Path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
  );
}

function Solid({ d, color }: { d: string; color: string }) {
  return <Path d={d} fill={color} />;
}

function Cutout({ id, shape, cuts }: { id: string; shape: ReactNode; cuts: ReactNode }) {
  return (
    <>
      <Defs>
        <Mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="256" height="256">
          <Rect width="256" height="256" fill="#fff" />
          {cuts}
        </Mask>
      </Defs>
      <G mask={`url(#${id})`}>{shape}</G>
    </>
  );
}

const SUN_ARC = 'M64 160a64 64 0 0 1 128 0';
const SUN_LINES = 'M16 160H240M48 200H208M57 89l12 12M199 89l-12 12M47 138l-16-4M209 138l16-4';

function horizonSun(color: string, fill: boolean, arrow: string) {
  return (
    <>
      {fill ? <Solid d={`${SUN_ARC}Z`} color={color} /> : <Stroke d={SUN_ARC} color={color} />}
      <Stroke d={SUN_LINES} color={color} />
      <Stroke d={arrow} color={color} />
    </>
  );
}

const BEADS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  return { cx: 128 + 88 * Math.sin(angle), cy: 128 - 88 * Math.cos(angle) };
});

const TRACKER_ARCS = Array.from({ length: 5 }, (_, i) => {
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `${(128 + 96 * Math.cos(rad)).toFixed(1)} ${(128 + 96 * Math.sin(rad)).toFixed(1)}`;
  };
  return `M${point(i * 72 - 81)}A96 96 0 0 1 ${point(i * 72 - 27)}`;
}).join('');

const MAT_FRINGE =
  'M80 216V236M104 216V236M128 216V236M152 216V236M176 216V236M80 40V20M104 40V20M128 40V20M152 40V20M176 40V20';

const CRESCENT = 'M123.1 28.3A44 44 0 1 0 166.5 93.3A40 40 0 0 1 123.1 28.3Z';
const BOWL = 'M32 148H224a96 60 0 0 1-192 0Z';

const HAND_SCALE = 0.66;
const HAND_TOP = 128 - (224 * HAND_SCALE) / 2 - 16 * HAND_SCALE;

export const CUSTOM_ICONS = {
  sunrise: (color, fill) => horizonSun(color, fill, 'M128 76V24M100 52l28-28 28 28'),
  sunset: (color, fill) => horizonSun(color, fill, 'M128 24V76M100 48l28 28 28-28'),
  kaaba: (color, fill, id) =>
    fill ? (
      <Cutout
        id={id}
        shape={<Solid d="M128 28 220 80V176L128 228 36 176V80Z" color={color} />}
        cuts={
          <>
            <Stroke d="M36 80 128 132 220 80M128 132V228" color="#000" />
            <Stroke d="M36 112 128 164 220 112" color="#000" width={SW * 1.6} />
          </>
        }
      />
    ) : (
      <Stroke d="M128 32 216 80V176L128 224 40 176V80ZM40 80 128 128 216 80M128 128V224M40 112 128 160 216 112" color={color} />
    ),
  'mosque-pin': (color, fill, id) =>
    fill ? (
      <Cutout
        id={id}
        shape={<Solid d="M128 240s-88-60-88-136a88 88 0 0 1 176 0c0 76-88 136-88 136Z" color={color} />}
        cuts={
          <>
            <Solid d="M94 124a34 34 0 0 1 68 0Z" color="#000" />
            <Stroke d="M128 90V70" color="#000" />
          </>
        }
      />
    ) : (
      <Stroke
        d="M208 104c0 72-80 128-80 128S48 176 48 104a80 80 0 0 1 160 0ZM96 124a32 32 0 0 1 64 0ZM128 92V76"
        color={color}
      />
    ),
  minbar: (color, fill) => (
    <>
      {fill ? (
        <Solid d="M44 216V180H80V148H116V116H152V216ZM152 108a28 28 0 0 1 56 0Z" color={color} />
      ) : (
        <Stroke d="M48 216V184H80V152H112V120H152M152 108a28 28 0 0 1 56 0Z" color={color} />
      )}
      <Stroke d="M152 108V216M208 108V216M180 80V60M24 216H232" color={color} />
    </>
  ),
  tasbih: (color, fill) =>
    BEADS.map((bead, i) => <Circle key={i} cx={bead.cx} cy={bead.cy} r={fill ? 19 : 15} fill={color} />),
  sehri: (color, fill) => (
    <>
      {fill ? (
        <Solid d={`${CRESCENT}${BOWL}`} color={color} />
      ) : (
        <Stroke d={`${CRESCENT}${BOWL}`} color={color} />
      )}
      <Stroke d="M96 228H160" color={color} />
    </>
  ),
  'dua-hands': (color, fill) => {
    const paths = PHOSPHOR['hand-palm'][fill ? 'fill' : 'bold'].map((d, i) => <Path key={i} d={d} fill={color} />);
    return (
      <>
        <G transform={`translate(${131 - 40 * HAND_SCALE} ${HAND_TOP}) scale(${HAND_SCALE})`}>{paths}</G>
        <G transform={`translate(${125 + 40 * HAND_SCALE} ${HAND_TOP}) scale(${-HAND_SCALE} ${HAND_SCALE})`}>{paths}</G>
      </>
    );
  },
  'prayer-tracker': (color, fill) => (
    <>
      <Path d={TRACKER_ARCS} fill="none" stroke={color} strokeWidth={fill ? SW * 1.6 : SW} strokeLinecap="round" />
      <Stroke d="M96 130l22 22 42-42" color={color} />
    </>
  ),
  'prayer-mat': (color, fill, id) => (
    <>
      {fill ? (
        <Cutout
          id={id}
          shape={<Solid d="M56 32H200V224H56Z" color={color} />}
          cuts={<Solid d="M100 192V104a28 28 0 0 1 56 0V192Z" color="#000" />}
        />
      ) : (
        <Stroke d="M64 40H192V216H64ZM100 184V104a28 28 0 0 1 56 0V184Z" color={color} />
      )}
      <Stroke d={MAT_FRINGE} color={color} />
    </>
  ),
  lantern: (color, fill, id) => (
    <>
      <Circle cx="128" cy="28" r="12" fill="none" stroke={color} strokeWidth={SW} />
      {fill ? (
        <>
          <Solid d="M92 72 128 44l36 28ZM100 188 128 222 156 188Z" color={color} />
          <Cutout
            id={id}
            shape={<Solid d="M84 68H172L190 128 172 188H84L66 128Z" color={color} />}
            cuts={<Solid d="M108 166V128a20 20 0 0 1 40 0V166Z" color="#000" />}
          />
        </>
      ) : (
        <Stroke
          d="M96 72 128 48 160 72ZM88 72H168L184 128 168 184H88L72 128ZM108 164V128a20 20 0 0 1 40 0V164ZM104 184 128 216 152 184"
          color={color}
        />
      )}
    </>
  ),
} satisfies Record<string, Draw>;

export type CustomIconName = keyof typeof CUSTOM_ICONS;
