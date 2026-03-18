import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoadingScreen from '@/components/LoadingScreen';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';

function getSafeNext(next: string | null) {
  if (!next || !next.startsWith('/')) {
    return '/';
  }
  return next;
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!supabase) {
        navigate('/login', { replace: true });
        return;
      }

      const code = searchParams.get('code');
      const next = getSafeNext(searchParams.get('next'));

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        if (!cancelled) {
          navigate(next, { replace: true });
        }
      } catch (callbackError) {
        if (!cancelled) {
          const message =
            callbackError instanceof Error
              ? callbackError.message
              : "Impossible de finaliser l'authentification.";
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
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-6 flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Connexion impossible</h1>
        <p className="text-sm text-stone-600">{error}</p>
        <Button onClick={() => navigate('/login', { replace: true })}>Retour à la connexion</Button>
      </GlassCard>
    </div>
  );
}
