import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/backend';
import {
  getCurrentProfile,
  getCurrentSession,
  onAuthStateChange,
  sendMagicLink as sendMagicLinkService,
  signInPassword as signInPasswordService,
  signOut as signOutService,
} from '@/services/authService';
import { hasSupabaseConfig } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInPassword: (email: string, password: string) => Promise<void>;
  sendMagicLink: (email: string, redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_TIMEOUT_MS = 8000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race<T>([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Auth timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const setUserType = useAppStore((state) => state.setUserType);
  const setOnboardingComplete = useOnboardingStore((state) => state.setOnboardingComplete);
  const setCurrentStep = useOnboardingStore((state) => state.setCurrentStep);

  const hydrateProfile = useCallback(async (nextSession: Session | null) => {
    if (!nextSession) {
      setProfile(null);
      return;
    }
    const nextProfile = await getCurrentProfile(nextSession);
    setProfile(nextProfile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session) return;
    await hydrateProfile(session);
  }, [hydrateProfile, session]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      if (!hasSupabaseConfig) {
        if (isMounted) {
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      try {
        const currentSession = await withTimeout(getCurrentSession(), AUTH_TIMEOUT_MS);
        if (!isMounted) return;
        setSession(currentSession);
        await withTimeout(hydrateProfile(currentSession), AUTH_TIMEOUT_MS);
      } catch {
        if (!isMounted) return;
        setSession(null);
        setProfile(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    if (!hasSupabaseConfig) {
      return () => {
        isMounted = false;
      };
    }

    const { data } = onAuthStateChange(async (_event, nextSession) => {
      try {
        setSession(nextSession);
        await withTimeout(hydrateProfile(nextSession), AUTH_TIMEOUT_MS);
      } catch {
        if (!isMounted) return;
        setSession(null);
        setProfile(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [hydrateProfile]);

  useEffect(() => {
    if (!profile) return;
    const profileType = (
      profile as {
        user_type?: 'studio' | 'pro' | null
        type?: 'studio' | 'pro' | null
      }
    ).user_type ?? (
      profile as {
        user_type?: 'studio' | 'pro' | null
        type?: 'studio' | 'pro' | null
      }
    ).type ?? null;
    setUserType(profileType);
    setOnboardingComplete(profile.onboarding_complete);
    setCurrentStep(profile.onboarding_step || 1);
  }, [profile, setCurrentStep, setOnboardingComplete, setUserType]);

  const signInPassword = useCallback(async (email: string, password: string) => {
    await signInPasswordService(email, password);
  }, []);

  const sendMagicLink = useCallback(async (email: string, redirectTo?: string) => {
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    callbackUrl.searchParams.set('next', '/');
    const fallbackRedirect = callbackUrl.toString();
    await sendMagicLinkService(email, redirectTo ?? fallbackRedirect);
  }, []);

  const signOut = useCallback(async () => {
    await signOutService();
    setProfile(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      signInPassword,
      sendMagicLink,
      signOut,
      refreshProfile,
    }),
    [loading, profile, refreshProfile, sendMagicLink, session, signInPassword, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
