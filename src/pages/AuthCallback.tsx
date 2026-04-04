import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import LoadingScreen from '@/components/LoadingScreen';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  getDashboardPath,
  isProfileIncomplete,
  resolveProfileType,
} from '@/lib/auth/profileCompleteness';
import { toUserFacingErrorMessage } from '@/lib/errors/userFacing';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!supabase) {
        void navigate('/login', { replace: true });
        return;
      }

      const code = searchParams.get('code');
      const nextPath = searchParams.get('next');
      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!sessionData.session) {
          if (!cancelled) {
            void navigate('/login', { replace: true });
          }
          return;
        }

        if (nextPath && !cancelled) {
          void navigate(nextPath, { replace: true });
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, display_name, type, user_type, bio')
          .eq('id', sessionData.session.user.id)
          .maybeSingle();

        if (!cancelled) {
          const callbackProfile = profile as {
            full_name?: string | null;
            display_name?: string | null;
            type?: 'studio' | 'pro' | null;
            user_type?: 'studio' | 'pro' | null;
            bio?: string | null;
          } | null;
          if (isProfileIncomplete(callbackProfile)) {
            void navigate('/onboarding', { replace: true });
            return;
          }
          void navigate(getDashboardPath(resolveProfileType(callbackProfile)), { replace: true });
        }
      } catch (callbackError) {
        if (!cancelled) {
          const message = toUserFacingErrorMessage(
            callbackError,
            "Impossible de finaliser l'authentification.",
          );
          setError(message);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  if (!error) {
    return (
      <>
        <Helmet>
          <title>Authentification — StudioLink</title>
          <meta name="description" content="Finalisation de votre connexion StudioLink." />
        </Helmet>
        <LoadingScreen />
      </>
    );
  }

  return (
    <div className="flex min-h-[var(--size-full-dvh)] items-center justify-center bg-stone-50 p-4">
      <Helmet>
        <title>Erreur de connexion — StudioLink</title>
        <meta name="description" content="Une erreur est survenue pendant l’authentification StudioLink." />
      </Helmet>
      <GlassCard className="w-full max-w-md p-6 flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Connexion impossible</h1>
        <p className="text-sm text-stone-600">{error}</p>
        <Button onClick={() => navigate('/login', { replace: true })}>Retour à la connexion</Button>
      </GlassCard>
    </div>
  );
}
