import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { useToast } from '@/components/ui/Toast';
import { applicationService } from '@/services/applicationService';
import { normalizeApplicationStatus } from '@/lib/applications/phase2Compat';
import { chatService } from '@/lib/chat/chatService';
import { getPublicProfileDisplayName, getPublicProfilesMap, type PublicProfileRecord } from '@/services/publicProfileService';
import { toUserFacingErrorMessage } from '@/lib/errors/userFacing';
import type { Database } from '@/types/supabase';

type FilterValue = 'all' | 'pending' | 'accepted' | 'rejected';

type StudioRef = PublicProfileRecord;

type Offer = {
  id: string
  studio_id: string
  title: string | null
  city: string | null
  location: string | null
  daily_rate: number | null
  studio: StudioRef | null
};

type Application = {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  mission_id: string
  offer: Offer | null
};

type OfferRow = Pick<
Database['public']['Tables']['missions']['Row'],
'id' | 'studio_id' | 'title' | 'city' | 'location' | 'daily_rate'
>;

type ApplicationRow = Pick<
Database['public']['Tables']['applications']['Row'],
'id' | 'status' | 'created_at' | 'applied_at' | 'mission_id'
>;

const FILTERS: Array<{ label: string; value: FilterValue }> = [
  { label: 'Toutes', value: 'all' },
  { label: 'En attente', value: 'pending' },
  { label: 'Acceptées', value: 'accepted' },
  { label: 'Refusées', value: 'rejected' },
];

const STATUS_CONFIG: Record<Application['status'], { label: string; className: string }> = {
  pending: {
    label: 'En attente',
    className: 'bg-yellow-50 text-yellow-600 border border-yellow-200',
  },
  accepted: {
    label: 'Acceptée',
    className: 'bg-green-50 text-green-600 border border-green-200',
  },
  rejected: {
    label: 'Refusée',
    className: 'bg-red-50 text-red-500 border border-red-200',
  },
};

function budgetLabel(offer: Offer | null): string {
  if (!offer) return 'Budget non renseigné';
  if (offer.daily_rate !== null) {
    return `${offer.daily_rate} €/j`;
  }
  return 'Budget non renseigné';
}

