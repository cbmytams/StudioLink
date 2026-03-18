import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock3, Plus, Users, Wallet } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useMissions } from '@/hooks/useMissions';
import { applicationService } from '@/services/applicationService';
import { useToast } from '@/components/ui/Toast';
import type { MissionStatus } from '@/types/backend';

const FILTER_TABS: { key: MissionStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'published', label: 'Publiées' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'completed', label: 'Terminées' },
  { key: 'draft', label: 'Brouillons' },
  { key: 'cancelled', label: 'Annulées' },
];

const STATUS_BADGE: Record<MissionStatus, 'default' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  published: 'success',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
};

const STATUS_LABEL: Record<MissionStatus, string> = {
  draft: 'Brouillon',
  published: 'Publiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

function parsePrice(value: string | null) {
  if (!value) return 0;
  const amount = Number.parseInt(value.replace(/[^\d]/g, ''), 10);
  return Number.isNaN(amount) ? 0 : amount;
}

export default function StudioDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [activeFilter, setActiveFilter] = useState<MissionStatus | 'all'>('all');
  const studioId = profile?.id;

  const { data: missions = [], isLoading, error, refetch } = useMissions(studioId);

  const { data: pendingApplications = 0 } = useQuery({
    queryKey: ['applications', 'studio-pending', studioId, missions.map((m) => m.id).join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        missions.map((mission) => applicationService.getMissionApplications(mission.id)),
      );
      return results.flat().filter((application) => application.status === 'pending').length;
    },
    enabled: Boolean(studioId) && missions.length > 0,
  });

  useEffect(() => {
    const state = location.state as { toast?: string } | null;
    if (!state?.toast) return;
    showToast({ title: state.toast, variant: 'default' });
    window.history.replaceState({}, document.title);
  }, [location.state, showToast]);

  const filteredMissions = useMemo(() => (
    activeFilter === 'all'
      ? missions
      : missions.filter((mission) => mission.status === activeFilter)
  ), [activeFilter, missions]);

  const publishedCount = missions.filter((mission) => mission.status === 'published').length;
  const revenue = missions
    .filter((mission) => mission.status === 'completed')
    .reduce((total, mission) => total + parsePrice(mission.price), 0);

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-4 pb-24">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard Studio</h1>
          <p className="text-sm text-stone-500">Pilotage missions, candidatures et progression.</p>
        </div>
        <Button onClick={() => navigate('/studio/missions/create')} className="gap-2">
          <Plus size={16} />
          Créer une mission
        </Button>
      </header>

      <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <GlassCard className="p-4">
          <p className="text-xs text-stone-500">Missions publiées</p>
          <p className="mt-1 text-2xl font-semibold">{publishedCount}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-orange-600" />
            <p className="text-xs text-stone-500">Candidatures en attente</p>
          </div>
          <p className="mt-1 text-2xl font-semibold">{pendingApplications}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2">
            <Wallet size={14} className="text-emerald-600" />
            <p className="text-xs text-stone-500">Revenus missions terminées</p>
          </div>
          <p className="mt-1 text-2xl font-semibold">{revenue} €</p>
        </GlassCard>
      </section>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveFilter(tab.key)}
            className={`flex min-h-[44px] flex-shrink-0 items-center rounded-full px-3 text-xs font-medium transition-colors ${
              activeFilter === tab.key
                ? 'bg-orange-500 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      ) : error ? (
        <GlassCard className="p-6 text-center">
          <p className="text-sm text-stone-600">Impossible de charger les missions.</p>
          <Button variant="ghost" className="mt-3" onClick={() => void refetch()}>
            Réessayer
          </Button>
        </GlassCard>
      ) : filteredMissions.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Clock3 size={20} className="mx-auto mb-2 text-stone-400" />
          <p className="text-sm text-stone-600">Aucune mission pour ce filtre.</p>
          <Button className="mt-4" onClick={() => navigate('/studio/missions/create')}>
            Créer une mission
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filteredMissions.map((mission) => (
            <div key={mission.id}>
              <GlassCard
                className="cursor-pointer p-4 transition-colors hover:bg-white/75"
                onClick={() => navigate(`/studio/missions/${mission.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{mission.service_type}</p>
                    <p className="truncate text-xs text-stone-500">
                      {mission.artist_name || 'Confidentiel'} · {mission.location || 'Paris'}
                    </p>
                    <p className="mt-1 text-sm font-medium">{mission.price || 'À négocier'}</p>
                  </div>
                  <Badge variant={STATUS_BADGE[mission.status]}>
                    {STATUS_LABEL[mission.status]}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                  <span>{mission.genres.join(', ') || 'Genre non renseigné'}</span>
                  <span>{mission.candidates_count} candidature(s)</span>
                </div>
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-[44px]"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/studio/missions/${mission.id}/applications`);
                    }}
                  >
                    Voir les candidatures
                  </Button>
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
