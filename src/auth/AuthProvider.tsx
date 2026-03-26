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
  onAuthStateChange,
  sendMagicLink as sendMagicLinkService,
  signInPassword as signInPasswordService,
  signOut as signOutService,
} from '@/services/authService';
import { trackUserLoggedOut } from '@/lib/analytics/events';
import { resetUser } from '@/lib/analytics/posthog';
import { hasSupabaseConfig } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInPassword: (
    email: string,
    password: string,
    captchaToken?: string,
  ) => ReturnType<typeof signInPasswordService>;
  sendMagicLink: (email: string, redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getSupabaseStorageKey(): string | null {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return null;

  try {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
    return `sb-${projectRef}-auth-token`;
  } catch {
    return null;
  }
}

function readStoredSession(): Session | null {
  if (typeof window === 'undefined') return null;

  const storageKey = getSupabaseStorageKey();
  if (!storageKey) return null;

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
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
    let unsubscribe = () => {};

    const bootstrap = async () => {
      const storedSession = readStoredSession();
      if (isMounted) {
        setSession(storedSession);
      }

      try {
        await hydrateProfile(storedSession);
      } catch {
        if (!isMounted) return;
        setProfile(null);
        if (!storedSession) {
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (!hasSupabaseConfig) {
      setSession(null);
      setProfile(null);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    void (async () => {
      await bootstrap();
      if (!isMounted) return;

      const { data } = onAuthStateChange(async (_event, nextSession) => {
        if (isMounted) {
          setLoading(true);
        }
        try {
          setSession(nextSession);
          await hydrateProfile(nextSession);
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

      unsubscribe = () => {
        data.subscription.unsubscribe();
      };
    })();

    return () => {
      isMounted = false;
      unsubscribe();
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
    if (profileType) {
      setUserType(profileType);
    }
    setOnboardingComplete(profile.onboarding_complete);
    setCurrentStep(profile.onboarding_step || 1);
  }, [profile, setCurrentStep, setOnboardingComplete, setUserType]);

  const signInPassword = useCallback(async (email: string, password: string, captchaToken?: string) => {
    setLoading(true);
    try {
      const result = await signInPasswordService(email, password, captchaToken);
      const nextSession = result.session ?? null;

      if (nextSession) {
        setSession(nextSession);
        await hydrateProfile(nextSession);
      }

      return result;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [hydrateProfile]);

  const sendMagicLink = useCallback(async (email: string, redirectTo?: string) => {
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    callbackUrl.searchParams.set('next', '/');
    const fallbackRedirect = callbackUrl.toString();
    await sendMagicLinkService(email, redirectTo ?? fallbackRedirect);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutService();
      resetUser();
      trackUserLoggedOut();
    } finally {
      setProfile(null);
      setSession(null);
    }
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
