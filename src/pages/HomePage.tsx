import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/supabase/auth';
import { Button as GradientButton } from '@/components/ui/Button';
import { Helmet } from 'react-helmet-async';

export default function HomePage() {
  const navigate = useNavigate();
  const { session, profile, loading } = useAuth();

  const user = session?.user ?? null;
  const profileType = (profile as { type?: 'studio' | 'pro'; user_type?: 'studio' | 'pro' } | null)?.type
    ?? (profile as { user_type?: 'studio' | 'pro' } | null)?.user_type
    ?? null;

  useEffect(() => {
    if (!loading && user) {
      if (profileType === 'studio') navigate('/studio/dashboard');
      else if (profileType === 'pro') navigate('/pro/dashboard');
    }
  }, [user, profileType, loading, navigate]);

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white">
      <Helmet>
        <title>StudioLink — Plateforme Studios & Créatifs</title>
        <meta
          name="description"
          content="Frapppe connecte les studios et les professionnels créatifs via une plateforme sur invitation."
        />
        <meta property="og:title" content="StudioLink — Plateforme Studios & Créatifs" />
        <meta
          property="og:description"
          content="Rejoins la plateforme sur invitation pour publier des missions ou candidater en tant que pro."
        />
      </Helmet>
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-24">
        <span className="inline-block text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3 py-1 rounded-full mb-6">
          🔒 Plateforme sur invitation uniquement
        </span>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          La plateforme qui connecte
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            studios & créatifs
          </span>
        </h1>

        <p className="text-white/50 text-lg md:text-xl max-w-xl mb-10">
          Frapppe réunit les studios de production et les professionnels créatifs
          pour des collaborations fluides et efficaces.
        </p>

        <GradientButton
          onClick={() => navigate('/invitation')}
          className="bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:opacity-95"
        >
          J&apos;ai une invitation →
        </GradientButton>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-10">Une plateforme, deux univers</h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            <article className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-3xl mb-4">🎬</p>
              <h3 className="text-xl font-semibold mb-3">Studios de production</h3>
              <p className="text-white/60 mb-4">
                Publiez vos missions, recevez des candidatures qualifiées et gérez vos collaborations en un seul endroit.
              </p>
              <ul className="space-y-2 text-sm text-white/75">
                <li>✓ Création de missions en quelques minutes</li>
                <li>✓ Accès à des profils vérifiés</li>
                <li>✓ Gestion des candidatures intégrée</li>
              </ul>
            </article>

            <article className="bg-white/5 border border-violet-500/20 rounded-2xl p-6">
              <p className="text-3xl mb-4">🎨</p>
              <h3 className="text-xl font-semibold mb-3">Professionnels créatifs</h3>
              <p className="text-white/60 mb-4">
                Découvrez des missions adaptées à vos compétences et construisez votre réputation sur la plateforme.
              </p>
              <ul className="space-y-2 text-sm text-white/75">
                <li>✓ Feed de missions personnalisé</li>
                <li>✓ Candidature en un clic</li>
                <li>✓ Suivi de vos collaborations</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-10">Comment ça marche ?</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <article className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-3">01</p>
              <h3 className="text-xl font-semibold mb-2">Recevez votre invitation</h3>
              <p className="text-white/60 text-sm">
                La plateforme est accessible sur invitation uniquement. Contactez-nous pour rejoindre.
              </p>
            </article>

            <article className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-3">02</p>
              <h3 className="text-xl font-semibold mb-2">Créez votre profil</h3>
              <p className="text-white/60 text-sm">
                Studio ou pro créatif, complétez votre profil en quelques minutes.
              </p>
            </article>

            <article className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-3">03</p>
              <h3 className="text-xl font-semibold mb-2">Collaborez</h3>
              <p className="text-white/60 text-sm">
                Studios publient leurs missions, les pros postulent. C&apos;est aussi simple que ça.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center max-w-xl mx-auto">
            <h2 className="text-3xl font-semibold mb-3">Prêt à rejoindre Frapppe ?</h2>
            <p className="text-white/50 text-sm mb-6">
              Vous avez reçu un lien d&apos;invitation ? Créez votre compte maintenant.
            </p>
            <div className="flex flex-col items-center gap-4">
              <GradientButton
                onClick={() => navigate('/invitation')}
                className="bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:opacity-95"
              >
                Créer mon compte →
              </GradientButton>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Déjà un compte ? Se connecter
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-white/30 text-xs">
        © 2025 Frapppe. Tous droits réservés.
      </footer>
    </div>
  );
}
