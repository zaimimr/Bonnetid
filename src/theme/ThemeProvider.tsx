import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, eidTheme, lightTheme, travelTheme, type Theme } from './theme';
import { useEidMode } from '@/hooks/useEidMode';
import { useIsCalculatedMode, useSettings } from '@/store/settings';

type ThemePreference = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const preference = useSettings((state) => state.themePreference);
  const setThemePreference = useSettings((state) => state.setThemePreference);

  const travelling = useIsCalculatedMode();
  const eid = useEidMode() != null;

  const scheme = preference === 'system' ? (systemScheme ?? 'light') : preference;
  const base = scheme === 'dark' ? darkTheme : lightTheme;
  const theme = useMemo(() => {
    if (travelling) return travelTheme(base);
    return eid ? eidTheme(base) : base;
  }, [travelling, eid, base]);

  const value = useMemo(
    () => ({ theme, preference, setPreference: setThemePreference }),
    [theme, preference, setThemePreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeContext must be used within ThemeProvider');
  return context;
}

export function useTheme(): Theme {
  return useThemeContext().theme;
}
