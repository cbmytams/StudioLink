import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { bypassCaptcha, mockSupabase } from '@/config/runtimeFlags';
import { GlassCard } from '@/components/ui/GlassCard';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/SEO';
import { useAuth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import {
  buildSignupEmailRedirect,
  getAuthMode,
  getInvitationContext,
} from '@/lib/auth/invitationFlow';
import { useToast } from '@/components/ui/Toast';
import {
  getDashboardPath,
  isProfileIncomplete,
  resolveProfileType,
} from '@/lib/auth/profileCompleteness';
import { toUserFacingErrorMessage } from '@/lib/errors/userFacing';
import { trackUserLoggedIn, trackUserRegistered } from '@/lib/analytics/events';
import { identifyUser } from '@/lib/analytics/posthog';
import { emailService } from '@/lib/email/emailService';
import { getCurrentProfile, signUpWithPassword } from '@/services/authService';
import { getInvitationByCode } from '@/services/invitationService';

type AuthMode = 'signin' | 'signup';
type InvitationState = 'idle' | 'checking' | 'valid' | 'invalid' | 'missing';

type AuthRouteState = {
  mode?: AuthMode;
  type?: 'studio' | 'pro';
  code?: string;
  email?: string | null;
  reason?: 'session_expired';
} | null;

type RedirectProfile = {
  user_type?: 'studio' | 'pro' | null;
  type?: 'studio' | 'pro' | null;
  full_name?: string | null;
  display_name?: string | null;
  bio?: string | null;
} | null;

type FieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

function getEmailError(value: string): string | undefined {
  if (!value.trim()) return 'Adresse email requise';
  if (!value.includes('@')) return 'Email invalide';
  return undefined;
}

function getPasswordError(value: string): string | undefined {
  if (value.length < 6) return 'Mot de passe trop court (6 caractères min)';
  return undefined;
}

function getConfirmPasswordError(password: string, confirmPassword: string): string | undefined {
  if (confirmPassword !== password) return 'Les mots de passe ne correspondent pas';
  return undefined;
}

function parseInvitationType(value: string | null): 'studio' | 'pro' | null {
  if (value === 'studio' || value === 'pro') return value;
  return null;
}

function getPasswordStrength(value: string): {
  label: string;
  className: string;
} {
  if (!value) return { label: 'Entrez un mot de passe sécurisé', className: 'text-white/50' };
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 1) return { label: 'Sécurité faible', className: 'text-red-300' };
  if (score <= 2) return { label: 'Sécurité moyenne', className: 'text-amber-200' };
  if (score <= 3) return { label: 'Sécurité correcte', className: 'text-emerald-200' };
  return { label: 'Sécurité forte', className: 'text-emerald-100' };
}

