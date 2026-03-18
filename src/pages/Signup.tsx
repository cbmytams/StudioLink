import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Text } from '@/components/ui/Typography';
import { validateInvitationCode } from '@/services/invitationService';
import { completeMagicSignup, sendMagicSignupLink, signUpWithPassword } from '@/services/authService';
import { useAuth } from '@/auth/AuthProvider';
import type { UserType } from '@/types/backend';

const MAGIC_SIGNUP_META_KEY = 'studiolink_pending_magic_signup';

type AuthMethod = 'password' | 'magic';

interface PendingMagicMeta {
  code: string;
  userType: UserType;
  displayName: string;
}

function readMagicMeta(): PendingMagicMeta | null {
  try {
    const raw = localStorage.getItem(MAGIC_SIGNUP_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingMagicMeta;
  } catch {
    return null;
  }
}

function clearMagicMeta() {
  localStorage.removeItem(MAGIC_SIGNUP_META_KEY);
}

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, profile, refreshProfile } = useAuth();

  const invitationCode = (searchParams.get('code') ?? '').trim().toUpperCase();
  const methodFromQuery = searchParams.get('mode') === 'magic' ? 'magic' : 'password';

  const [method, setMethod] = useState<AuthMethod>(methodFromQuery);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checkingCode, setCheckingCode] = useState(true);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeType, setCodeType] = useState<UserType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completingMagic, setCompletingMagic] = useState(false);

  const onboardingRoute = useMemo(
    () => (codeType === 'studio' ? '/onboarding/studio' : '/onboarding/pro'),
    [codeType],
  );

  useEffect(() => {
    setMethod(methodFromQuery);
  }, [methodFromQuery]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!invitationCode) {
        if (cancelled) return;
        setCodeError('Code manquant. Reviens sur la page invitation.');
        setCheckingCode(false);
        return;
      }
      setCheckingCode(true);
      const result = await validateInvitationCode(invitationCode);
      if (cancelled) return;
      if (result.is_valid && result.code_type) {
        setCodeType(result.code_type);
        setCodeError(null);
      } else {
        setCodeType(null);
        setCodeError(result.message || 'Code invalide ou expiré.');
      }
      setCheckingCode(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [invitationCode]);

  useEffect(() => {
    if (!session || profile || !codeType || !invitationCode || methodFromQuery !== 'magic' || completingMagic) {
      return;
    }

    const pending = readMagicMeta();
    if (!pending || pending.code !== invitationCode || pending.userType !== codeType) {
      return;
    }

    const finalize = async () => {
      setCompletingMagic(true);
      setError(null);
      try {
        await completeMagicSignup({
          invitationCode,
          userType: codeType,
          displayName: pending.displayName || undefined,
        });
        await refreshProfile();
        clearMagicMeta();
        navigate(onboardingRoute, { replace: true });
      } catch (signupError) {
        const message =
          signupError instanceof Error ? signupError.message : 'Impossible de finaliser le compte.';
        setError(message);
      } finally {
        setCompletingMagic(false);
      }
    };

    void finalize();
  }, [
    codeType,
    completingMagic,
    invitationCode,
    methodFromQuery,
    navigate,
    onboardingRoute,
    profile,
    refreshProfile,
    session,
  ]);

  const handlePasswordSignup = async (event: FormEvent) => {
    event.preventDefault();
    if (!codeType) return;
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      await signUpWithPassword({
        email: email.trim(),
        password,
        invitationCode,
        userType: codeType,
        displayName: displayName.trim() || undefined,
      });
      await refreshProfile();
      navigate(onboardingRoute, { replace: true });
    } catch (signupError) {
      const message =
        signupError instanceof Error ? signupError.message : 'Impossible de créer le compte.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMagicSignup = async (event: FormEvent) => {
    event.preventDefault();
    if (!codeType) return;
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      localStorage.setItem(
        MAGIC_SIGNUP_META_KEY,
        JSON.stringify({
          code: invitationCode,
          userType: codeType,
          displayName: displayName.trim(),
        } satisfies PendingMagicMeta),
      );
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set(
        'next',
        `/signup?code=${encodeURIComponent(invitationCode)}&mode=magic`,
      );
      const redirectTo = callbackUrl.toString();
      await sendMagicSignupLink(email.trim(), redirectTo);
      setInfo('Magic link envoyé. Ouvre ton email pour terminer la création du compte.');
    } catch (signupError) {
      const message =
        signupError instanceof Error ? signupError.message : "Impossible d'envoyer le magic link.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-200 border-t-orange-500" />
      </div>
    );
  }

  if (codeError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="w-full max-w-md p-6 flex flex-col gap-4 text-center">
          <h1 className="text-xl font-semibold">Code invalide</h1>
          <Text variant="secondary" className="text-sm">
            {codeError}
          </Text>
          <Button onClick={() => navigate('/invitation')}>Retour à l&apos;invitation</Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-white to-orange-200 rounded-full blur-2xl opacity-60 mix-blend-multiply" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-tl from-blue-200 to-white rounded-full blur-3xl opacity-50 mix-blend-multiply" />

      <div className="w-full max-w-md relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-8 flex flex-col gap-6">
            <div className="text-center flex flex-col gap-2">
              <h1 className="text-2xl font-semibold">Créer ton compte</h1>
              <Text variant="secondary" className="text-sm">
                Code validé pour le profil {codeType === 'studio' ? 'Studio' : 'Pro'}.
              </Text>
            </div>

            <div className="flex gap-2 rounded-full bg-white/40 border border-white/50 p-1">
              <button
                type="button"
                onClick={() => setMethod('password')}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  method === 'password' ? 'bg-white text-black shadow-sm' : 'text-black/60 hover:text-black'
                }`}
              >
                Email + mot de passe
              </button>
              <button
                type="button"
                onClick={() => setMethod('magic')}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  method === 'magic' ? 'bg-white text-black shadow-sm' : 'text-black/60 hover:text-black'
                }`}
              >
                Magic link
              </button>
            </div>

            <form
              onSubmit={method === 'password' ? handlePasswordSignup : handleMagicSignup}
              className="flex flex-col gap-4"
            >
              <TextInput
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Nom affiché (optionnel)"
                icon={<User size={16} />}
              />
              <TextInput
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                icon={<Mail size={16} />}
                required
              />
              {method === 'password' && (
                <TextInput
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mot de passe"
                  icon={<Lock size={16} />}
                  required
                />
              )}

              {error && <p className="text-xs text-red-500">{error}</p>}
              {info && <p className="text-xs text-emerald-600">{info}</p>}

              <Button type="submit" className="w-full" disabled={submitting || completingMagic}>
                {submitting
                  ? 'En cours...'
                  : method === 'password'
                    ? 'Créer mon compte'
                    : 'Envoyer le magic link'}
              </Button>
            </form>

            {completingMagic && (
              <div className="flex items-center justify-center gap-2 text-sm text-black/60">
                <Sparkles size={14} className="text-orange-500" />
                Finalisation du compte...
              </div>
            )}

            <Text variant="secondary" className="text-xs text-center">
              Déjà inscrit ? <Link to="/login" className="text-black/70 hover:text-black">Se connecter</Link>
            </Text>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
