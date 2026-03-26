import { useState } from 'react';
import { Activity, BadgeEuro, FolderKanban, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { MiniLineChart } from '@/components/shared/MiniLineChart';
import { PageMeta } from '@/components/shared/PageMeta';
import { StatCard } from '@/components/shared/StatCard';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/lib/supabase/auth';
import { formatCurrency, formatLongDate, ratingStars, type StudioDashboard as StudioDashboardData } from '@/lib/analytics/analyticsUtils';
import { normalizeMissionStatus } from '@/lib/missions/phase1Compat';
import { chatService } from '@/lib/chat/chatService';

type DashboardProfile = {
  avatar_url?: string | null;
  company_name?: string | null;
  full_name?: string | null;
} | null;

function missionStatusLabel(status: string): string {
  const normalized = normalizeMissionStatus(status);
  if (normalized === 'open') return 'Ouverte';
  if (normalized === 'draft') return 'Brouillon';
  if (normalized === 'in_progress') return 'En cours';
  if (normalized === 'completed') return 'Terminée';
  return 'Clôturée';
}

function missionStatusClass(status: string): string {
  const normalized = normalizeMissionStatus(status);
  if (normalized === 'open') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200';
  if (normalized === 'draft') return 'border-amber-400/20 bg-amber-400/10 text-amber-200';
  if (normalized === 'in_progress') return 'border-sky-400/20 bg-sky-400/10 text-sky-200';
  if (normalized === 'completed') return 'border-stone-400/20 bg-stone-400/10 text-stone-200';
  return 'border-red-400/20 bg-red-400/10 text-red-200';
}

function QuickAction({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 glass-card-hover px-4 py-3 w-full text-left"
    >
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-sm font-semibold tracking-wide text-white">{title}</p>
        <p className="mt-0.5 text-xs tracking-wider text-white/50">{description}</p>
      </div>
      <span className="ml-auto text-white/30">›</span>
    </button>
  );
}

export default function StudioDashboard() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const userId = session?.user?.id ?? null;
  const { data, chartData, loading, error } = useDashboard(userId, 'studio');
  const dashboard = data as StudioDashboardData | null;
  const dashboardProfile = profile as DashboardProfile;
  const [openingMissionId, setOpeningMissionId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  const companyName = dashboardProfile?.company_name?.trim()
    || dashboardProfile?.full_name?.trim()
    || 'Studio';
  const recentMissions = dashboard?.recent_missions ?? [];
  const ratingAvg = dashboard?.rating_avg ?? null;
  const ratingCount = dashboard?.rating_count ?? 0;

  const openChatForMission = async (missionId: string, sessionId: string | null) => {
    setOpeningMissionId(missionId);
    setChatError(null);

    try {
      const chatSessionId = sessionId ?? (await chatService.getOrCreateSession(missionId)).id;
      navigate(`/chat/${chatSessionId}`);
    } catch (openError) {
      setChatError(
        openError instanceof Error ? openError.message : "Impossible d'ouvrir le chat.",
      );
    } finally {
      setOpeningMissionId(null);
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="app-shell">
        <div className="app-container-wide flex min-h-[100dvh] items-center justify-center">
          <div className="flex items-center gap-3 text-white/60">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            Chargement du dashboard studio…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="dashboard-studio" className="app-shell">
      <PageMeta
        title="Mon Dashboard"
        description="Vos statistiques et votre activité récente côté studio."
        canonicalPath="/dashboard"
      />

      <div className="app-container-wide">
        <header className="app-header">
          <div className="flex items-center gap-3">
            {dashboardProfile?.avatar_url ? (
              <img
                src={dashboardProfile.avatar_url}
                alt="Avatar studio"
                className="h-14 w-14 rounded-full border border-white/20 object-cover shadow-[0_4px_20px_rgba(249,115,22,0.35)]"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-orange-500 to-orange-400 text-xl font-bold text-white shadow-[0_4px_20px_rgba(249,115,22,0.35)]">
                {companyName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="app-title">Bonjour, {companyName} 👋</h1>
              <p className="app-subtitle">
                {dashboard?.total_missions ?? 0} mission(s) au total · {dashboard?.active_sessions ?? 0} session(s) active(s)
              </p>
            </div>
          </div>

          <Button
            onClick={() => navigate('/studio/create-mission')}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            + Créer une mission
          </Button>
        </header>

        <section className="mb-6 space-y-3">
          <QuickAction
            icon="📌"
            title="Mes missions"
            description="Gérer vos offres publiées"
            onClick={() => navigate('/studio/missions')}
          />
          <QuickAction
            icon="🔍"
            title="Trouver des pros"
            description="Parcourir les profils disponibles"
            onClick={() => navigate('/pros')}
          />
          <QuickAction
            icon="💬"
            title="Mes conversations"
            description="Messages avec les pros"
            onClick={() => navigate('/studio/conversations')}
          />
          <QuickAction
            icon="⚙️"
            title="Paramètres"
            description="Sécurité et préférences du compte"
            onClick={() => navigate('/settings')}
          />
        </section>

        {error || chatError ? (
          <div className="mb-6 rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
            {error ?? chatError}
          </div>
        ) : null}

        <section className="app-stats-grid">
          <StatCard
            id="stat-published-missions"
            label="Missions publiées"
            value={dashboard?.published_missions ?? 0}
            icon={<FolderKanban size={20} />}
            color="orange"
          />
          <StatCard
            id="stat-pending-applications"
            label="Candidatures en attente"
            value={dashboard?.pending_applications ?? 0}
            icon={<Sparkles size={20} />}
            color="blue"
          />
          <StatCard
            id="stat-active-sessions"
            label="Sessions actives"
            value={dashboard?.active_sessions ?? 0}
            icon={<Activity size={20} />}
            color="green"
          />
          <StatCard
            id="stat-total-spent"
            label="Budget dépensé"
            value={formatCurrency(dashboard?.total_spent ?? 0)}
            icon={<BadgeEuro size={20} />}
            color="violet"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div id="chart-applications-over-time" className="app-card p-5">
            <MiniLineChart
              data={chartData}
              label="Candidatures reçues"
              color="#fb923c"
              id="mini-line-chart-applications"
            />
          </div>

          <div className="app-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Missions récentes</h2>
                <p className="text-xs text-white/45">5 dernières missions créées</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/studio/missions')}
                className="inline-flex min-h-[44px] items-center justify-center px-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-300 transition hover:text-orange-200"
              >
                Tout voir
              </button>
            </div>

            {recentMissions.length === 0 ? (
              <div id="recent-missions-list">
                <EmptyState
                  icon="🎬"
                  title="Publiez votre première mission"
                  description="Dès que vous créez une mission, elle apparaît ici avec ses candidatures et l’accès rapide au chat."
                  action={{ label: 'Créer une mission', onClick: () => navigate('/studio/missions/new') }}
                  className="px-4 py-8"
                />
              </div>
            ) : (
              <div id="recent-missions-list" className="space-y-3">
                {recentMissions.map((mission) => (
                  <div key={mission.id} className="recent-mission-item app-card-soft p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-white">{mission.title}</p>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${missionStatusClass(mission.status)}`}>
                            {missionStatusLabel(mission.status)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-white/50">
                          Créée le {formatLongDate(mission.created_at)}
                        </p>
                        <p className="mt-2 text-sm text-orange-200">
                          {mission.application_count} candidature{mission.application_count > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/studio/missions/${mission.id}/applications`)}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
                      >
                        Voir les candidatures
                      </button>
                      {normalizeMissionStatus(mission.status) === 'in_progress' ? (
                        <button
                          id={mission.session_id ? `btn-open-chat-${mission.session_id}` : undefined}
                          type="button"
                          disabled={openingMissionId === mission.id}
                          onClick={() => void openChatForMission(mission.id, mission.session_id)}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1.5 text-sm font-medium text-orange-200 transition hover:bg-orange-400/15 disabled:opacity-60"
                        >
                          Ouvrir le chat
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => navigate(`/studio/missions/${mission.id}/edit`)}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
                      >
                        Modifier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section
          id="studio-rating-display"
          className="app-card mt-6 p-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">Note moyenne</p>
              <div className="mt-3 flex items-center gap-3">
                <p className="text-4xl font-bold tracking-tight text-white">
                  {ratingAvg !== null ? ratingAvg.toFixed(1) : '—'}
                </p>
                <div>
                  <p className="text-lg text-orange-200">{ratingStars(ratingAvg)}</p>
                  <p className="text-xs text-white/45">
                    {ratingCount} avis
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
              {dashboard?.completed_sessions ?? 0} session(s) terminée(s)
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
