import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEMO_USER, SKIP_LOGIN } from './devMode';
import { supabase } from './supabase';

type AuthCtx = { session: Session | null; user: User | null; loading: boolean };

const Ctx = createContext<AuthCtx>({ session: null, user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => {})
      .finally(() => setLoading(false));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const user = session?.user ?? (SKIP_LOGIN ? DEMO_USER : null);
  return <Ctx.Provider value={{ session, user, loading }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
