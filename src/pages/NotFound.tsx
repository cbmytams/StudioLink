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

type NotFoundProps = {
  title?: string;
  description?: string;
};

export default function NotFound({
  title = 'Page introuvable',
  description = "La page demandée n'existe pas ou n'est plus disponible.",
}: NotFoundProps) {
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  const user = session?.user ?? null;
  const profileType = resolveProfileType(profile as AuthProfile);

  const handleBack = () => {
    if (user) navigate(getDashboardPath(profileType));
    else navigate('/');
  };

  return (
    <div id="page-404" className="app-shell flex min-h-[var(--size-full-dvh)] flex-col items-center justify-center px-4 text-center">
      <SEO title={title} noIndex url="/404" />
      <PageMeta
        title={title}
        description={description}
        canonicalPath="/404"
      />
      <div className="max-w-lg rounded-[var(--radius-2xl)] border border-white/15 bg-white/6 px-8 py-12 shadow-[var(--shadow-soft)]">
        <p className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-8xl font-bold text-transparent">
          404
        </p>
        <h1 style={{ fontSize: 'var(--text-xl)' }} className="mt-5 font-semibold text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            id="btn-back-home"
            onClick={handleBack}
            className="w-full bg-orange-500 text-white hover:bg-orange-600 sm:w-auto"
          >
            Retourner à l&apos;accueil
          </Button>
          <button
            id="btn-go-home"
            type="button"
            onClick={() => navigate('/')}
            className="min-h-[var(--size-touch)] w-full rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/75 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 sm:w-auto"
          >
            Accueil
          </button>
        </div>
      </div>
    </div>
  );
}