export default function ProApplications() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { showToast } = useToast();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [sessionIdsByMission, setSessionIdsByMission] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    const fetchApplications = async () => {
      const userId = session?.user?.id;
      if (!userId) {
        if (!active) return;
        setApplications([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data: applicationRows, error: fetchError } = await supabase
          .from('applications')
          .select('id, status, created_at, applied_at, mission_id')
          .eq('pro_id', userId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        if (!active) return;

        const rawApplications: ApplicationRow[] = applicationRows ?? [];
        const missionIds = Array.from(new Set(rawApplications.map((row) => row.mission_id)));
        let offersByMissionId = new Map<string, OfferRow>();

        if (missionIds.length > 0) {
          const { data: missionRows, error: missionError } = await supabase
            .from('missions')
            .select('id, studio_id, title, city, location, daily_rate')
            .in('id', missionIds);
          if (missionError) throw missionError;

          offersByMissionId = new Map<string, OfferRow>(
            (missionRows ?? []).map((mission) => [mission.id, mission]),
          );
        }

        const studioIds = Array.from(new Set(
          Array.from(offersByMissionId.values()).map((offer) => offer.studio_id),
        ));
        const studiosById = await getPublicProfilesMap(studioIds);

        const mapped = rawApplications.map((row) => {
          const rawOffer = offersByMissionId.get(row.mission_id) ?? null;

          return {
            id: row.id,
            status: normalizeApplicationStatus(row.status),
            created_at: row.created_at ?? row.applied_at,
            mission_id: row.mission_id,
            offer: rawOffer
              ? {
                id: rawOffer.id,
                studio_id: rawOffer.studio_id,
                title: rawOffer.title,
                city: rawOffer.city,
                location: rawOffer.location,
                daily_rate: rawOffer.daily_rate,
                studio: studiosById.get(rawOffer.studio_id) ?? null,
              }
              : null,
          } satisfies Application;
        });

        setApplications(mapped);

        if (mapped.length === 0) {
          setSessionIdsByMission({});
          return;
        }

        const mappedMissionIds = mapped.map((application) => application.mission_id);
        const { data: sessionRows, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, mission_id')
          .eq('pro_id', userId)
          .in('mission_id', mappedMissionIds);

        if (sessionsError) throw sessionsError;
        if (!active) return;

        const nextSessions = ((sessionRows as Array<{ id: string; mission_id: string }> | null) ?? []).reduce<Record<string, string>>(
          (acc, row) => {
            acc[row.mission_id] = row.id;
            return acc;
          },
          {},
        );
        setSessionIdsByMission(nextSessions);
      } catch (fetchError) {
        if (!active) return;
        setApplications([]);
        setSessionIdsByMission({});
        setError(toUserFacingErrorMessage(fetchError, 'Impossible de charger les candidatures.'));
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchApplications();

    const userId = session?.user?.id;
    if (!userId) {
      return () => {
        active = false;
      };
    }

    const channel = supabase
      .channel(`pro-applications:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'applications',
        filter: `pro_id=eq.${userId}`,
      }, () => {
        void fetchApplications();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sessions',
        filter: `pro_id=eq.${userId}`,
      }, () => {
        void fetchApplications();
      })
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const handleWithdraw = async (applicationId: string) => {
    if (!window.confirm('Retirer cette candidature ?')) {
      return;
    }

    setWithdrawingId(applicationId);
    setError(null);
    try {
      await applicationService.withdrawApplication(applicationId);
      setApplications((previous) => previous.filter((application) => application.id !== applicationId));
      showToast({ title: 'Candidature retirée', variant: 'default' });
    } catch (withdrawError) {
      const message = toUserFacingErrorMessage(withdrawError, 'Impossible de retirer la candidature.');
      setError(message);
      showToast({ title: 'Retrait impossible', description: message, variant: 'destructive' });
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleOpenChat = async (missionId: string, existingSessionId?: string) => {
    try {
      const sessionId = existingSessionId ?? (await chatService.getOrCreateSession(missionId)).id;
      navigate(`/chat/${sessionId}`);
    } catch (chatError) {
      const message = toUserFacingErrorMessage(chatError, "Impossible d'ouvrir le chat.");
      setError(message);
      showToast({ title: 'Chat indisponible', description: message, variant: 'destructive' });
    }
  };

  const filteredApplications = useMemo(
    () => (activeFilter === 'all'
      ? applications
      : applications.filter((application) => application.status === activeFilter)),
    [activeFilter, applications],
  );

  const hasApplications = applications.length > 0;

  return (
    <div className="app-shell">
      <Helmet>
        <title>Mes candidatures — StudioLink</title>
        <meta
          name="description"
          content="Suivez toutes vos candidatures et leur statut depuis votre espace pro StudioLink."
        />
      </Helmet>
      <div className="app-container-compact">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex min-h-[44px] items-center px-1 text-sm app-muted transition-colors hover:text-black"
        >
          ← Mes candidatures
        </button>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
                  className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
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
          {filteredApplications.length} candidature{filteredApplications.length > 1 ? 's' : ''}
        </p>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/50 bg-white p-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-stone-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 rounded bg-stone-200" />
                    <div className="h-3 w-40 rounded bg-stone-200" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-stone-200" />
                </div>
                <div className="mt-3 h-3 w-3/4 rounded bg-stone-200" />
              </div>
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}

        {!loading && !error && !hasApplications ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 text-sm">Tu n&apos;as pas encore postulé à une offre.</p>
            <button
              type="button"
              onClick={() => navigate('/pro/feed')}
              className="mt-3 inline-flex min-h-[44px] items-center justify-center px-2 text-orange-500 text-sm hover:underline"
            >
              Voir les offres disponibles
            </button>
          </div>
        ) : null}

        {!loading && !error && hasApplications && filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">Aucune candidature dans cette catégorie.</p>
          </div>
        ) : null}

        {!loading && !error && filteredApplications.length > 0 ? (
          <div id="applications-list" className="app-list">
            {filteredApplications.map((application) => {
              const status = STATUS_CONFIG[application.status];
                  const studioName = getPublicProfileDisplayName(application.offer?.studio);
              const offerTitle = application.offer?.title ?? 'Offre supprimée';
              const studioAvatar = application.offer?.studio?.avatar_url ?? null;
              const offerLocation = application.offer?.city ?? application.offer?.location;
              const applicationDate = new Date(application.created_at).toLocaleDateString('fr-FR');
              const sessionId = sessionIdsByMission[application.mission_id];

              return (
                <div
                  key={application.id}
                  className="application-card w-full rounded-2xl border border-white/50 bg-white p-4 text-left transition-colors hover:bg-orange-50"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (application.offer?.id) {
                        navigate(`/pro/offer/${application.offer.id}`);
                        return;
                      }
                      navigate(`/mission/${application.mission_id}`);
                    }}
                    className="w-full text-left"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {studioAvatar ? (
                        <img
                          src={studioAvatar}
                          alt={studioName}
                          className="h-8 w-8 rounded-full object-cover border border-white/50"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                          <span className="text-xs font-bold text-orange-600">
                            {studioName.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">{studioName}</p>
                      <span className={`application-status-badge rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 truncate">{offerTitle}</p>

                    <p className="mt-2 text-xs text-gray-400">
                      {offerLocation ? `${offerLocation} · ` : ''}
                      {budgetLabel(application.offer)}
                      {' · '}
                      {applicationDate}
                    </p>
                  </button>
                  {application.status === 'pending' ? (
                    <button
                      id={`btn-withdraw-${application.id}`}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleWithdraw(application.id);
                      }}
                      disabled={withdrawingId === application.id}
                      className={`mt-3 inline-flex min-h-[44px] items-center px-2 text-xs font-medium ${
                        withdrawingId === application.id
                          ? 'text-stone-400'
                          : 'text-orange-500 hover:underline'
                      }`}
                    >
                      {withdrawingId === application.id ? 'Retrait...' : 'Retirer'}
                    </button>
                  ) : null}
                  {application.status === 'accepted' ? (
                    <button
                      id={sessionId ? `btn-open-chat-${sessionId}` : undefined}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleOpenChat(application.mission_id, sessionId);
                      }}
                      className="mt-3 inline-flex min-h-[44px] items-center px-2 text-xs font-medium text-orange-500 hover:underline"
                    >
                      Ouvrir le chat
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
