import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { useToast } from '@/components/ui/Toast';
import { resolveProfileType } from '@/lib/auth/profileCompleteness';
import { toUserFacingErrorMessage } from '@/lib/errors/userFacing';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { session, signOut, profile } = useAuth();
  const { showToast } = useToast();

  const user = session?.user ?? null;
  const profileType = resolveProfileType(profile as { user_type?: 'studio' | 'pro' | null; type?: 'studio' | 'pro' | null } | null);
  const profileRoute = profileType === 'studio' ? '/studio/profile' : '/pro/profile';
  const [loadingAction, setLoadingAction] = useState<'reset' | 'logout' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setLoadingAction('reset');
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email);
      if (resetError) throw resetError;
      showToast({
        title: 'Email envoyé',
        description: 'Un lien de réinitialisation a été envoyé sur votre adresse email.',
        variant: 'default',
      });
    } catch (resetError) {
      const message = toUserFacingErrorMessage(resetError, 'Impossible d’envoyer l’email.');
      setError(message);
      showToast({
        title: 'Action impossible',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLogout = async () => {
    setLoadingAction('logout');
    setError(null);
    let message: string | null = null;
    try {
      await signOut();
    } catch (logoutError) {
      message = toUserFacingErrorMessage(logoutError, 'Impossible de se déconnecter.');
      setError(message);
    } finally {
      setLoadingAction(null);
      if (message) {
        showToast({
          title: 'Déconnexion impossible',
          description: message,
          variant: 'destructive',
        });
      }
      navigate('/login', { replace: true });
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Supprimer définitivement votre compte ? Cette action est irréversible.')) {
      return;
    }

    setLoadingAction('delete');
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('delete_user');
      if (rpcError) {
        setError('Impossible de supprimer le compte. Contacte le support.');
        showToast({
          title: 'Suppression impossible',
          description: 'Impossible de supprimer le compte. Contacte le support.',
          variant: 'destructive',
        });
        return;
      }

      await supabase.auth.signOut();
      showToast({ title: 'Compte supprimé', variant: 'default' });
      navigate('/login', { replace: true });
    } catch (deleteError) {
      const message = toUserFacingErrorMessage(deleteError, 'Suppression impossible.');
      setError(message);
      showToast({
        title: 'Suppression impossible',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="app-shell">
      <Helmet>
        <title>Paramètres — StudioLink</title>
        <meta name="description" content="Gérez votre compte StudioLink." />
      </Helmet>
      <div className="app-container-compact">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 text-sm app-muted transition-colors hover:text-black"
        >
          ← Retour
        </button>

        <header className="mb-5">
          <h1 className="app-title text-2xl">Paramètres</h1>
          <p className="app-subtitle">Gérez votre compte et votre sécurité</p>
        </header>

        <section className="app-card p-5 mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Compte</h2>
          <p className="text-sm text-gray-700">{user?.email ?? 'Email indisponible'}</p>
          <button
            type="button"
            onClick={() => navigate(profileRoute)}
            className="mt-4 inline-flex items-center rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Modifier mon profil
          </button>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}

        <section className="app-card p-5 mb-4 space-y-3">
          <button
            type="button"
            disabled={loadingAction !== null}
            onClick={() => void handleResetPassword()}
            className="w-full rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700 transition hover:bg-orange-100 disabled:opacity-50"
          >
            {loadingAction === 'reset' ? 'Envoi…' : 'Changer mon mot de passe'}
          </button>

          <button
            id="logout-btn"
            type="button"
            aria-label="Déconnexion"
            disabled={loadingAction !== null}
            onClick={() => void handleLogout()}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
          >
            {loadingAction === 'logout' ? 'Déconnexion…' : 'Déconnexion'}
          </button>
        </section>

        <section className="app-card p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Zone sensible</h2>
          <button
            type="button"
            disabled={loadingAction !== null}
            onClick={() => void handleDeleteAccount()}
            className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
          >
            {loadingAction === 'delete' ? 'Suppression…' : 'Supprimer le compte'}
          </button>
          <p className="mt-2 text-xs text-gray-400">
            Si la suppression automatique n’est pas disponible, un message support s’affichera.
          </p>
        </section>
      </div>
    </div>
  );
}
