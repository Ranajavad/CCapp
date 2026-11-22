import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
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
  const redirectTo = Linking.createURL('auth-callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
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

export async function sendPhoneCode(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
}

export async function verifyPhoneCode(phone: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  if (error) throw error;
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

export async function signOut() {
  await supabase.auth.signOut();
}
