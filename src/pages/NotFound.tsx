import { useAuth } from '@/lib/supabase/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { PageMeta } from '@/components/shared/PageMeta';
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
    <div id="page-404" className="app-shell flex min-h-screen flex-col items-center justify-center px-4 text-center">
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
        <Button
          id="btn-back-home"
          onClick={handleBack}
          className="mt-8 bg-orange-500 text-white hover:bg-orange-600"
        >
          Retour au dashboard
        </Button>
      </div>
    </div>
  );
}
