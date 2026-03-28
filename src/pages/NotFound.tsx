import { useAuth } from '@/lib/supabase/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { PageMeta } from '@/components/shared/PageMeta';
import { SEO } from '@/components/SEO';
import {
  getDashboardPath,
  resolveProfileType,
} from '@/lib/auth/profileCompleteness';

type AuthProfile = {
  type?: 'studio' | 'pro' | 'admin';
  user_type?: 'studio' | 'pro' | 'admin';
} | null;

export default function NotFound() {
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  const user = session?.user ?? null;
  const profileType = resolveProfileType(profile as AuthProfile);

  const handleBack = () => {
    if (user) navigate(getDashboardPath(profileType));
    else navigate('/');
  };

  return (
    <div id="page-404" className="app-shell flex min-h-[100dvh] flex-col items-center justify-center px-4 text-center">
      <SEO title="Page introuvable" noIndex url="/404" />
      <PageMeta
        title="Page introuvable"
        description="La page demandée n'existe pas ou n'est plus disponible."
        canonicalPath="/404"
      />
      <div className="max-w-lg rounded-[2.5rem] border border-white/15 bg-white/6 px-8 py-12 shadow-[0_18px_48px_rgba(12,12,12,0.18)]">
        <p className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-8xl font-bold text-transparent">
          404
        </p>
        <h1 className="mt-5 text-2xl font-semibold text-white">Page introuvable</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Le lien est peut-être erroné, expiré ou la page a été déplacée. Tu peux revenir vers ton espace principal.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            id="btn-back-home"
            onClick={handleBack}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            Retour
          </Button>
          <button
            id="btn-go-home"
            type="button"
            onClick={() => navigate('/')}
            className="min-h-[44px] rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/75 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
          >
            Accueil
          </button>
        </div>
      </div>
    </div>
  );
}
