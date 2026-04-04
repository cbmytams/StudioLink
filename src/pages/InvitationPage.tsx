import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { GlassCard } from '@/components/ui/GlassCard';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/supabase/auth';
import {
  getDashboardPath,
  isProfileIncomplete,
  resolveProfileType,
} from '@/lib/auth/profileCompleteness';
import { toUserFacingErrorMessage } from '@/lib/errors/userFacing';
import { getInvitationByCode } from '@/services/invitationService';

export default function InvitationPage() {
  const navigate = useNavigate();
  const { session, profile, loading: authLoading } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeError = !code.trim()
    ? "Entre un code d'invitation"
    : code.trim().length < 6
      ? 'Code trop court'
      : undefined;

  useEffect(() => {
    if (authLoading || !session) return;
    if (!profile) {
      navigate('/onboarding', { replace: true });
      return;
    }

    const invitationProfile = profile as {
      user_type?: 'studio' | 'pro' | null;
      type?: 'studio' | 'pro' | null;
      full_name?: string | null;
      display_name?: string | null;
      bio?: string | null;
    } | null;
    const profileType = resolveProfileType(invitationProfile);

    if (isProfileIncomplete(invitationProfile)) {
      navigate('/onboarding', { replace: true });
      return;
    }

    navigate(getDashboardPath(profileType), { replace: true });
  }, [authLoading, navigate, profile, session]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const normalizedCode = code.trim().toUpperCase();
    if (codeError) {
      setError(codeError);
      return;
    }

    setLoading(true);
    try {
      const invitation = await getInvitationByCode(normalizedCode);
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

      navigate('/login?mode=signup', {
        replace: true,
        state: {
          mode: 'signup',
          type: invitation.invitation_type,
          code: invitation.code,
          email: invitation.email,
        },
      });
    } catch (submitError) {
      setError(toUserFacingErrorMessage(submitError, 'Code invalide ou introuvable'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell flex min-h-[var(--size-full-dvh)] items-center justify-center p-4">
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
            id="invitation-code"
            label="Code d’invitation"
            required
            error={error ?? codeError}
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

          <Button
            type="submit"
            disabled={loading || Boolean(codeError)}
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
