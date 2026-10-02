export const palette = {
  emerald50: '#E9F4EF',
  emerald100: '#D3EAE0',
  emerald200: '#A7D5C2',
  emerald300: '#6FBA9D',
  emerald400: '#38A07C',
  emerald500: '#12845F',
  emerald600: '#0C6B52',
  emerald700: '#095844',
  emerald800: '#074536',
  emerald900: '#053327',

  gold50: '#FAF3DE',
  gold400: '#D9B84F',
  gold600: '#8F7112',
  gold700: '#6E570D',

  neutral0: '#FFFFFF',
  neutral50: '#F6F8F7',
  neutral100: '#EDF1EF',
  neutral200: '#DDE4E0',
  neutral300: '#C3CEC8',
  neutral500: '#5F6E67',
  neutral700: '#3E4C46',
  neutral900: '#182420',

  night950: '#0F1714',
  night900: '#151F1B',
  night800: '#1C2823',
  night700: '#27362F',
  night600: '#354740',

  mist100: '#EEF2F0',
  mist300: '#C6D0CB',
  mist500: '#8C9A93',

  black: '#000000',

  red600: '#B23B31',
  red400: '#D96A61',
  blue600: '#2A6497',
  mapBlue: '#1A73E8',

  travel50: '#EBEEF8',
  travel100: '#D8DEF1',
  travel200: '#B2BEE3',
  travel400: '#5E7CC2',
  travel500: '#41619F',
  travel600: '#33549A',
  travel700: '#26406F',
  travel800: '#1B2E51',
  travel900: '#131F38',

  sky50: '#EAF1F7',
  sky200: '#B7CFE3',
  sky700: '#1F4C74',
  sky900: '#12293D',
} as const;

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 40,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const fontFamily = {
  heading: undefined,
  body: undefined,
  mono: 'Menlo',
} as const;

export const arabicType = {
  family: 'AmiriQuran_400Regular',
  size: 28,
  leading: 2.1,
  maxScale: 1.6,
} as const;

export const counterType = {
  size: 64,
  maxScale: 1.2,
} as const;

export const lineHeight = {
  tight: 1.15,
  normal: 1.45,
  relaxed: 1.7,
} as const;

export const duration = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;

export const opacity = {
  pressed: 0.7,
  disabled: 0.4,
} as const;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type FontSizeToken = keyof typeof fontSize;
export type FontWeightToken = keyof typeof fontWeight;
