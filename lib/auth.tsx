import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { DEMO_USER, SKIP_LOGIN } from './devMode';
import { supabase } from './supabase';

type AuthCtx = {
  session: Session | null;
  /** Current user. While logging out it keeps the previous user for a moment so screens that are still
   *  on screen don't crash before the router has moved to the log-in page. Use `signedIn` for gating. */
  user: User | null;
  signedIn: boolean;
  loading: boolean;
};

const Ctx = createContext<AuthCtx>({ session: null, user: null, signedIn: false, loading: true });

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

  const current = session?.user ?? (SKIP_LOGIN ? DEMO_USER : null);
  const lastUser = useRef<User | null>(null);
  if (current) lastUser.current = current;
  const user = current ?? lastUser.current;
  return <Ctx.Provider value={{ session, user, signedIn: current != null, loading }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
