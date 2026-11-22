import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

/** Returns true when a session was created, false when e-mail confirmation is pending. */
export async function signUpWithEmail(name: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: name.trim() } },
  });
  if (error) throw error;
  return data.session != null;
}

export async function isAppleAvailable() {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Sign in with Apple (iPhone). Returns false if the user cancelled. */
export async function signInWithApple() {
  try {
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!cred.identityToken) throw new Error('No identity token from Apple');
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: cred.identityToken,
    });
    if (error) throw error;
    const given = cred.fullName?.givenName;
    if (given) {
      const full = [given, cred.fullName?.familyName].filter(Boolean).join(' ');
      await supabase.auth.updateUser({ data: { full_name: full } });
      const { data } = await supabase.auth.getUser();
      if (data.user) await supabase.from('profiles').update({ display_name: full }).eq('id', data.user.id);
    }
    return true;
  } catch (e: any) {
    if (e?.code === 'ERR_REQUEST_CANCELED') return false;
    throw e;
  }
}

/** Sign in with Google through Supabase OAuth (PKCE) in an in-app browser. */
export async function signInWithGoogle() {
  // On phones the auth sheet listens for the app's own scheme (also Supabase's Site URL),
  // which works in Expo Go too. On web, return to the current origin.
  const redirectTo = Platform.OS === 'web' ? Linking.createURL('auth-callback') : 'candc://auth-callback';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned');

  // Ephemeral session: don't share Safari cookies, which avoids a Google account chooser
  // that hangs on iOS (Expo Go). Users pick their account each time.
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    preferEphemeralSession: true,
  });
  if (result.type !== 'success') return false;

  const url = new URL(result.url);
  const code = url.searchParams.get('code');
  if (code) {
    const { error: e } = await supabase.auth.exchangeCodeForSession(code);
    if (e) throw e;
    return true;
  }
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  const access_token = hash.get('access_token');
  const refresh_token = hash.get('refresh_token');
  if (access_token && refresh_token) {
    const { error: e } = await supabase.auth.setSession({ access_token, refresh_token });
    if (e) throw e;
    return true;
  }
  throw new Error(url.searchParams.get('error_description') ?? 'Google sign-in failed');
}

export async function sendPasswordResetCode(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  if (error) throw error;
}

/** Verifies the 6-digit recovery code from the e-mail and sets the new password. */
export async function resetPasswordWithCode(email: string, code: string, newPassword: string) {
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
  if (error) throw error;
  const { error: e2 } = await supabase.auth.updateUser({ password: newPassword });
  if (e2) throw e2;
}

const REMEMBERED_KEY = 'rememberedAccount';

export type RememberedAccount = { name: string; avatar: string | null; email: string; refreshToken: string };

// The refresh token lets the user come straight back in, so keep it in the device's secure storage.
const store = {
  get: (k: string) => (Platform.OS === 'web' ? AsyncStorage.getItem(k) : SecureStore.getItemAsync(k)),
  set: (k: string, v: string) => (Platform.OS === 'web' ? AsyncStorage.setItem(k, v) : SecureStore.setItemAsync(k, v)),
  del: (k: string) => (Platform.OS === 'web' ? AsyncStorage.removeItem(k) : SecureStore.deleteItemAsync(k)),
};

/** The account that logged out last on this device (shown on the log-in page for a one-tap return). */
export async function getRememberedAccount(): Promise<RememberedAccount | null> {
  try {
    const raw = await store.get(REMEMBERED_KEY);
    return raw ? (JSON.parse(raw) as RememberedAccount) : null;
  } catch {
    return null;
  }
}

export async function forgetRememberedAccount() {
  try {
    await store.del(REMEMBERED_KEY);
  } catch {}
}

/** One-tap log-in for the remembered account. Forgets it if the saved login has expired. */
export async function signInRemembered(acc: RememberedAccount) {
  const { error } = await supabase.auth.refreshSession({ refresh_token: acc.refreshToken });
  if (error) {
    await forgetRememberedAccount();
    throw error;
  }
}

export async function signOut() {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    const u = session?.user;
    if (session && u) {
      const { data: p } = await supabase.from('profiles').select('display_name,avatar_url').eq('id', u.id).maybeSingle();
      const name =
        String(p?.display_name ?? u.user_metadata?.full_name ?? u.user_metadata?.name ?? '').trim() ||
        (u.email ? u.email.split('@')[0] : '');
      const acc: RememberedAccount = {
        name,
        avatar: p?.avatar_url ?? null,
        email: u.email ?? '',
        refreshToken: session.refresh_token,
      };
      await store.set(REMEMBERED_KEY, JSON.stringify(acc));
    }
  } catch {}
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) console.warn('Sign out:', error.message);
}
