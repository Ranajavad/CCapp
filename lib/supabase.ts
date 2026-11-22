import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
    global: {
      // Logging out only clears this device. We skip the server's /logout call because it would revoke
      // the refresh token, and the log-in page needs that token for the one-tap "Continue as …" button.
      fetch: (input, init) => {
        const target = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        if (target.includes('/auth/v1/logout')) return Promise.resolve(new Response(null, { status: 204 }));
        return fetch(input, init);
      },
    },
  },
);

// Only refresh tokens while the app is in the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
