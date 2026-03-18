import { useAuth } from '@/lib/supabase/auth';
import { useSavedItems } from '@/hooks/useSaved';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function SavedPage() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const userId = session?.user?.id;
  const {
    data: items = [],
    isLoading,
    isError,
    error,
  } = useSavedItems(userId);

  return (
    <main className="app-shell">
      <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 md:pt-8">
      <h1 className="text-3xl font-semibold tracking-tight mb-4">Éléments sauvegardés</h1>
      {isLoading ? (
        <div className="animate-pulse h-24 rounded-xl bg-stone-100" />
      ) : isError ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-red-500">
            {error instanceof Error ? error.message : 'Impossible de charger les éléments sauvegardés.'}
          </p>
          <Button
            className="mt-4 bg-gradient-to-r from-orange-400 to-orange-600 text-white hover:opacity-95"
            onClick={() => navigate(profile?.user_type === 'studio' ? '/studio/dashboard' : '/pro/feed')}
          >
            Retour
          </Button>
        </GlassCard>
      ) : items.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-stone-500">Aucun élément sauvegardé.</p>
          <Button
            className="mt-4 bg-gradient-to-r from-orange-400 to-orange-600 text-white hover:opacity-95"
            onClick={() => navigate(profile?.user_type === 'studio' ? '/studio/dashboard' : '/pro/feed')}
          >
            Explorer
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id}>
              <GlassCard className="p-4 rounded-2xl">
                <p className="text-sm font-medium">{item.item_type}</p>
                <p className="text-xs text-stone-500 break-all">{item.item_id}</p>
              </GlassCard>
            </div>
          ))}
        </div>
      )}
      </div>
    </main>
  );
}
