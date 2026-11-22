import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export type Palette = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  accent: string;
  danger: string;
  success: string;
  overlay: string;
};

const light: Palette = {
  bg: '#FBF7F0',
  surface: '#FFFFFF',
  surfaceAlt: '#F3ECE0',
  border: '#E7DDCF',
  text: '#2A1B2E',
  textMuted: '#6E6275',
  primary: '#6B2D5C',
  onPrimary: '#FFFFFF',
  accent: '#E0A030',
  danger: '#C0392B',
  success: '#2E7D5B',
  overlay: 'rgba(30,15,35,0.45)',
};

const dark: Palette = {
  bg: '#15101A',
  surface: '#1F1824',
  surfaceAlt: '#2A2230',
  border: '#382F40',
  text: '#F4EDE4',
  textMuted: '#A89DB0',
  primary: '#C77DB5',
  onPrimary: '#1A0F1D',
  accent: '#F0B848',
  danger: '#FF7B72',
  success: '#5BC38F',
  overlay: 'rgba(0,0,0,0.6)',
};

export const fonts = {
  serif: (Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string),
};

export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };

type ThemeCtx = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  scheme: 'light' | 'dark';
  colors: Palette;
};

const Ctx = createContext<ThemeCtx>({
  mode: 'light',
  setMode: () => {},
  scheme: 'light',
  colors: light,
});

const KEY = 'cc.theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  // Until the user picks a mode, start from the device's current scheme.
  // (A legacy stored value of 'system' is ignored for the same reason.)
  const [mode, setModeState] = useState<ThemeMode>(system === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark') setModeState(v);
      })
      .catch(() => {});
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(KEY, m).catch(() => {});
  }, []);

  const scheme = mode;
  const value = useMemo(
    () => ({ mode, setMode, scheme, colors: scheme === 'dark' ? dark : light }),
    [mode, setMode, scheme],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
