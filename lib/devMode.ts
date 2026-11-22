import type { User } from '@supabase/supabase-js';

/**
 * Development-only shortcut: set EXPO_PUBLIC_SKIP_LOGIN=true in .env to open the app
 * without signing in. It never applies to production builds (__DEV__ is false there).
 * Screens that read from Supabase will show their error state unless a real backend is configured.
 */
export const SKIP_LOGIN = __DEV__ && process.env.EXPO_PUBLIC_SKIP_LOGIN === 'true';

export const DEMO_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'demo@local',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date(0).toISOString(),
} as User;
