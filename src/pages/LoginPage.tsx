import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';

type AuthMode = 'signin' | 'signup';

export default function LoginPage() {
  const navigate = useNavigate();
  const { session, profile, loading: authLoading, signInPassword } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const invitationType = sessionStorage.getItem('invitationType');
    setMode(invitationType ? 'signup' : 'signin');
  }, []);

  useEffect(() => {
    if (authLoading || !session) return;
    if (profile?.user_type === 'studio') {
      navigate('/studio/dashboard', { replace: true });
      return;
    }
    navigate('/pro/feed', { replace: true });
  }, [authLoading, navigate, profile?.user_type, session]);

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

    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInPassword(email.trim(), password);
        showToast({ title: 'Connexion réussie', variant: 'default' });
        return;
      }

      const invitationCode = sessionStorage.getItem('invitationCode');
      const invitationType = sessionStorage.getItem('invitationType');
      if (!invitationCode || !invitationType) {
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

      if (data.user?.id) {
        const { error: invitationError } = await supabase
          .from('invitations')
          .update({ used_by: data.user.id })
          .eq('code', invitationCode);

        if (invitationError) {
          setError(invitationError.message);
          showToast({
            title: 'Création impossible',
            description: invitationError.message,
            variant: 'destructive',
          });
          return;
        }
      }

      sessionStorage.removeItem('invitationCode');
      sessionStorage.removeItem('invitationType');
      sessionStorage.removeItem('invitationEmail');
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

  const isSignIn = mode === 'signin';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0D0D0F] p-4">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-400/30 blur-3xl" />

      <GlassCard className="relative z-10 w-full max-w-md p-8">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold text-white">{isSignIn ? 'Connexion' : 'Créer un compte'}</h1>
          <p className="text-sm text-white/70">
            {isSignIn ? 'Bienvenue de retour' : 'Invitation acceptée · Finalise ton inscription'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="login-email" className="block text-sm font-medium text-white/85">
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
            className="text-white placeholder:text-white/45"
          />
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="block text-sm font-medium text-white/85">
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
            className="text-white placeholder:text-white/45"
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
              className="text-white placeholder:text-white/45"
            />
          )}

          {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
          {successMessage && (
            <p className="text-green-400 text-sm text-center mt-2">{successMessage}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:opacity-95"
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
          className="mt-4 w-full text-center text-sm text-white/75 transition-colors hover:text-white"
        >
          {isSignIn ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </button>
      </GlassCard>
    </div>
  );
}
