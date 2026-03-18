import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { Button as GradientButton } from '@/components/ui/Button';
import Navbar from '@/components/layout/Navbar';

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
  if (status === 'open') return 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30';
  if (status === 'draft') return 'bg-white/10 text-white/70 border border-white/15';
  if (status === 'completed') return 'bg-blue-500/20 text-blue-300 border border-blue-400/30';
  return 'bg-red-500/20 text-red-300 border border-red-400/30';
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
      <div className="min-h-screen bg-[#0D0D0F] text-white">
        <Navbar />
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 pt-4 pb-8">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 pt-4 pb-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Bonjour, {companyName} 👋</h1>
            <p className="text-sm text-white/60">{missions?.length ?? 0} mission(s) publiée(s)</p>
          </div>

          <GradientButton
            onClick={() => navigate('/studio/create-mission')}
            className="bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:opacity-95"
          >
            + Créer une mission
          </GradientButton>
        </header>

        {error ? (
          <p className="text-red-400 text-center">{error}</p>
        ) : (
          <>
            <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold">{stats.activeMissions}</p>
                <p className="text-sm text-white/60">Missions actives</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold">{stats.applicationsCount}</p>
                <p className="text-sm text-white/60">Candidatures reçues</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold">{stats.pendingApplications}</p>
                <p className="text-sm text-white/60">En attente</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold">{stats.closedMissions}</p>
                <p className="text-sm text-white/60">Missions clôturées</p>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Missions récentes</h2>
                <span className="text-xs text-white/50">5 plus récentes</span>
              </div>

              {recentMissions.length === 0 ? (
                <div className="text-center text-white/40 py-8">
                  Aucune mission publiée pour l&apos;instant.
                  <br />
                  <button
                    onClick={() => navigate('/studio/create-mission')}
                    className="text-violet-400 underline mt-2"
                  >
                    Créer votre première mission
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentMissions.map((mission) => {
                    const candidateCount = applications.filter(
                      (application) => application.mission_id === mission.id,
                    ).length;

                    return (
                      <div
                        key={mission.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{mission.title}</p>
                          <p className="text-xs text-white/50">
                            Créée le {new Date(mission.created_at).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-xs text-white/60 mt-1">
                            {candidateCount} candidature{candidateCount > 1 ? 's' : ''}
                          </p>
                        </div>

                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(mission.status)}`}>
                          {statusLabel(mission.status)}
                        </span>

                        <button
                          type="button"
                          className="rounded-full border border-white/20 px-3 py-1.5 text-sm text-white/90 transition hover:bg-white/10"
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
