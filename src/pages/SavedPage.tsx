import { useAuth } from '@/lib/supabase/auth';
import { useSavedItems } from '@/hooks/useSaved';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function SavedPage() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const userId = session?.user?.id;
  const { data: items = [], isLoading } = useSavedItems(userId);

  return (
    <main className="min-h-screen p-4 pb-24 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Éléments sauvegardés</h1>
      {isLoading ? (
        <div className="animate-pulse h-24 rounded-xl bg-stone-100" />
      ) : items.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-stone-500">Aucun élément sauvegardé.</p>
          <Button
            className="mt-4"
            onClick={() => navigate(profile?.user_type === 'studio' ? '/studio/dashboard' : '/pro/feed')}
          >
            Explorer
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id}>
              <GlassCard className="p-4">
                <p className="text-sm font-medium">{item.item_type}</p>
                <p className="text-xs text-stone-500 break-all">{item.item_id}</p>
              </GlassCard>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
