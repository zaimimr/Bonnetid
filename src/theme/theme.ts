import { palette } from './tokens';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSunken: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  onPrimarySoft: string;
  accent: string;
  onAccent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderStrong: string;
  danger: string;
  info: string;
  heroGradientStart: string;
  heroGradientEnd: string;
  onHero: string;
  onHeroMuted: string;
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  skeleton: string;
  overlay: string;
};

export type Theme = {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
};

export const lightTheme: Theme = {
  scheme: 'light',
  colors: {
    background: palette.sand50,
    surface: palette.white,
    surfaceElevated: palette.white,
    surfaceSunken: palette.sand100,
    primary: palette.emerald600,
    onPrimary: palette.white,
    primarySoft: palette.emerald50,
    onPrimarySoft: palette.emerald700,
    accent: palette.gold500,
    onAccent: palette.ink900,
    textPrimary: palette.ink900,
    textSecondary: palette.ink700,
    textMuted: palette.ink500,
    textInverse: palette.white,
    border: palette.sand200,
    borderStrong: palette.sand300,
    danger: palette.red500,
    info: palette.blue500,
    heroGradientStart: palette.emerald700,
    heroGradientEnd: palette.emerald900,
    onHero: palette.white,
    onHeroMuted: palette.emerald200,
    tabBarBackground: palette.white,
    tabBarActive: palette.emerald600,
    tabBarInactive: palette.ink300,
    skeleton: palette.sand200,
    overlay: 'rgba(20, 32, 27, 0.5)',
  },
};

export const darkTheme: Theme = {
  scheme: 'dark',
  colors: {
    background: palette.night950,
    surface: palette.night900,
    surfaceElevated: palette.night800,
    surfaceSunken: palette.night950,
    primary: palette.emerald400,
    onPrimary: palette.night950,
    primarySoft: palette.night700,
    onPrimarySoft: palette.emerald200,
    accent: palette.gold400,
    onAccent: palette.night950,
    textPrimary: palette.mist100,
    textSecondary: palette.mist300,
    textMuted: palette.mist500,
    textInverse: palette.ink900,
    border: palette.night700,
    borderStrong: palette.night600,
    danger: palette.red400,
    info: palette.blue500,
    heroGradientStart: palette.emerald800,
    heroGradientEnd: palette.night950,
    onHero: palette.mist100,
    onHeroMuted: palette.emerald300,
    tabBarBackground: palette.night900,
    tabBarActive: palette.emerald400,
    tabBarInactive: palette.mist500,
    skeleton: palette.night700,
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
};
