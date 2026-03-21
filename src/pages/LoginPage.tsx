import { type FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { GlassCard } from '@/components/ui/GlassCard';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';

type AuthMode = 'signin' | 'signup';
type InvitationState = 'idle' | 'checking' | 'valid' | 'invalid' | 'missing';

type InvitationLookup = {
  code: string;
  invitation_type: 'studio' | 'pro';
  email: string | null;
  used: boolean;
  expires_at: string | null;
};

type ClaimResult = {
  claimed?: boolean;
} | boolean | null;

function extractClaimSuccess(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (!value || typeof value !== 'object') return false;
  if ('claimed' in value && typeof (value as { claimed?: unknown }).claimed === 'boolean') {
    return (value as { claimed: boolean }).claimed;
  }
  return false;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, loading: authLoading, signInPassword } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [invitationState, setInvitationState] = useState<InvitationState>('idle');
  const [invitationContext, setInvitationContext] = useState<{
    code: string;
    type: 'studio' | 'pro';
    email: string | null;
  } | null>(null);

  useEffect(() => {
    const storedCode = sessionStorage.getItem('invitationCode');
    const storedType = sessionStorage.getItem('invitationType');
    const storedEmail = sessionStorage.getItem('invitationEmail');
    const params = new URLSearchParams(location.search);
    const explicitMode = params.get('mode');

    if (
      storedCode
      && (storedType === 'studio' || storedType === 'pro')
    ) {
      setInvitationContext({
        code: storedCode.trim().toUpperCase(),
        type: storedType,
        email: storedEmail ?? null,
      });
    } else {
      setInvitationContext(null);
    }

    if (explicitMode === 'signup' || storedType === 'studio' || storedType === 'pro') {
      setMode('signup');
    } else {
      setMode('signin');
    }
  }, [location.search]);

  useEffect(() => {
    if (authLoading || !session) return;

    const authProfile = profile as {
      user_type?: 'studio' | 'pro' | null;
      type?: 'studio' | 'pro' | null;
      full_name?: string | null;
      display_name?: string | null;
    } | null;
    const profileType = authProfile?.user_type ?? authProfile?.type ?? null;
    const fullName = authProfile?.full_name?.trim() ?? authProfile?.display_name?.trim() ?? '';

    if (!profile) {
      const invitationCode = sessionStorage.getItem('invitationCode');
      const invitationType = sessionStorage.getItem('invitationType');
      if (invitationCode && (invitationType === 'studio' || invitationType === 'pro')) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/invitation', { replace: true });
      }
      return;
    }

    if (!fullName || (profileType !== 'studio' && profileType !== 'pro')) {
      navigate('/onboarding', { replace: true });
      return;
    }

    if (profileType === 'studio') {
      navigate('/studio/dashboard', { replace: true });
      return;
    }
    navigate('/pro/dashboard', { replace: true });
  }, [authLoading, navigate, profile, session]);

  useEffect(() => {
    if (mode !== 'signup') {
      setInvitationState('idle');
      return;
    }

    if (!invitationContext) {
      setInvitationState('missing');
      return;
    }

    let active = true;
    setInvitationState('checking');

    const validateInvitation = async () => {
      const { data, error: rpcError } = await supabase.rpc('get_invitation_by_code', {
        p_code: invitationContext.code,
      });

      if (!active) return;

      if (rpcError) {
        setInvitationState('invalid');
        return;
      }

      const invitation = (Array.isArray(data) ? data[0] : data) as InvitationLookup | null;
      if (!invitation) {
        setInvitationState('invalid');
        return;
      }

      const isExpired = invitation.expires_at
        ? new Date(invitation.expires_at) < new Date()
        : false;
      if (invitation.used || isExpired || invitation.invitation_type !== invitationContext.type) {
        setInvitationState('invalid');
        return;
      }

      if (!email && invitation.email) {
        setEmail(invitation.email);
      }
      setInvitationState('valid');
    };

    void validateInvitation();

    return () => {
      active = false;
    };
  }, [invitationContext, mode]);

  const isSignIn = mode === 'signin';

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError('Adresse email requise');
      return false;
    }

    if (!email.includes('@')) {
      setError('Email invalide');
      return false;
    }

    if (password.length < 6) {
      setError('Mot de passe trop court (6 caractères min)');
      return false;
    }

    if (mode === 'signup' && confirmPassword !== password) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }

    if (mode === 'signup' && invitationState !== 'valid') {
      setError('Invitation invalide. Reviens à la page invitation.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isSignIn) {
        await signInPassword(email.trim(), password);
        showToast({ title: 'Connexion réussie', variant: 'default' });
        return;
      }

      if (!invitationContext) {
        setError("Invitation requise. Reviens à la page d'invitation.");
        showToast({
          title: 'Invitation requise',
          description: "Reviens à la page d'invitation.",
          variant: 'destructive',
        });
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
        showToast({
          title: 'Création impossible',
          description: signUpError.message,
          variant: 'destructive',
        });
        return;
      }

      if (!data.user?.id) {
        setError('Création impossible: utilisateur introuvable.');
        showToast({
          title: 'Création impossible',
          description: 'Utilisateur introuvable après inscription.',
          variant: 'destructive',
        });
        return;
      }

      const { data: claimData, error: claimError } = await supabase.rpc('claim_invitation', {
        p_code: invitationContext.code,
        p_user_id: data.user.id,
      });
      const claimPayload = (Array.isArray(claimData) ? claimData[0] : claimData) as ClaimResult;
      const claimSuccess = extractClaimSuccess(claimPayload);

      if (claimError || !claimSuccess) {
        const message = claimError?.message ?? "Impossible de valider l'invitation.";
        setError(message);
        showToast({
          title: 'Invitation invalide',
          description: message,
          variant: 'destructive',
        });
        return;
      }

      setSuccessMessage('Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse.');
      showToast({ title: 'Compte créé', description: 'Vérifie ta boîte mail.', variant: 'default' });
      setPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Une erreur est survenue.';
      setError(message);
      showToast({
        title: isSignIn ? 'Connexion impossible' : 'Création impossible',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    setError(null);
    setSuccessMessage(null);
    setConfirmPassword('');
  };

  const signupBlocked = mode === 'signup' && (invitationState === 'missing' || invitationState === 'invalid');

  return (
    <div className="app-shell flex min-h-screen items-center justify-center p-4">
      <Helmet>
        <title>{isSignIn ? 'Connexion — StudioLink' : 'Inscription — StudioLink'}</title>
        <meta
          name="description"
          content={isSignIn ? 'Connectez-vous à votre compte StudioLink.' : 'Créez votre compte StudioLink avec invitation.'}
        />
      </Helmet>
      <GlassCard className="w-full max-w-md p-8">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30">
            <span className="text-3xl font-extrabold text-white tracking-tighter">SL</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">{isSignIn ? 'Connexion' : 'Créer un compte'}</h1>
          <p className="text-sm text-white/70">
            {isSignIn ? 'Bienvenue de retour' : 'Invitation acceptée · Finalise ton inscription'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="login-email" className="block text-sm font-medium text-white/80">
              Adresse email
            </label>
            <TextInput
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Adresse email"
              className=""
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="block text-sm font-medium text-white/80">
              Mot de passe
            </label>
            <TextInput
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Mot de passe"
              className=""
            />
          </div>

          {mode === 'signup' && (
            <TextInput
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Confirmer le mot de passe"
              className=""
            />
          )}

          {mode === 'signup' && invitationState === 'checking' ? (
            <p className="text-xs text-white/50 text-center">Validation de l&apos;invitation...</p>
          ) : null}
          {mode === 'signup' && signupBlocked ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-600">
              Invitation invalide ou absente.
              <button
                type="button"
                onClick={() => navigate('/invitation')}
                className="ml-1 text-red-600 underline"
              >
                Revenir à la page invitation
              </button>
            </div>
          ) : null}

          {error ? <p className="text-red-400 text-sm text-center mt-2">{error}</p> : null}
          {successMessage ? (
            <p className="text-green-400 text-sm text-center mt-2">{successMessage}</p>
          ) : null}

          <Button
            type="submit"
            disabled={loading || invitationState === 'checking' || signupBlocked}
            className="w-full bg-orange-500 text-white hover:bg-orange-600"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white inline-block mr-2" />
                {isSignIn ? 'Connexion...' : 'Création...'}
              </>
            ) : isSignIn ? (
              'Se connecter →'
            ) : (
              'Créer mon compte →'
            )}
          </Button>
        </form>

        <button
          type="button"
          onClick={toggleMode}
          className="mt-4 w-full text-center text-sm text-white/60 underline transition-colors hover:text-white"
        >
          {isSignIn ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </button>
      </GlassCard>
    </div>
  );
}
