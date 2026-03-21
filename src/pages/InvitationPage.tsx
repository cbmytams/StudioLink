import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { GlassCard } from '@/components/ui/GlassCard';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';

type InvitationLookup = {
  code: string;
  invitation_type: 'studio' | 'pro';
  email: string | null;
  used: boolean;
  expires_at: string | null;
};

export default function InvitationPage() {
  const navigate = useNavigate();
  const { session, profile, loading: authLoading } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !session) return;
    if (!profile) {
      navigate('/onboarding', { replace: true });
      return;
    }

    const profileType = (profile as { user_type?: 'studio' | 'pro'; type?: 'studio' | 'pro' } | null)?.user_type
      ?? (profile as { user_type?: 'studio' | 'pro'; type?: 'studio' | 'pro' } | null)?.type
      ?? null;
    const fullName = (
      profile as { full_name?: string | null; display_name?: string | null } | null
    )?.full_name?.trim() ?? (
      profile as { full_name?: string | null; display_name?: string | null } | null
    )?.display_name?.trim() ?? '';

    if (!fullName || (profileType !== 'studio' && profileType !== 'pro')) {
      navigate('/onboarding', { replace: true });
      return;
    }

    navigate(profileType === 'studio' ? '/studio/dashboard' : '/pro/dashboard', { replace: true });
  }, [authLoading, navigate, profile, session]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      setError("Entre un code d'invitation");
      return;
    }
    if (normalizedCode.length < 6) {
      setError('Code trop court');
      return;
    }

    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_invitation_by_code', {
        p_code: normalizedCode,
      });

      if (rpcError) {
        setError('Code invalide ou introuvable');
        return;
      }

      const invitation = (Array.isArray(data) ? data[0] : data) as InvitationLookup | null;
      if (!invitation) {
        setError('Code invalide ou introuvable');
        return;
      }

      if (invitation.used) {
        setError('Ce code a déjà été utilisé');
        return;
      }

      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        setError('Ce code est expiré');
        return;
      }

      sessionStorage.setItem('invitationCode', invitation.code);
      sessionStorage.setItem('invitationType', invitation.invitation_type);
      if (invitation.email) {
        sessionStorage.setItem('invitationEmail', invitation.email);
      }

      navigate('/login?mode=signup', { replace: true });
    } catch {
      setError('Code invalide ou introuvable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen items-center justify-center p-4">
      <Helmet>
        <title>Invitation — StudioLink</title>
        <meta name="description" content="Saisissez votre code d’invitation pour rejoindre StudioLink." />
      </Helmet>
      <GlassCard className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-black">Code d&apos;invitation</h1>
          <p className="mt-2 text-sm text-stone-500">
            Entre ton code pour débloquer la création de compte.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            autoCapitalize="characters"
            maxLength={16}
            value={code}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase());
              if (error) setError(null);
            }}
            placeholder="EX: STUDIO2026"
            className="text-stone-900 placeholder:text-stone-400"
          />

          {error ? <p className="text-red-400 text-sm text-center">{error}</p> : null}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white hover:bg-orange-600"
          >
            {loading ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Vérification...
              </>
            ) : (
              'Continuer →'
            )}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
