import { palette } from './tokens';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSunken: string;
  segmentActive: string;
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
  switchThumb: string;
  danger: string;
  notice: string;
  noticeSoft: string;
  onNoticeSoft: string;
  info: string;
  success: string;
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  skeleton: string;
  overlay: string;
  pressedLayer: string;
  mapPinRing: string;
  mapFacing: string;
  mapFacingFill: string;
  travelSurface: string;
  onTravelSurface: string;
  travelSurfaceMuted: string;
  eidSurface: string;
  onEidSurface: string;
  eidSurfaceMuted: string;
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
    segmentActive: palette.neutral0,
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
    switchThumb: palette.neutral0,
    danger: palette.red600,
    notice: palette.blue600,
    noticeSoft: palette.sky50,
    onNoticeSoft: palette.sky700,
    info: palette.blue600,
    success: palette.emerald500,
    tabBarBackground: palette.neutral0,
    tabBarActive: palette.emerald600,
    tabBarInactive: palette.neutral500,
    skeleton: palette.neutral200,
    overlay: 'rgba(24, 36, 32, 0.5)',
    pressedLayer: 'rgba(24, 36, 32, 0.08)',
    mapPinRing: palette.neutral0,
    mapFacing: palette.mapBlue,
    mapFacingFill: 'rgba(26, 115, 232, 0.25)',
    travelSurface: palette.travel50,
    onTravelSurface: palette.travel700,
    travelSurfaceMuted: palette.travel500,
    eidSurface: palette.gold50,
    onEidSurface: palette.gold700,
    eidSurfaceMuted: palette.gold600,
  },
};

export const darkTheme: Theme = {
  scheme: 'dark',
  colors: {
    background: palette.night950,
    surface: palette.night900,
    surfaceElevated: palette.night800,
    surfaceSunken: palette.night800,
    segmentActive: palette.night700,
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
    switchThumb: palette.neutral0,
    danger: palette.red400,
    notice: palette.sky200,
    noticeSoft: palette.sky900,
    onNoticeSoft: palette.sky200,
    info: palette.blue600,
    success: palette.emerald400,
    tabBarBackground: palette.night900,
    tabBarActive: palette.emerald400,
    tabBarInactive: palette.mist500,
    skeleton: palette.night700,
    overlay: 'rgba(0, 0, 0, 0.6)',
    pressedLayer: 'rgba(255, 255, 255, 0.1)',
    mapPinRing: palette.neutral0,
    mapFacing: palette.mapBlue,
    mapFacingFill: 'rgba(26, 115, 232, 0.25)',
    travelSurface: palette.travel900,
    onTravelSurface: palette.travel100,
    travelSurfaceMuted: palette.travel200,
    eidSurface: palette.gold900,
    onEidSurface: palette.gold100,
    eidSurfaceMuted: palette.gold200,
  },
};

const TRAVEL_LIGHT: Partial<ThemeColors> = {
  primary: palette.travel600,
  primarySoft: palette.travel50,
  onPrimarySoft: palette.travel700,
  accent: palette.travel500,
  tabBarActive: palette.travel600,
  filterActiveSurface: palette.travel50,
  filterActiveBorder: palette.travel200,
  filterActiveText: palette.travel700,
};

const TRAVEL_DARK: Partial<ThemeColors> = {
  primary: palette.travel400,
  primarySoft: palette.travel900,
  onPrimarySoft: palette.travel100,
  accent: palette.travel200,
  tabBarActive: palette.travel400,
  filterActiveSurface: palette.travel900,
  filterActiveBorder: palette.travel700,
  filterActiveText: palette.travel100,
};

export function travelTheme(theme: Theme): Theme {
  const overrides = theme.scheme === 'dark' ? TRAVEL_DARK : TRAVEL_LIGHT;
  return { scheme: theme.scheme, colors: { ...theme.colors, ...overrides } };
}

const EID_LIGHT: Partial<ThemeColors> = {
  primary: palette.gold600,
  primarySoft: palette.gold50,
  onPrimarySoft: palette.gold700,
  tabBarActive: palette.gold600,
  filterActiveSurface: palette.gold50,
  filterActiveBorder: palette.gold200,
  filterActiveText: palette.gold700,
};

const EID_DARK: Partial<ThemeColors> = {
  primary: palette.gold400,
  primarySoft: palette.gold900,
  onPrimarySoft: palette.gold100,
  tabBarActive: palette.gold400,
  filterActiveSurface: palette.gold900,
  filterActiveBorder: palette.gold700,
  filterActiveText: palette.gold100,
};

export function eidTheme(theme: Theme): Theme {
  const overrides = theme.scheme === 'dark' ? EID_DARK : EID_LIGHT;
  return { scheme: theme.scheme, colors: { ...theme.colors, ...overrides } };
}
