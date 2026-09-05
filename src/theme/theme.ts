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
  filterSurface: string;
  filterBorder: string;
  filterActiveSurface: string;
  filterActiveBorder: string;
  filterActiveText: string;
  seasonHighlight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderStrong: string;
  track: string;
  trackMarker: string;
  danger: string;
  info: string;
  success: string;
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  skeleton: string;
  overlay: string;
  mapPinRing: string;
  mapFacing: string;
  mapFacingFill: string;
};

export type Theme = {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
};

export const lightTheme: Theme = {
  scheme: 'light',
  colors: {
    background: palette.neutral50,
    surface: palette.neutral0,
    surfaceElevated: palette.neutral0,
    surfaceSunken: palette.neutral100,
    primary: palette.emerald600,
    onPrimary: palette.neutral0,
    primarySoft: palette.emerald50,
    onPrimarySoft: palette.emerald700,
    accent: palette.gold600,
    onAccent: palette.neutral0,
    filterSurface: palette.neutral0,
    filterBorder: palette.neutral300,
    filterActiveSurface: palette.gold50,
    filterActiveBorder: palette.gold600,
    filterActiveText: palette.gold700,
    seasonHighlight: palette.gold600,
    textPrimary: palette.neutral900,
    textSecondary: palette.neutral700,
    textMuted: palette.neutral500,
    textInverse: palette.neutral0,
    border: palette.neutral200,
    borderStrong: palette.neutral300,
    track: palette.neutral100,
    trackMarker: palette.neutral300,
    danger: palette.red600,
    info: palette.blue600,
    success: palette.emerald500,
    tabBarBackground: palette.neutral0,
    tabBarActive: palette.emerald600,
    tabBarInactive: palette.neutral500,
    skeleton: palette.neutral200,
    overlay: 'rgba(24, 36, 32, 0.5)',
    mapPinRing: palette.neutral0,
    mapFacing: palette.mapBlue,
    mapFacingFill: 'rgba(26, 115, 232, 0.25)',
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
    filterSurface: palette.night800,
    filterBorder: palette.night600,
    filterActiveSurface: palette.night700,
    filterActiveBorder: palette.gold400,
    filterActiveText: palette.gold400,
    seasonHighlight: palette.gold400,
    textPrimary: palette.mist100,
    textSecondary: palette.mist300,
    textMuted: palette.mist500,
    textInverse: palette.neutral900,
    border: palette.night700,
    borderStrong: palette.night600,
    track: palette.night700,
    trackMarker: palette.night600,
    danger: palette.red400,
    info: palette.blue600,
    success: palette.emerald400,
    tabBarBackground: palette.night900,
    tabBarActive: palette.emerald400,
    tabBarInactive: palette.mist500,
    skeleton: palette.night700,
    overlay: 'rgba(0, 0, 0, 0.6)',
    mapPinRing: palette.neutral0,
    mapFacing: palette.mapBlue,
    mapFacingFill: 'rgba(26, 115, 232, 0.25)',
  },
};
