import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';

type MissionStatus = 'open' | 'closed' | 'draft';
type FilterValue = 'all' | MissionStatus;

type MissionPrimaryRow = {
  id: string
  title: string
  city: string | null
  daily_rate: number | null
  status: string | null
  created_at: string
};

type MissionFallbackRow = {
  id: string
  title: string
  location: string | null
  budget_min: number | null
  status: string | null
  created_at: string
};

type Mission = {
  id: string
  title: string
  city: string | null
  daily_rate: number | null
  status: MissionStatus
  created_at: string
  applicationsCount: number
};

const FILTERS: Array<{ label: string; value: FilterValue }> = [
  { label: 'Toutes', value: 'all' },
  { label: 'Ouvertes', value: 'open' },
  { label: 'Fermées', value: 'closed' },
  { label: 'Brouillons', value: 'draft' },
];

const MISSION_STATUS: Record<MissionStatus, { label: string; className: string }> = {
  open: { label: 'Ouverte', className: 'bg-green-50 text-green-600 border border-green-200' },
  closed: { label: 'Fermée', className: 'bg-gray-100 text-gray-500 border border-gray-200' },
  draft: { label: 'Brouillon', className: 'bg-yellow-50 text-yellow-600 border border-yellow-200' },
};

function normalizeStatus(status: string | null): MissionStatus {
  if (status === 'draft') return 'draft';
  if (status === 'open' || status === 'published' || status === 'selecting') return 'open';
  return 'closed';
}

export default function StudioMissions() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');

  useEffect(() => {
    let active = true;

    const fetchMissions = async () => {
      if (!userId) {
        if (!active) return;
        setMissions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let normalizedMissions: Mission[] = [];

        const primaryResult = await supabase
          .from('missions')
          .select('id, title, city, daily_rate, status, created_at')
          .eq('studio_id', userId)
          .order('created_at', { ascending: false });

        if (!primaryResult.error) {
          const rows = primaryResult.data as MissionPrimaryRow[] | null ?? [];
          normalizedMissions = rows.map((row) => ({
            id: row.id,
            title: row.title,
            city: row.city,
            daily_rate: row.daily_rate,
            status: normalizeStatus(row.status),
            created_at: row.created_at,
            applicationsCount: 0,
          }));
        } else {
          const fallbackResult = await supabase
            .from('missions')
            .select('id, title, location, budget_min, status, created_at')
            .eq('studio_id', userId)
            .order('created_at', { ascending: false });

          if (fallbackResult.error) throw fallbackResult.error;

          const rows = fallbackResult.data as MissionFallbackRow[] | null ?? [];
          normalizedMissions = rows.map((row) => ({
            id: row.id,
            title: row.title,
            city: row.location,
            daily_rate: row.budget_min,
            status: normalizeStatus(row.status),
            created_at: row.created_at,
            applicationsCount: 0,
          }));
        }

        if (normalizedMissions.length > 0) {
          const missionIds = normalizedMissions.map((mission) => mission.id);
          const { data: applicationRows, error: applicationsError } = await supabase
            .from('applications')
            .select('mission_id')
            .in('mission_id', missionIds);

          if (applicationsError) throw applicationsError;

          const counts = new Map<string, number>();
          (applicationRows as Array<{ mission_id: string }> | null ?? []).forEach((row) => {
            counts.set(row.mission_id, (counts.get(row.mission_id) ?? 0) + 1);
          });

          normalizedMissions = normalizedMissions.map((mission) => ({
            ...mission,
            applicationsCount: counts.get(mission.id) ?? 0,
          }));
        }

        if (!active) return;
        setMissions(normalizedMissions);
      } catch (fetchError) {
        if (!active) return;
        setMissions([]);
        setError(fetchError instanceof Error ? fetchError.message : 'Impossible de charger les missions.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchMissions();

    return () => {
      active = false;
    };
  }, [userId]);

  const filteredMissions = useMemo(
    () => (activeFilter === 'all'
      ? missions
      : missions.filter((mission) => mission.status === activeFilter)),
    [activeFilter, missions],
  );

  const handleDelete = async (missionId: string) => {
    if (!userId) return;
    if (!window.confirm('Supprimer cette mission ?')) return;

    setDeletingId(missionId);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('missions')
        .delete()
        .eq('id', missionId)
        .eq('studio_id', userId);

      if (deleteError) throw deleteError;

      setMissions((prev) => prev.filter((mission) => mission.id !== missionId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Impossible de supprimer la mission.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="app-shell">
      <Helmet>
        <title>Mes missions — StudioLink</title>
        <meta
          name="description"
          content="Gérez vos missions publiées, brouillons et fermées depuis votre espace studio."
        />
      </Helmet>
      <div className="app-container-compact">
        <header className="mb-4 flex items-center justify-between gap-3">
          <h1 className="app-title text-2xl">Mes missions</h1>
          <button
            type="button"
            onClick={() => navigate('/studio/missions/new')}
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
          >
            ＋ Nouvelle mission
          </button>
        </header>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                activeFilter === filter.value
                  ? 'bg-orange-500 text-white'
                  : 'border border-gray-200 bg-white text-gray-500 hover:bg-orange-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <p className="mb-4 text-sm app-muted">
          {filteredMissions.length} mission{filteredMissions.length > 1 ? 's' : ''}
        </p>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-white/50 bg-white p-4 animate-pulse">
                <div className="h-4 w-1/2 rounded bg-stone-200" />
                <div className="mt-2 h-3 w-3/4 rounded bg-stone-200" />
                <div className="mt-4 h-8 rounded bg-stone-200" />
              </div>
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}

        {!loading && !error && missions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📌</p>
            <p className="text-gray-500 text-sm">Aucune mission créée pour l&apos;instant.</p>
            <button
              type="button"
              onClick={() => navigate('/studio/missions/new')}
              className="text-orange-500 text-sm hover:underline mt-2 block mx-auto"
            >
              Créer votre première mission
            </button>
          </div>
        ) : null}

        {!loading && !error && missions.length > 0 && filteredMissions.length === 0 ? (
          <p className="text-center py-10 text-sm text-gray-400">Aucune mission dans cette catégorie.</p>
        ) : null}

        {!loading && !error && filteredMissions.length > 0 ? (
          <div className="app-list">
            {filteredMissions.map((mission) => {
              const statusConfig = MISSION_STATUS[mission.status];
              const createdAt = new Date(mission.created_at).toLocaleDateString('fr-FR');

              return (
                <article key={mission.id} className="rounded-2xl border border-white/50 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900">{mission.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.className}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    {mission.city ? `${mission.city} · ` : ''}
                    {mission.daily_rate !== null ? `${mission.daily_rate} €/j` : 'Tarif non renseigné'}
                    {' · '}
                    {createdAt}
                  </p>

                  <p className="mt-2 text-xs text-orange-500">
                    {mission.applicationsCount} candidature{mission.applicationsCount > 1 ? 's' : ''}
                  </p>

                  <div className="mt-3 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/studio/missions/${mission.id}/edit`)}
                      className="text-sm text-orange-500 hover:underline"
                    >
                      Modifier →
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === mission.id}
                      onClick={() => void handleDelete(mission.id)}
                      className="text-sm text-red-400 hover:text-red-500 disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

