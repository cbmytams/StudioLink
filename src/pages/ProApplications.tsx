import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';

type FilterValue = 'all' | 'pending' | 'accepted' | 'rejected';

type StudioRef = {
  id: string
  full_name: string | null
  company_name: string | null
  avatar_url: string | null
};

type Offer = {
  id: string
  title: string | null
  location: string | null
  budget_min: number | null
  budget_max: number | null
  profiles: StudioRef | null
};

type Application = {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  mission_id: string
  offer: Offer | null
};

type OfferRow = {
  id: string
  title: string | null
  location: string | null
  budget_min: number | null
  budget_max: number | null
  profiles: StudioRef | StudioRef[] | null
};

type ApplicationRow = {
  id: string
  status: string | null
  created_at: string
  mission_id: string
  offer: OfferRow | OfferRow[] | null
};

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

function normalizeStatus(value: string | null): Application['status'] {
  if (value === 'accepted' || value === 'selected') return 'accepted';
  if (value === 'rejected') return 'rejected';
  return 'pending';
}

function budgetLabel(offer: Offer | null): string {
  if (!offer) return 'Budget non renseigné';
  if (offer.budget_min !== null && offer.budget_max !== null) {
    return `${offer.budget_min}€ – ${offer.budget_max}€/j`;
  }
  if (offer.budget_min !== null) {
    return `À partir de ${offer.budget_min}€/j`;
  }
  return 'Budget non renseigné';
}

export default function ProApplications() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');

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
        const query: string = `
          id,
          status,
          created_at,
          mission_id,
          offer:mission_id (
            id,
            title,
            location,
            budget_min,
            budget_max,
            profiles:studio_id (
              id,
              full_name,
              company_name,
              avatar_url
            )
          )
        `;

        const { data, error: fetchError } = await supabase
          .from('applications')
          .select(query)
          .eq('pro_id', userId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        if (!active) return;

        const mapped = (data as unknown as ApplicationRow[] | null ?? []).map((row) => {
          const rawOffer = Array.isArray(row.offer) ? row.offer[0] ?? null : row.offer;
          const rawStudio = rawOffer
            ? (Array.isArray(rawOffer.profiles) ? rawOffer.profiles[0] ?? null : rawOffer.profiles)
            : null;

          return {
            id: row.id,
            status: normalizeStatus(row.status),
            created_at: row.created_at,
            mission_id: row.mission_id,
            offer: rawOffer
              ? {
                id: rawOffer.id,
                title: rawOffer.title,
                location: rawOffer.location,
                budget_min: rawOffer.budget_min,
                budget_max: rawOffer.budget_max,
                profiles: rawStudio,
              }
              : null,
          } satisfies Application;
        });

        setApplications(mapped);
      } catch (fetchError) {
        if (!active) return;
        setApplications([]);
        setError(fetchError instanceof Error ? fetchError.message : 'Impossible de charger les candidatures.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchApplications();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

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
          className="mb-4 text-sm app-muted transition-colors hover:text-black"
        >
          ← Mes candidatures
        </button>

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
              className="mt-3 text-orange-500 text-sm hover:underline block mx-auto"
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
          <div className="app-list">
            {filteredApplications.map((application) => {
              const status = STATUS_CONFIG[application.status];
              const studioName = application.offer?.profiles?.company_name
                ?? application.offer?.profiles?.full_name
                ?? 'Studio';
              const offerTitle = application.offer?.title ?? 'Offre supprimée';
              const studioAvatar = application.offer?.profiles?.avatar_url ?? null;
              const offerLocation = application.offer?.location;
              const applicationDate = new Date(application.created_at).toLocaleDateString('fr-FR');

              return (
                <button
                  key={application.id}
                  type="button"
                  onClick={() => {
                    if (application.offer?.id) {
                      navigate(`/pro/offer/${application.offer.id}`);
                      return;
                    }
                    navigate(`/mission/${application.mission_id}`);
                  }}
                  className="w-full rounded-2xl border border-white/50 bg-white p-4 text-left transition-colors hover:bg-orange-50"
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
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
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
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
