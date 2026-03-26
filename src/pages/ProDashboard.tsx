import { Activity, BadgeEuro, Percent, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';
import { MiniLineChart } from '@/components/shared/MiniLineChart';
import { PageMeta } from '@/components/shared/PageMeta';
import { StatCard } from '@/components/shared/StatCard';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/lib/supabase/auth';
import { formatCurrency, formatLongDate, ratingStars, type ProDashboard as ProDashboardData } from '@/lib/analytics/analyticsUtils';

type DashboardProfile = {
  avatar_url?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  username?: string | null;
} | null;

function applicationStatusLabel(status: string): string {
  if (status === 'accepted') return 'Acceptée';
  if (status === 'rejected') return 'Refusée';
  return 'En attente';
}

function applicationStatusClass(status: string): string {
  if (status === 'accepted') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200';
  if (status === 'rejected') return 'border-red-400/20 bg-red-400/10 text-red-200';
  return 'border-amber-400/20 bg-amber-400/10 text-amber-200';
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
      className="flex items-center gap-2 bg-white rounded-2xl border border-white/50 px-4 py-3 w-full text-left hover:bg-orange-50 transition-colors"
    >
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <span className="ml-auto text-gray-300">›</span>
    </button>
  );
}

export default function ProDashboard() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const userId = session?.user?.id ?? null;
  const { data, chartData, loading, error } = useDashboard(userId, 'pro');
  const dashboard = data as ProDashboardData | null;
  const dashboardProfile = profile as DashboardProfile;

  const greetingName = dashboardProfile?.full_name?.trim()
    || dashboardProfile?.username?.trim()
    || dashboardProfile?.display_name?.trim()
    || 'Pro';
  const recentApplications = dashboard?.recent_applications ?? [];
  const ratingAvg = dashboard?.rating_avg ?? null;
  const ratingCount = dashboard?.rating_count ?? 0;

  if (loading && !dashboard) {
    return (
      <div className="app-shell">
        <div className="app-container flex min-h-[100dvh] items-center justify-center">
          <div className="flex items-center gap-3 text-white/60">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            Chargement du dashboard pro…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="dashboard-pro" className="app-shell">
      <PageMeta
        title="Mon Dashboard"
        description="Vos statistiques et votre activité récente côté pro."
        canonicalPath="/dashboard"
      />

      <div className="app-container">
        <header className="mb-5">
          <div className="flex items-center gap-3">
            {dashboardProfile?.avatar_url ? (
              <img
                src={dashboardProfile.avatar_url}
                alt="Avatar pro"
                className="h-12 w-12 rounded-full border border-white/50 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white">
                {greetingName.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <div>
              <h1 className="app-title">Bonjour, {greetingName} 👋</h1>
              <p className="app-subtitle">
                {dashboard?.total_applications ?? 0} candidature(s) envoyée(s) · {dashboard?.active_sessions ?? 0} session(s) active(s)
              </p>
            </div>
          </div>
        </header>

        {error ? (
          <div className="mb-5 rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <section className="app-stats-grid mb-5">
          <StatCard
            id="stat-total-applications"
            label="Candidatures envoyées"
            value={dashboard?.total_applications ?? 0}
            icon={<Send size={20} />}
            color="orange"
          />
          <StatCard
            id="stat-success-rate"
            label="Taux de succès"
            value={(dashboard?.success_rate ?? 0).toFixed(1)}
            unit="%"
            icon={<Percent size={20} />}
            color="green"
          />
          <StatCard
            id="stat-active-sessions"
            label="Sessions actives"
            value={dashboard?.active_sessions ?? 0}
            icon={<Activity size={20} />}
            color="blue"
          />
          <StatCard
            id="stat-total-earned"
            label="Gains totaux"
            value={formatCurrency(dashboard?.total_earned ?? 0)}
            icon={<BadgeEuro size={20} />}
            color="violet"
          />
        </section>

        <section className="mb-5 space-y-3">
          <QuickAction
            icon="📋"
            title="Mes candidatures"
            description="Voir le statut de tes candidatures"
            onClick={() => navigate('/pro/applications')}
          />
          <QuickAction
            icon="🎯"
            title="Explorer les missions"
            description="Trouve ta prochaine mission"
            onClick={() => navigate('/missions')}
          />
          <QuickAction
            icon="💬"
            title="Mes messages"
            description="Accéder à mes conversations"
            onClick={() => navigate('/pro/conversations')}
          />
          <QuickAction
            icon="⚙️"
            title="Paramètres"
            description="Sécurité et préférences du compte"
            onClick={() => navigate('/settings')}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div id="chart-applications-over-time" className="app-card p-5">
            <MiniLineChart
              data={chartData}
              label="Mes candidatures"
              color="#38bdf8"
              id="mini-line-chart-applications"
            />
          </div>

          <div className="app-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Dernières candidatures</h2>
                <p className="text-xs text-white/45">5 dernières actions côté pro</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/pro/applications')}
                className="inline-flex min-h-[44px] items-center justify-center px-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-300 transition hover:text-orange-200"
              >
                Tout voir
              </button>
            </div>

            {recentApplications.length === 0 ? (
              <div id="recent-applications-list">
                <EmptyState
                  icon="🎯"
                  title="Trouvez votre première mission"
                  description="Vos candidatures récentes apparaîtront ici, avec le suivi de statut et l’accès rapide au chat."
                  action={{ label: 'Explorer les missions', onClick: () => navigate('/missions') }}
                  className="px-4 py-8"
                />
              </div>
            ) : (
              <div id="recent-applications-list" className="space-y-3">
                {recentApplications.map((application) => (
                  <div key={application.id} className="recent-application-item app-card-soft p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-white">{application.mission_title}</p>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${applicationStatusClass(application.status)}`}>
                            {applicationStatusLabel(application.status)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-orange-200">
                          {application.budget !== null ? formatCurrency(application.budget) : 'Budget non renseigné'}
                        </p>
                        <p className="mt-2 text-xs text-white/50">
                          Candidature du {formatLongDate(application.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/missions/${application.mission_id}`)}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
                      >
                        Voir la mission
                      </button>
                      {application.session_id ? (
                        <button
                          id={`btn-open-chat-${application.session_id}`}
                          type="button"
                          onClick={() => navigate(`/chat/${application.session_id}`)}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1.5 text-sm font-medium text-orange-200 transition hover:bg-orange-400/15"
                        >
                          Ouvrir le chat
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section
          id="pro-rating-display"
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
                  <p className="text-xs text-white/45">{ratingCount} avis</p>
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
