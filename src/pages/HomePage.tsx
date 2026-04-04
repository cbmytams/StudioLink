import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/supabase/auth';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/SEO';
import {
  getDashboardPath,
  isProfileIncomplete,
  resolveProfileType,
} from '@/lib/auth/profileCompleteness';

export default function HomePage() {
  const navigate = useNavigate();
  const { session, profile, loading } = useAuth();

  const user = session?.user ?? null;
  const homeProfile = profile as {
    type?: 'studio' | 'pro' | null;
    user_type?: 'studio' | 'pro' | null;
    full_name?: string | null;
    display_name?: string | null;
    bio?: string | null;
  } | null;
  const profileType = resolveProfileType(homeProfile);

  useEffect(() => {
    if (!loading && user) {
      if (isProfileIncomplete(homeProfile)) {
        navigate('/onboarding');
        return;
      }
      navigate(getDashboardPath(profileType));
    }
  }, [homeProfile, loading, navigate, profileType, user]);

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[var(--color-surface)]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 shadow-[var(--shadow-primary-glow)]">
              <span className="text-base font-bold tracking-tight text-white">SL</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">StudioLink</p>
              <p className="text-xs text-white/45">Studios & pros audio sur invitation</p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="hidden min-h-[var(--size-touch)] rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/25 hover:text-white md:inline-flex"
            >
              Connexion
            </button>
            <Button
              onClick={() => navigate('/invitation')}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              J&apos;ai une invitation
            </Button>
          </div>
        </div>
      </header>

      <SEO
        description="StudioLink connecte les studios et les professionnels creatifs via une plateforme sur invitation."
        url="/"
      />
      <section className="min-h-[var(--hero-min-height)] flex flex-col items-center justify-center text-center px-4 py-24">
        <span className="inline-block rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs text-orange-700 mb-6">
          🔒 Plateforme sur invitation uniquement
        </span>

        <h1 style={{ fontSize: 'var(--text-2xl)' }} className="mb-6 font-bold leading-tight text-white">
          La plateforme qui connecte
          <br />
          <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            studios & créatifs
          </span>
        </h1>

        <p className="text-white/65 text-lg md:text-xl max-w-2xl mb-10">
          StudioLink réunit les studios de production et les professionnels créatifs
          pour des collaborations fluides et efficaces.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Button
            onClick={() => navigate('/invitation')}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            J&apos;ai une invitation →
          </Button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex min-h-[var(--size-touch)] items-center justify-center px-2 text-sm font-medium text-white/60 transition hover:text-white"
          >
            Déjà membre ? Se connecter
          </button>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-10 text-white">Une plateforme, deux univers</h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            <article className="app-card p-6">
              <p className="text-3xl mb-4">🎬</p>
              <h3 className="text-xl font-semibold mb-3 text-white">Studios de production</h3>
              <p className="text-white/65 mb-4">
                Publiez vos missions, recevez des candidatures qualifiées et gérez vos collaborations en un seul endroit.
              </p>
              <ul className="space-y-2 text-sm text-white/60">
                <li>✓ Création de missions en quelques minutes</li>
                <li>✓ Accès à des profils vérifiés</li>
                <li>✓ Gestion des candidatures intégrée</li>
              </ul>
            </article>

            <article className="app-card p-6">
              <p className="text-3xl mb-4">🎨</p>
              <h3 className="text-xl font-semibold mb-3 text-white">Professionnels créatifs</h3>
              <p className="text-white/65 mb-4">
                Découvrez des missions adaptées à vos compétences et construisez votre réputation sur la plateforme.
              </p>
              <ul className="space-y-2 text-sm text-white/60">
                <li>✓ Feed de missions personnalisé</li>
                <li>✓ Candidature en un clic</li>
                <li>✓ Suivi de vos collaborations</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="py-[var(--section-y-fluid)] md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-8 text-white">Comment ça marche ?</h2>
          <div className="flex flex-col gap-[var(--section-gap-fluid)] md:flex-row">
            <article className="flex-1 app-card p-5">
              <p className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-3">01</p>
              <h3 className="text-xl font-semibold mb-2 text-white">Recevez votre invitation</h3>
              <p className="text-white/60 text-sm">
                La plateforme est accessible sur invitation uniquement. Contactez-nous pour rejoindre.
              </p>
            </article>

            <article className="flex-1 app-card p-5">
              <p className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-3">02</p>
              <h3 className="text-xl font-semibold mb-2 text-white">Créez votre profil</h3>
              <p className="text-white/60 text-sm">
                Studio ou pro créatif, complétez votre profil en quelques minutes.
              </p>
            </article>

            <article className="flex-1 app-card p-5">
              <p className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-3">03</p>
              <h3 className="text-xl font-semibold mb-2 text-white">Collaborez</h3>
              <p className="text-white/60 text-sm">
                Studios publient leurs missions, les pros postulent. C&apos;est aussi simple que ça.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="app-card p-10 text-center max-w-xl mx-auto">
            <h2 className="text-3xl font-semibold mb-3 text-white">Prêt à rejoindre StudioLink ?</h2>
            <p className="text-white/65 text-sm mb-6">
              Vous avez reçu un lien d&apos;invitation ? Créez votre compte maintenant.
            </p>
            <div className="flex flex-col items-center gap-4">
              <Button
                onClick={() => navigate('/invitation')}
                className="bg-orange-500 text-white hover:bg-orange-600"
              >
                Créer mon compte →
              </Button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex min-h-[var(--size-touch)] items-center justify-center px-2 text-sm text-white/50 transition-colors hover:text-white"
              >
                Déjà un compte ? Se connecter
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-white/35 text-xs">
        <p>© 2026 StudioLink. Tous droits réservés.</p>
        <p className="mt-1 text-white/50">Contact : contact@studiolink-paris.fr</p>
        <div className="mt-2 flex justify-center gap-4 text-white/55">
          <Link to="/legal/mentions" className="inline-flex min-h-[var(--size-touch)] items-center underline underline-offset-2 hover:text-white">
            Mentions légales
          </Link>
          <Link to="/legal/terms" className="inline-flex min-h-[var(--size-touch)] items-center underline underline-offset-2 hover:text-white">
            Conditions d&apos;utilisation
          </Link>
          <Link to="/legal/privacy" className="inline-flex min-h-[var(--size-touch)] items-center underline underline-offset-2 hover:text-white">
            Politique de confidentialité
          </Link>
        </div>
      </footer>
    </div>
  );
}
