import { palette } from '@/theme/tokens';

export const ink = {
  page: palette.neutral50,
  card: palette.neutral0,
  line: palette.neutral200,
  track: '#E4EAE7',
  mark: palette.neutral300,
  accent: palette.emerald600,
  text: palette.neutral900,
  body: palette.neutral700,
  muted: palette.neutral500,
  white: palette.neutral0,
  gold50: palette.gold50,
  gold100: palette.gold100,
  gold400: palette.gold400,
  gold600: palette.gold600,
  gold700: palette.gold700,
  gold800: palette.gold800,
  night950: palette.night950,
  night900: palette.night900,
  night800: palette.night800,
  night700: palette.night700,
  nightDot: '#3A4B43',
  mist100: palette.mist100,
  mist300: palette.mist300,
  mist500: palette.mist500,
} as const;

export const BRAND_OPTIONS = [palette.emerald600, '#1F4E8C', '#7A2E3B', '#4A3F8C'] as const;

export type Brand = {
  b: string;
  s: string;
  t: string;
  d: string;
  m: string;
};

function mix(hex: string, weight: number, to: number): string {
  const n = parseInt(hex.slice(1), 16);
  return (
    '#' +
    [n >> 16, (n >> 8) & 255, n & 255]
      .map((v) => Math.round(v * (1 - weight) + to * weight))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

export function brandColors(hex: string): Brand {
  return {
    b: hex,
    s: mix(hex, 0.9, 255),
    t: mix(hex, 0.8, 255),
    d: mix(hex, 0.3, 0),
    m: mix(hex, 0.45, 255),
  };
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export const num = { fontVariant: ['tabular-nums' as const] };
