import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

type SavedMissionRow = {
  id: string;
  item_id: string;
  item_type: string;
};

type MissionCard = {
  id: string;
  title: string | null;
  category: string | null;
  mission_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: string | null;
};

function budgetText(mission: MissionCard): string {
  if (mission.budget_min !== null && mission.budget_max !== null) {
    return `${mission.budget_min}€ – ${mission.budget_max}€/j`;
  }
  if (mission.budget_min !== null) {
    return `À partir de ${mission.budget_min}€/j`;
  }
  return 'Budget non renseigné';
}

function statusBadgeClass(status: string | null): string {
  if (status === 'pending' || status === 'selecting' || status === 'published' || status === 'open') {
    return 'bg-yellow-100 text-yellow-700';
  }
  if (status === 'selected' || status === 'accepted' || status === 'in_progress') {
    return 'bg-green-100 text-green-700';
  }
  if (status === 'rejected' || status === 'cancelled' || status === 'closed') {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-stone-100 text-stone-600';
}

function statusLabel(status: string | null): string {
  if (!status) return 'Inconnu';
  if (status === 'published' || status === 'open') return 'Ouverte';
  if (status === 'selecting' || status === 'pending') return 'En cours';
  if (status === 'in_progress' || status === 'selected' || status === 'accepted') return 'Active';
  if (status === 'closed' || status === 'cancelled' || status === 'rejected') return 'Clôturée';
  if (status === 'completed') return 'Terminée';
  return status;
}

export default function SavedPage() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const userId = session?.user?.id;
  const [missions, setMissions] = useState<MissionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchSavedMissions = async () => {
      if (!userId) {
        if (!active) return;
        setMissions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data: savedRows, error: savedError } = await supabase
          .from('saved_items')
          .select('id, item_id, item_type')
          .eq('user_id', userId)
          .eq('item_type', 'mission')
          .order('created_at', { ascending: false });

        if (savedError) throw savedError;

        const savedMissionRows = (savedRows ?? []) as SavedMissionRow[];
        if (savedMissionRows.length === 0) {
          if (!active) return;
          setMissions([]);
          return;
        }

        const missionIds = savedMissionRows.map((row) => row.item_id);
        const { data: missionRows, error: missionError } = await supabase
          .from('missions')
          .select('id, title, category, mission_type, budget_min, budget_max, status')
          .in('id', missionIds);

        if (missionError) throw missionError;

        const missionMap = new Map<string, MissionCard>(
          ((missionRows ?? []) as MissionCard[]).map((mission) => [mission.id, mission]),
        );

        const orderedMissions = missionIds
          .map((missionId) => missionMap.get(missionId))
          .filter((mission): mission is MissionCard => Boolean(mission));

        if (!active) return;
        setMissions(orderedMissions);
      } catch (fetchError) {
        if (!active) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Impossible de charger les éléments sauvegardés.',
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchSavedMissions();

    return () => {
      active = false;
    };
  }, [userId]);

  const handleRemove = async (missionId: string) => {
    if (!userId) return;
    setError(null);

    const { error: deleteError } = await supabase
      .from('saved_items')
      .delete()
      .eq('user_id', userId)
      .eq('item_id', missionId)
      .eq('item_type', 'mission');

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setMissions((prev) => prev.filter((mission) => mission.id !== missionId));
  };

  return (
    <main className="app-shell">
      <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 md:pt-8">
        <h1 className="app-title mb-4">Éléments sauvegardés</h1>
        {loading ? (
          <div className="space-y-3">
            <div className="animate-pulse h-24 rounded-xl bg-stone-100" />
            <div className="animate-pulse h-24 rounded-xl bg-stone-100" />
          </div>
        ) : error ? (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-red-500">
              {error}
            </p>
            <Button
              className="mt-4 bg-orange-500 text-white hover:bg-orange-600"
              onClick={() => navigate(profile?.user_type === 'studio' ? '/studio/dashboard' : '/pro/feed')}
            >
              Retour
            </Button>
          </GlassCard>
        ) : missions.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-stone-500">Aucun élément sauvegardé.</p>
            <Button
              className="mt-4 bg-orange-500 text-white hover:bg-orange-600"
              onClick={() => navigate(profile?.user_type === 'studio' ? '/studio/dashboard' : '/pro/feed')}
            >
              Explorer
            </Button>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {missions.map((mission) => (
              <GlassCard key={mission.id} className="rounded-2xl p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-stone-900">
                    {mission.title ?? 'Mission sans titre'}
                  </p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(mission.status)}`}>
                    {statusLabel(mission.status)}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  {mission.category ?? 'Catégorie non renseignée'} · {mission.mission_type ?? 'Type non renseigné'}
                </p>
                <p className="mt-2 text-sm text-orange-700">{budgetText(mission)}</p>
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    className="bg-orange-500 text-white hover:bg-orange-600"
                    onClick={() => navigate(`/mission/${mission.id}`)}
                  >
                    Voir la mission
                  </Button>
                  <button
                    type="button"
                    onClick={() => void handleRemove(mission.id)}
                    className="min-h-[44px] rounded-lg border border-orange-200 bg-orange-50 px-4 text-sm font-medium text-orange-700 transition hover:bg-orange-100"
                  >
                    Retirer
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
