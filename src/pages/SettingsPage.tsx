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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

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
    if (!user?.email) {
      setError('Email utilisateur introuvable.');
      return;
    }
    if (!deletePassword.trim()) {
      setError('Veuillez saisir votre mot de passe pour confirmer.');
      return;
    }

    setLoadingAction('delete');
    setError(null);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword,
      });
      if (verifyError) {
        throw new Error('Mot de passe incorrect.');
      }

      const { data, error: functionError } = await supabase.functions.invoke('delete-account', {
        body: {},
      });
      if (functionError) throw functionError;

      if (
        data
        && typeof data === 'object'
        && 'error' in data
        && data.error
      ) {
        throw new Error(String(data.error));
      }

      await signOut().catch(() => undefined);
      setIsDeleteModalOpen(false);
      setDeletePassword('');
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
      <div className="app-container-wide">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="app-muted mb-4 inline-flex min-h-[44px] items-center px-1 text-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
        >
          ← Retour
        </button>

        <header className="mb-6">
          <h1 className="app-title text-2xl">Paramètres</h1>
          <p className="app-subtitle">Compte, sécurité et accès rapides. Tout reste dans le cadre de l’app, sans écran secondaire inutile.</p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="app-card p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Compte</h2>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">Email connecté</p>
                <p className="mt-2 text-base font-medium text-white">{user?.email ?? 'Email indisponible'}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate(profileRoute)}
                  className="inline-flex min-h-[44px] items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
                >
                  Modifier mon profil
                </button>
                <button
                  type="button"
                  disabled={loadingAction !== null}
                  onClick={() => void handleResetPassword()}
                  className="inline-flex min-h-[44px] items-center rounded-2xl border border-orange-300/20 bg-orange-500/10 px-4 py-3 text-sm font-medium text-orange-100 transition hover:bg-orange-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {loadingAction === 'reset' ? 'Envoi…' : 'Changer mon mot de passe'}
                </button>
              </div>
            </section>

            <section className="app-card p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Sécurité</h2>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm font-medium text-white">Session</p>
                  <p className="mt-1 text-sm text-white/55">
                    Déconnectez-vous de cet appareil à tout moment. Vous recevrez ensuite un nouvel email pour réinitialiser le mot de passe si besoin.
                  </p>
                </div>
                <button
                  id="logout-btn"
                  type="button"
                  aria-label="Déconnexion"
                  disabled={loadingAction !== null}
                  onClick={() => void handleLogout()}
                  className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-medium text-stone-800 transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {loadingAction === 'logout' ? 'Déconnexion…' : 'Déconnexion'}
                </button>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="app-card p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Profil</h2>
              <p className="mt-3 text-sm text-white/60">
                Mettez à jour votre avatar, votre bio et vos informations publiques depuis votre fiche profil.
              </p>
              <button
                type="button"
                onClick={() => navigate(profileRoute)}
                className="mt-4 w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
              >
                Ouvrir mon profil
              </button>
            </section>

            <section className="app-card border-red-400/20 bg-red-500/10 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-red-100/70">Zone sensible</h2>
              <p className="mt-3 text-sm text-red-100/80">
                La suppression de compte est irréversible. Vos conversations, fichiers et données liées seront définitivement retirés.
              </p>
                <button
                  type="button"
                  disabled={loadingAction !== null}
                  onClick={() => {
                    setDeletePassword('');
                    setError(null);
                    setIsDeleteModalOpen(true);
                  }}
                  className="mt-4 w-full rounded-2xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm font-medium text-red-100 transition hover:bg-red-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {loadingAction === 'delete' ? 'Suppression…' : 'Supprimer le compte'}
                </button>
              <p className="mt-2 text-xs text-red-100/55">
                Si la suppression automatique n’est pas disponible, un message support s’affichera.
              </p>
            </section>
          </aside>
        </div>
      </div>

      {isDeleteModalOpen ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#161622] p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-white">Confirmer la suppression du compte</h2>
            <p className="mt-2 text-sm text-white/65">
              Cette action est irreversible. Saisissez votre mot de passe pour confirmer.
            </p>
            <label htmlFor="delete-password" className="mt-4 block text-xs uppercase tracking-[0.18em] text-white/45">
              Mot de passe
            </label>
            <input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-300"
              placeholder="Votre mot de passe"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (loadingAction === 'delete') return;
                  setIsDeleteModalOpen(false);
                  setDeletePassword('');
                }}
                className="min-h-[44px] flex-1 rounded-xl border border-white/20 px-3 text-sm text-white/80 transition hover:bg-white/10"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={loadingAction === 'delete' || !deletePassword.trim()}
                onClick={() => void handleDeleteAccount()}
                className="min-h-[44px] flex-1 rounded-xl bg-red-500 px-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {loadingAction === 'delete' ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