function firstNameFromEmail(value: string) {
  const localPart = value.split('@')[0] ?? '';
  const cleaned = localPart.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return 'there';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, loading: authLoading, signInPassword } = useAuth();
  const { showToast } = useToast();
  const routeState = location.state as AuthRouteState;

  const [mode, setMode] = useState<AuthMode>('signin');
  const [step, setStep] = useState<'form' | 'confirm-email'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationState, setInvitationState] = useState<InvitationState>('idle');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [invitationContext, setInvitationContext] = useState<{
    code: string;
    type: 'studio' | 'pro';
    email: string | null;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const explicitMode = params.get('mode');
    const queryCode = params.get('code');
    const queryType = parseInvitationType(params.get('type'));
    const queryEmail = params.get('email');
    const isRegisterPath = location.pathname === '/register';
    const nextInvitationContext = getInvitationContext({
      routeCode: routeState?.code ?? queryCode ?? null,
      routeType: routeState?.type ?? queryType ?? null,
      routeEmail: routeState?.email ?? queryEmail ?? null,
      storageCode: sessionStorage.getItem('invitationCode'),
      storageType: sessionStorage.getItem('invitationType'),
      storageEmail: sessionStorage.getItem('invitationEmail'),
      userMetadata: session?.user?.user_metadata as Record<string, unknown> | null | undefined,
    });

    setInvitationContext(nextInvitationContext);
    if (nextInvitationContext?.email) {
      setEmail((currentEmail) => currentEmail || nextInvitationContext.email || '');
    }

    setMode(isRegisterPath ? 'signup' : getAuthMode(explicitMode, routeState?.mode ?? null));
  }, [location.pathname, location.search, routeState?.code, routeState?.email, routeState?.mode, routeState?.type, session?.user?.id, session?.user?.user_metadata]);

  useEffect(() => {
    if (authLoading || !session) return;

    const authProfile = profile as {
      user_type?: 'studio' | 'pro' | null;
      type?: 'studio' | 'pro' | null;
      full_name?: string | null;
      display_name?: string | null;
      bio?: string | null;
    } | null;
    const profileType = resolveProfileType(authProfile);

    if (!profile) {
      return;
    }

    if (isProfileIncomplete(authProfile)) {
      navigate('/onboarding', { replace: true });
      return;
    }

    navigate(getDashboardPath(profileType), { replace: true });
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
      const invitation = await getInvitationByCode(invitationContext.code);
      if (!active) return;

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
  const bypassedCaptchaEnabled = bypassCaptcha;
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const isLocalRuntime = typeof window !== 'undefined'
    && ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const captchaRequired = !bypassedCaptchaEnabled && Boolean(turnstileSiteKey) && !isLocalRuntime;
  const effectiveCaptchaToken = captchaRequired
    ? (captchaToken || undefined)
    : (bypassedCaptchaEnabled ? 'test-captcha-token' : undefined);

  useEffect(() => {
    if (!bypassedCaptchaEnabled) return;
    setCaptchaToken('test-captcha-token');
  }, [bypassedCaptchaEnabled]);

  if (step === 'confirm-email') {
    return (
      <div className="app-shell flex min-h-[100dvh] items-center justify-center p-4">
        <SEO
          title="Confirmation email"
          description="Confirme ton adresse email pour activer ton compte StudioLink."
          noIndex
          url="/login"
        />
        <GlassCard className="w-full max-w-sm p-8 text-center">
          <p className="mb-4 text-5xl">📬</p>
          <h2 className="mb-2 text-xl font-bold text-white">Vérifie ta boîte mail</h2>
          <p className="mb-6 text-sm text-white/60">
            Un lien de confirmation a été envoyé à{' '}
            <span className="font-medium text-white">{email}</span>.
            Clique dessus pour activer ton compte.
          </p>
          <button
            type="button"
            onClick={() => {
              setStep('form');
              navigate('/login', { replace: true });
            }}
            className="glass-btn-primary w-full"
          >
            Retour à la connexion
          </button>
        </GlassCard>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const nextFieldErrors: FieldErrors = {
      email: getEmailError(email),
      password: getPasswordError(password),
      confirmPassword: mode === 'signup' ? getConfirmPasswordError(password, confirmPassword) : undefined,
    };

    setFieldErrors(nextFieldErrors);

    const firstFieldError = nextFieldErrors.email ?? nextFieldErrors.password ?? nextFieldErrors.confirmPassword ?? null;
    if (firstFieldError) {
      setError(firstFieldError);
      return false;
    }

    if (mode === 'signup' && invitationState !== 'valid') {
      setError('Invitation invalide. Reviens à la page invitation.');
      return false;
    }

    if (captchaRequired && !captchaToken) {
      setError('Validation anti-bot requise.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isSignIn) {
        const signInData = await signInPassword(email.trim(), password, effectiveCaptchaToken);
        const signedInUserId = signInData.user?.id ?? signInData.session?.user?.id;

        if (!signedInUserId) {
          navigate('/onboarding', { replace: true });
          showToast({ title: 'Connexion réussie', variant: 'default' });
          return;
        }

        const redirectProfile = await getCurrentProfile(signInData.session ?? null) as RedirectProfile;
        const profileType = resolveProfileType(redirectProfile);
        const trackedRole = profileType ?? invitationContext?.type ?? null;

        if (trackedRole === 'studio' || trackedRole === 'pro') {
          trackUserLoggedIn(trackedRole);
          identifyUser(signedInUserId, {
            role: trackedRole,
            email: email.trim() || undefined,
            displayName: redirectProfile?.display_name ?? redirectProfile?.full_name ?? undefined,
          });
        }

        showToast({ title: 'Connexion réussie', variant: 'default' });
        if (!redirectProfile || isProfileIncomplete(redirectProfile)) {
          navigate('/onboarding', { replace: true });
          return;
        }

        navigate(getDashboardPath(profileType), { replace: true });
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

      const data = mockSupabase
        ? await signUpWithPassword({
          email: email.trim(),
          password,
          invitationCode: invitationContext.code,
          invitationEmail: invitationContext.email,
          userType: invitationContext.type,
          captchaToken: effectiveCaptchaToken,
          emailRedirectTo: buildSignupEmailRedirect(window.location.origin),
        })
        : await (async () => {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              captchaToken: effectiveCaptchaToken,
              emailRedirectTo: buildSignupEmailRedirect(window.location.origin),
              data: {
                invitation_code: invitationContext.code,
                invitation_type: invitationContext.type,
                invitation_email: invitationContext.email,
              },
            },
          });
          if (signUpError) {
            throw signUpError;
          }
          return signUpData;
        })();

      if (!data.user?.id) {
        setError('Création impossible: utilisateur introuvable.');
        showToast({
          title: 'Création impossible',
          description: 'Utilisateur introuvable après inscription.',
          variant: 'destructive',
        });
        return;
      }

      void emailService.sendWelcome({
        email: email.trim(),
        firstName: firstNameFromEmail(email.trim()),
        role: invitationContext.type,
      }).catch(() => undefined);

      if (data.session) {
        if (mockSupabase) {
          await signInPassword(email.trim(), password, effectiveCaptchaToken);
        }
        trackUserRegistered(invitationContext.type);
        showToast({ title: 'Compte créé', description: 'Complète maintenant ton profil.', variant: 'default' });
        navigate('/onboarding', { replace: true });
        return;
      }

      setStep('confirm-email');
      showToast({
        title: 'Confirmation email requise',
        description: 'Confirme ton email puis reconnecte-toi pour continuer.',
        variant: 'default',
      });
      setPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      const message = toUserFacingErrorMessage(submitError, 'Une erreur est survenue.');
      setCaptchaToken(bypassedCaptchaEnabled ? 'test-captcha-token' : '');
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
    setStep('form');
    setError(null);
    setConfirmPassword('');
    setFieldErrors({});

    if (isSignIn) {
      if (invitationContext) {
        navigate('/login?mode=signup', {
          replace: true,
          state: {
            mode: 'signup',
            type: invitationContext.type,
            code: invitationContext.code,
            email: invitationContext.email,
          },
        });
        return;
      }
      navigate('/register', { replace: true });
      return;
    }

    navigate('/login', { replace: true });
  };

  const signupBlocked = mode === 'signup' && (invitationState === 'missing' || invitationState === 'invalid');
  const signupSubtitle = invitationContext
    ? 'Invitation validée · Finalise ton inscription'
    : 'Inscription sur invitation uniquement';
  const sessionExpiredMessage = routeState?.reason === 'session_expired'
    ? 'Votre session a expiré. Reconnectez-vous.'
    : null;
  const submitDisabled = loading
    || invitationState === 'checking'
    || signupBlocked
    || (captchaRequired && !captchaToken)
    || Boolean(getEmailError(email))
    || Boolean(getPasswordError(password))
    || (mode === 'signup' && Boolean(getConfirmPasswordError(password, confirmPassword)));
  const passwordStrength = mode === 'signup' ? getPasswordStrength(password) : null;

  return (
    <div className="app-shell flex min-h-[100dvh] items-center justify-center p-4">
      <SEO
        title={isSignIn ? 'Connexion' : 'Inscription'}
        description={isSignIn ? 'Connectez-vous à votre compte StudioLink.' : 'Créez votre compte StudioLink avec invitation.'}
        noIndex
        url={isSignIn ? '/login' : '/register'}
      />
      <GlassCard className="w-full max-w-md p-8">
        <div className="mb-10 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-orange-500 to-orange-400 shadow-[0_0_40px_rgba(249,115,22,0.3)] border border-white/20">
            <span className="text-2xl font-bold text-white tracking-tighter shadow-sm">SL</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">{isSignIn ? 'Connexion' : 'Créer un compte'}</h1>
          <p className="text-sm text-white/70">
            {isSignIn ? 'Bienvenue de retour' : signupSubtitle}
          </p>
          {bypassedCaptchaEnabled ? (
            <p className="mt-2 inline-flex rounded-full border border-emerald-300/30 bg-emerald-500/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-100">
              Mode test actif
            </p>
          ) : null}
        </div>

        {!isSignIn && !invitationContext ? (
          <div className="mb-5 rounded-2xl border border-orange-400/20 bg-orange-400/10 px-4 py-3 text-sm text-orange-50">
            StudioLink fonctionne sur invitation. Renseigne d&apos;abord ton code ou ouvre ton lien reçu par email.
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-3">
                <p className="text-sm font-semibold text-white">🎬 Compte Studio</p>
                <p className="mt-1 text-xs text-white/60">
                  Publiez des missions, suivez les candidatures et pilotez vos sessions.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-3">
                <p className="text-sm font-semibold text-white">🎤 Compte Pro</p>
                <p className="mt-1 text-xs text-white/60">
                  Candidaturez aux missions, échangez en chat et livrez vos fichiers.
                </p>
              </div>
            </div>
              <button
                type="button"
                onClick={() => navigate('/invitation')}
                className="mt-2 inline-flex min-h-[44px] items-center text-xs font-medium text-orange-200 underline underline-offset-2"
              >
                Entrer mon code d&apos;invitation
              </button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' ? (
            <div className="space-y-1.5">
              <TextInput
                id="invitation-code"
                label="Code d'invitation"
                value={invitationContext?.code ?? ''}
                readOnly
                disabled
                placeholder="Code d'invitation requis"
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <TextInput
              id="login-email"
              type="email"
              autoComplete="email"
              label="Adresse email"
              required
              error={fieldErrors.email}
              value={email}
              onChange={(event) => {
                const nextValue = event.target.value;
                setEmail(nextValue);
                setFieldErrors((current) => ({ ...current, email: getEmailError(nextValue) }));
                if (error) setError(null);
              }}
              placeholder="Adresse email"
            />
          </div>

          <div className="space-y-1.5">
            <TextInput
              id="login-password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              label="Mot de passe"
              required
              error={fieldErrors.password}
              value={password}
              onChange={(event) => {
                const nextValue = event.target.value;
                setPassword(nextValue);
                setFieldErrors((current) => ({
                  ...current,
                  password: getPasswordError(nextValue),
                  confirmPassword: mode === 'signup'
                    ? getConfirmPasswordError(nextValue, confirmPassword)
                    : undefined,
                }));
                if (error) setError(null);
              }}
              placeholder="Mot de passe"
            />
            <p className="px-1 text-xs text-white/45">Minimum 6 caractères.</p>
            {passwordStrength ? (
              <p className={`px-1 text-xs ${passwordStrength.className}`}>
                {passwordStrength.label}
              </p>
            ) : null}
          </div>

          {isSignIn ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="min-h-[44px] px-2 text-xs text-white/55 transition hover:text-white"
              >
                Mot de passe oublié ?
              </button>
            </div>
          ) : null}

          {mode === 'signup' && (
            <div className="space-y-1.5">
              <TextInput
                id="login-confirm-password"
                type="password"
                autoComplete="new-password"
                label="Confirmer le mot de passe"
                required
                error={fieldErrors.confirmPassword}
                value={confirmPassword}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setConfirmPassword(nextValue);
                  setFieldErrors((current) => ({
                    ...current,
                    confirmPassword: getConfirmPasswordError(password, nextValue),
                  }));
                  if (error) setError(null);
                }}
                placeholder="Confirmer le mot de passe"
              />
            </div>
          )}

          {mode === 'signup' && invitationState === 'checking' ? (
            <p className="text-xs text-white/50 text-center">Validation de l&apos;invitation...</p>
          ) : null}
          {mode === 'signup' && invitationState === 'invalid' ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-600">
              Invitation invalide ou absente.
              <button
                type="button"
                onClick={() => navigate('/invitation')}
                className="ml-1 inline-flex min-h-[44px] items-center text-red-600 underline"
              >
                Revenir à la page invitation
              </button>
            </div>
          ) : null}

          {sessionExpiredMessage ? (
            <p className="rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2 text-center text-sm text-amber-800">
              {sessionExpiredMessage}
            </p>
          ) : null}
          {error ? <p className="mt-2 text-center text-sm text-red-400" aria-live="polite">{error}</p> : null}
          {captchaRequired ? (
            <div className="flex justify-center pt-1">
              <Turnstile
                siteKey={turnstileSiteKey}
                onSuccess={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken('')}
                onError={() => setCaptchaToken('')}
                options={{ theme: 'light', size: 'flexible' }}
              />
            </div>
          ) : null}
          <Button
            type="submit"
            disabled={submitDisabled}
            loading={loading}
            loadingLabel={isSignIn ? 'Connexion...' : 'Création...'}
            className="w-full bg-orange-500 text-white hover:bg-orange-600"
          >
            {isSignIn ? (
              'Se connecter →'
            ) : (
              'Créer mon compte →'
            )}
          </Button>
        </form>

        <button
          type="button"
          onClick={toggleMode}
          className="mt-6 flex min-h-[44px] w-full items-center justify-center text-center text-sm font-medium text-white/50 transition-colors hover:text-white"
        >
          {isSignIn ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </button>

        {!isSignIn ? (
          <div className="mt-3 text-center text-xs text-white/55">
            <p>En vous inscrivant, vous acceptez :</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <Link
                to="/legal/terms"
                className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-3 text-xs transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
              >
                Conditions d&apos;utilisation
              </Link>
              <Link
                to="/legal/privacy"
                className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-3 text-xs transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
              >
                Confidentialité
              </Link>
              <Link
                to="/legal/mentions"
                className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-3 text-xs transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
              >
                Mentions légales
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-white/50">
            <Link
              to="/legal/mentions"
              className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-3 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
            >
              Mentions légales
            </Link>
            <Link
              to="/legal/privacy"
              className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-3 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
            >
              Confidentialité
            </Link>
            <Link
              to="/legal/terms"
              className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-3 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
            >
              Conditions d&apos;utilisation
            </Link>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
