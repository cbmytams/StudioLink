import { useAuth } from '@/lib/supabase/auth';
import { useNavigate } from 'react-router-dom';
import { GradientButton } from '@/components/ui/GradientButton';

type AuthProfile = {
  type?: 'studio' | 'pro' | 'admin';
  user_type?: 'studio' | 'pro' | 'admin';
} | null;

export const NotFoundPage = () => {
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  const user = session?.user ?? null;
  const profileType = (profile as AuthProfile)?.type ?? (profile as AuthProfile)?.user_type ?? null;

  const handleBack = () => {
    if (user && profileType === 'studio') navigate('/studio/dashboard');
    else if (user && profileType === 'pro') navigate('/pro/dashboard');
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white flex flex-col items-center justify-center text-center px-4">
      <p className="text-8xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-4">
        404
      </p>
      <h1 className="text-2xl font-bold text-white mb-2">Page introuvable</h1>
      <p className="text-white/40 text-sm mb-8">
        Cette page n&apos;existe pas ou a été supprimée.
      </p>
      <GradientButton onClick={handleBack}>
        Retour à l&apos;accueil
      </GradientButton>
    </div>
  );
};

export default NotFoundPage;
