import { useAuth } from '@/lib/supabase/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

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
    <div className="app-shell flex flex-col items-center justify-center text-center px-4">
      <p className="text-8xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-4">
        404
      </p>
      <h1 className="text-2xl font-bold text-black mb-2">Page introuvable</h1>
      <p className="text-stone-500 text-sm mb-8">
        Cette page n&apos;existe pas ou a été supprimée.
      </p>
      <Button onClick={handleBack} className="bg-orange-500 text-white hover:bg-orange-600">
        Retour à l&apos;accueil
      </Button>
    </div>
  );
};

export default NotFoundPage;
