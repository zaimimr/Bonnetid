export const palette = {
  emerald50: '#EDF7F2',
  emerald100: '#D5EDE2',
  emerald200: '#A8DCC5',
  emerald300: '#72C4A3',
  emerald400: '#3FA981',
  emerald500: '#188A64',
  emerald600: '#0E7B5F',
  emerald700: '#0B5F4A',
  emerald800: '#0A4A3B',
  emerald900: '#08352C',
  emerald950: '#05231D',

  gold300: '#E8CD7A',
  gold400: '#D9B84F',
  gold500: '#C9A227',
  gold600: '#A98614',

  sand50: '#FAF9F5',
  sand100: '#F3F1E9',
  sand200: '#E7E3D5',
  sand300: '#D3CDB8',

  ink900: '#14201B',
  ink700: '#33413A',
  ink500: '#5C6B63',
  ink300: '#95A29A',

  night950: '#0A1210',
  night900: '#101B17',
  night800: '#16241F',
  night700: '#1F312A',
  night600: '#2B4038',

  mist100: '#F2F4F1',
  mist300: '#C9D2CC',
  mist500: '#8FA096',

  white: '#FFFFFF',
  black: '#000000',

  red500: '#C4453B',
  red400: '#D96A61',
  blue500: '#2F6FA7',
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
