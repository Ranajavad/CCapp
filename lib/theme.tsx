import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export type Palette = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  /** The one font colour used for ALL text in the app (per theme). */
  text: string;
  /** Soft tone for icons / placeholders only — never used for text. */
  textMuted: string;
  primary: string;
  /** Text on top of `primary` — identical to `text` by design. */
  onPrimary: string;
  accent: string;
  danger: string;
  success: string;
  overlay: string;
  /** Avatar backgrounds; the single `text` colour is always readable on them. */
  avatars: string[];
};

// Minimal "cream and sage" — warm neutrals, ink-dark primary, one sage accent.
const light: Palette = {
  bg: '#F7F5F0', // cream
  surface: '#FFFFFF',
  surfaceAlt: '#E9ECE4', // pale sage-grey
  border: '#DCDFD3',
  text: '#1E211C', // ink
  textMuted: '#868B7E',
  primary: '#1E211C', // ink — buttons, selected chips
  onPrimary: '#F7F5F0', // cream on ink
  accent: '#8BA17F', // sage — progress, stars, highlights
  danger: '#E39A93', // soft rose-red
  success: '#A3B899',
  overlay: 'rgba(30,33,28,0.40)',
  avatars: ['#C9D4BE', '#E9D3CF', '#DCCFB4', '#D4DAD0', '#E3C4C4', '#BFCDB3'],
};

// Dark counterpart — warm charcoal, cream primary, same sage accent.
const dark: Palette = {
  bg: '#161715',
  surface: '#1F211E',
  surfaceAlt: '#2A2D28',
  border: '#383C35',
  text: '#F1EFE8', // cream
  textMuted: '#8C9185',
  primary: '#F1EFE8', // cream — buttons, selected chips
  onPrimary: '#161715', // ink on cream
  accent: '#9DB391', // sage
  danger: '#B4584F',
  success: '#6F8A64',
  overlay: 'rgba(8,10,8,0.65)',
  avatars: ['#4A5A42', '#6B4A47', '#6B5E43', '#3E463A', '#74504F', '#55684A'],
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
