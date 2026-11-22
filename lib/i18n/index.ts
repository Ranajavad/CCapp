import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { useCallback } from 'react';
import { initReactI18next, useTranslation } from 'react-i18next';
import { en, nb } from './translations';

export type Lang = 'en' | 'nb';
export type LangPref = 'system' | Lang;
export type TKey = keyof typeof en;

const KEY = 'cc.language';

export function deviceLanguage(): Lang {
  const code = Localization.getLocales()[0]?.languageCode ?? 'en';
  return ['nb', 'nn', 'no'].includes(code) ? 'nb' : 'en';
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, nb: { translation: nb } },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  initImmediate: false,
  returnNull: false,
  // Hermes inside Expo Go has no Intl.PluralRules; use i18next's built-in plural rules
  // (we only use simple {{n}} interpolation, no plural keys) so it doesn't log a red error.
  compatibilityJSON: 'v3',
});

export async function loadLanguagePref(): Promise<LangPref> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v === 'en' || v === 'nb' || v === 'system') return v;
  } catch {
    // ignore
  }
  return 'system';
}

export async function applyLanguagePref(pref: LangPref) {
  await i18n.changeLanguage(pref === 'system' ? deviceLanguage() : pref);
}

export async function setLanguagePref(pref: LangPref) {
  await applyLanguagePref(pref);
  try {
    await AsyncStorage.setItem(KEY, pref);
  } catch {
    // ignore
  }
}

/** Typed translation hook: `t('some.key', { name })` – unknown keys fail type-checking. */
export function useT() {
  const { i18n: inst } = useTranslation();
  const t = useCallback(
    (key: TKey, opts?: Record<string, unknown>) => inst.t(key, opts) as unknown as string,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inst.language],
  );
  return { t, lang: (inst.language === 'nb' ? 'nb' : 'en') as Lang };
}

export default i18n;
