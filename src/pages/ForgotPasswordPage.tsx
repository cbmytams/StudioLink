import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { PageMeta } from '@/components/shared/PageMeta';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { useToast } from '@/components/ui/Toast';

function buildRecoveryRedirect(origin: string) {
  const callbackUrl = new URL('/auth/callback', origin);
  callbackUrl.searchParams.set('next', '/forgot-password?mode=reset');
  return callbackUrl.toString();
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState(session?.user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mode = searchParams.get('mode') === 'reset' ? 'reset' : 'request';
  const hasRecoverySession = Boolean(session);

  const pageCopy = useMemo(() => {
    if (mode === 'reset') {
      return {
        title: 'Définir un nouveau mot de passe',
        description: 'Choisis un nouveau mot de passe pour ton compte StudioLink.',
        heading: 'Nouveau mot de passe',
        body: 'Renseigne un nouveau mot de passe pour sécuriser ton compte.',
      };
    }

    return {
      title: 'Mot de passe oublié',
      description: 'Recevez un lien sécurisé pour réinitialiser votre mot de passe StudioLink.',
      heading: 'Mot de passe oublié',
      body: 'Entre ton email pour recevoir un lien de réinitialisation.',
    };
  }, [mode]);

  const handleRequestReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      if (!email.trim() || !email.includes('@')) {
        throw new Error('Adresse email invalide.');
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: buildRecoveryRedirect(window.location.origin),
      });
      if (resetError) throw resetError;

      const successMessage = `Un lien de réinitialisation a été envoyé à ${email.trim()}.`;
      setMessage(successMessage);
      showToast({
        title: 'Email envoyé',
        description: successMessage,
        variant: 'default',
      });
    } catch (requestError) {
      const nextError = requestError instanceof Error
        ? requestError.message
        : "Impossible d'envoyer l'email de réinitialisation.";
      setError(nextError);
      showToast({
        title: 'Envoi impossible',
        description: nextError,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      if (!hasRecoverySession) {
        throw new Error('La session de réinitialisation a expiré. Demande un nouveau lien.');
      }

      if (password.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères.');
      }

      if (password !== confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas.');
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      showToast({
        title: 'Mot de passe mis à jour',
        description: 'Tu peux maintenant te reconnecter avec ton nouveau mot de passe.',
        variant: 'default',
      });
      navigate('/login', { replace: true });
    } catch (resetError) {
      const nextError = resetError instanceof Error
        ? resetError.message
        : 'Impossible de mettre à jour le mot de passe.';
      setError(nextError);
      showToast({
        title: 'Réinitialisation impossible',
        description: nextError,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen items-center justify-center p-4">
      <PageMeta
        title={pageCopy.title}
        description={pageCopy.description}
        canonicalPath={mode === 'reset' ? '/forgot-password?mode=reset' : '/forgot-password'}
      />

      <GlassCard className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-white">{pageCopy.heading}</h1>
          <p className="mt-2 text-sm text-white/65">{pageCopy.body}</p>
        </div>

        {mode === 'request' ? (
          <form onSubmit={handleRequestReset} className="space-y-5">
            <TextInput
              id="forgot-password-email"
              type="email"
              label="Adresse email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vous@exemple.com"
            />

            {message ? (
              <div className="rounded-2xl border border-green-400/30 bg-green-500/10 px-4 py-3 text-sm text-green-100">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={submitting} className="w-full bg-orange-500 text-white hover:bg-orange-600">
              {submitting ? 'Envoi…' : 'Envoyer le lien'}
            </Button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full text-center text-sm text-white/55 transition hover:text-white"
            >
              Retour à la connexion
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <TextInput
              id="reset-password-new"
              type="password"
              label="Nouveau mot de passe"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 caractères"
            />

            <TextInput
              id="reset-password-confirm"
              type="password"
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Retape ton mot de passe"
            />

            {error ? (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            {!hasRecoverySession ? (
              <div className="rounded-2xl border border-orange-400/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">
                Le lien de réinitialisation a expiré. Demande un nouveau lien.
              </div>
            ) : null}

            <Button type="submit" disabled={submitting || !hasRecoverySession} className="w-full bg-orange-500 text-white hover:bg-orange-600">
              {submitting ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
            </Button>

            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="w-full text-center text-sm text-white/55 transition hover:text-white"
            >
              Demander un nouveau lien
            </button>
          </form>
        )}
      </GlassCard>
    </div>
  );
}
