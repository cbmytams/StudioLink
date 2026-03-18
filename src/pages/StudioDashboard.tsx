import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { Button } from '@/components/ui/Button';

type Mission = {
  id: string
  title: string
  status: 'draft' | 'open' | 'closed' | 'completed'
  created_at: string
  deadline: string | null
  budget_min: number | null
  budget_max: number | null
}

type Application = {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  mission_id: string
  created_at: string
}

type MissionRow = {
  id: string
  title: string
  status: string | null
  created_at: string
  deadline: string | null
  budget_min: number | null
  budget_max: number | null
}

type ApplicationRow = {
  id: string
  status: string | null
  mission_id: string
  created_at: string
}

function mapMissionStatus(status: string | null): Mission['status'] {
  if (status === 'draft') return 'draft';
  if (status === 'open' || status === 'published' || status === 'selecting') return 'open';
  if (status === 'completed' || status === 'rated') return 'completed';
  return 'closed';
}

function mapApplicationStatus(status: string | null): Application['status'] {
  if (status === 'pending') return 'pending';
  if (status === 'accepted' || status === 'selected') return 'accepted';
  return 'rejected';
}

function statusBadgeClass(status: Mission['status']): string {
  if (status === 'open') return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
  if (status === 'draft') return 'bg-stone-100 text-stone-600 border border-stone-200';
  if (status === 'completed') return 'bg-green-100 text-green-700 border border-green-200';
  return 'bg-red-100 text-red-700 border border-red-200';
}

function statusLabel(status: Mission['status']): ReactNode {
  if (status === 'open') return 'Ouverte';
  if (status === 'draft') return 'Brouillon';
  if (status === 'completed') return 'Terminée';
  return 'Clôturée';
}

export default function StudioDashboard() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();

  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchDashboardData = async () => {
      if (!session?.user?.id) {
        if (!active) return;
        setMissions([]);
        setApplications([]);
        setLoadingMissions(false);
        return;
      }

      setLoadingMissions(true);
      setError(null);

      try {
        const missionColumns: string = 'id, title, status, created_at, deadline, budget_min, budget_max';
        const { data: missionRows, error: missionError } = await supabase
          .from('missions')
          .select(missionColumns)
          .eq('studio_id', session.user.id)
          .order('created_at', { ascending: false });

        if (missionError) throw missionError;

        const normalizedMissions: Mission[] = (missionRows as unknown as MissionRow[] | null ?? []).map((mission) => ({
          id: mission.id,
          title: mission.title,
          status: mapMissionStatus(mission.status),
          created_at: mission.created_at,
          deadline: mission.deadline,
          budget_min: mission.budget_min,
          budget_max: mission.budget_max,
        }));

        if (!active) return;
        setMissions(normalizedMissions);

        if (normalizedMissions.length === 0) {
          setApplications([]);
          return;
        }

        const missionIds = normalizedMissions.map((mission) => mission.id);
        const { data: applicationRows, error: applicationError } = await supabase
          .from('applications')
          .select('id, status, mission_id, created_at')
          .in('mission_id', missionIds);

        if (applicationError) throw applicationError;

        if (!active) return;
        setApplications((applicationRows as ApplicationRow[] | null ?? []).map((application) => ({
          id: application.id,
          status: mapApplicationStatus(application.status),
          mission_id: application.mission_id,
          created_at: application.created_at,
        })));
      } catch (fetchError) {
        if (!active) return;
        setMissions([]);
        setApplications([]);
        setError(fetchError instanceof Error ? fetchError.message : 'Impossible de charger le dashboard.');
      } finally {
        if (active) setLoadingMissions(false);
      }
    };

    void fetchDashboardData();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const stats = useMemo(() => {
    const missionList = missions ?? [];
    return {
      activeMissions: missionList.filter((mission) => mission.status === 'open').length,
      applicationsCount: applications.length,
      pendingApplications: applications.filter((application) => application.status === 'pending').length,
      closedMissions: missionList.filter(
        (mission) => mission.status === 'closed' || mission.status === 'completed',
      ).length,
    };
  }, [applications, missions]);

  const recentMissions = useMemo(() => (missions ?? []).slice(0, 5), [missions]);
  const companyName = (profile as { company_name?: string } | null)?.company_name ?? 'Studio';

  if (loadingMissions) {
    return (
      <div className="app-shell">
        <div className="app-container-wide flex min-h-screen items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-container-wide">
        <header className="app-header">
          <div>
            <h1 className="app-title">Bonjour, {companyName} 👋</h1>
            <p className="app-subtitle">{missions?.length ?? 0} mission(s) publiée(s)</p>
          </div>

          <Button
            onClick={() => navigate('/studio/create-mission')}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            + Créer une mission
          </Button>
        </header>

        {error ? (
          <p className="text-red-400 text-center">{error}</p>
        ) : (
          <>
            <section className="app-stats-grid">
              <div className="app-stat-card">
                <p className="text-2xl font-bold">{stats.activeMissions}</p>
                <p className="text-sm app-muted">Missions actives</p>
              </div>
              <div className="app-stat-card">
                <p className="text-2xl font-bold">{stats.applicationsCount}</p>
                <p className="text-sm app-muted">Candidatures reçues</p>
              </div>
              <div className="app-stat-card">
                <p className="text-2xl font-bold">{stats.pendingApplications}</p>
                <p className="text-sm app-muted">En attente</p>
              </div>
              <div className="app-stat-card">
                <p className="text-2xl font-bold">{stats.closedMissions}</p>
                <p className="text-sm app-muted">Missions clôturées</p>
              </div>
            </section>

            <section className="app-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Missions récentes</h2>
                <span className="text-xs app-muted">5 plus récentes</span>
              </div>

              {recentMissions.length === 0 ? (
                <div className="app-empty-state">
                  Aucune mission publiée pour l&apos;instant.
                  <br />
                  <button
                    onClick={() => navigate('/studio/create-mission')}
                    className="text-orange-600 underline mt-2"
                  >
                    Créer votre première mission
                  </button>
                </div>
              ) : (
                <div className="app-list">
                  {recentMissions.map((mission) => {
                    const candidateCount = applications.filter(
                      (application) => application.mission_id === mission.id,
                    ).length;

                    return (
                      <div
                        key={mission.id}
                        className="app-card-soft flex flex-wrap items-center justify-between gap-3 p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{mission.title}</p>
                          <p className="text-xs app-muted">
                            Créée le {new Date(mission.created_at).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-xs app-muted mt-1">
                            {candidateCount} candidature{candidateCount > 1 ? 's' : ''}
                          </p>
                        </div>

                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(mission.status)}`}>
                          {statusLabel(mission.status)}
                        </span>

                        <button
                          type="button"
                          className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-sm text-black/80 transition hover:bg-white"
                          onClick={() => navigate(`/studio/applications/${mission.id}`)}
                        >
                          Gérer →
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
