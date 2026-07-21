import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type AppRole, type Profile } from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string, requestedRole: AppRole) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string): Promise<Profile | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (error) {
      console.error('Błąd ładowania profilu:', error.message);
      return null;
    }
    return data as Profile | null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      const p = await loadProfile(session.user.id);
      setProfile(p);
    } else {
      setProfile(null);
    }
  }, [session, loadProfile]);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id)
          .then((p) => mounted && setProfile(p))
          .finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // onAuthStateChange — wrap async work in IIFE to avoid deadlock
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        if (newSession?.user) {
          const p = await loadProfile(newSession.user.id);
          if (mounted) setProfile(p);
        } else {
          if (mounted) setProfile(null);
        }
        if (mounted) setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string, requestedRole: AppRole) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName, requested_role: requestedRole } },
      });
      if (error) return { error: error.message };
      // If session is returned immediately (email confirm off), load profile
      if (data.user) {
        const p = await loadProfile(data.user.id);
        setProfile(p);
      }
      return { error: null };
    },
    [loadProfile]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const role: AppRole | null = profile?.role_key ?? null;

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, role, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Role permission helpers
export function can(role: AppRole | null, action: 'read' | 'write' | 'delete', resource: string): boolean {
  if (!role) return false;
  if (role === 'admin') return true;
  const matrix: Record<AppRole, Record<string, { read?: boolean; write?: boolean; delete?: boolean }>> = {
    admin: {}, // handled above
    hr: {
      company: { read: true },
      employees: { read: true, write: true },
      positions: { read: true, write: true },
      departments: { read: true, write: true },
      documents: { read: true, write: true },
      processes: { read: true, write: true, delete: true },
      reports: { read: true, write: true },
      performance: { read: true, write: true, delete: true },
      admin: {},
    },
    employee: {
      company: { read: true },
      employees: { read: true },
      positions: { read: true },
      departments: { read: true },
      documents: { read: true },
      processes: { read: true },
      reports: { read: true },
      performance: { read: true },
      admin: {},
    },
  };
  const perms = matrix[role][resource];
  if (!perms) return false;
  return !!perms[action];
}
