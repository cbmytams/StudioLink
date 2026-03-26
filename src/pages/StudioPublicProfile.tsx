import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { getPublicProfile, getPublicProfileDisplayName, type PublicProfileRecord } from '@/services/publicProfileService';

type PublicStudioProfile = PublicProfileRecord;

type StudioMission = {
  id: string
  title: string | null
  city: string | null
  location: string | null
  daily_rate: number | null
  budget_min: number | null
  status: string | null
};

function isStudioType(profile: PublicStudioProfile | null): boolean {
  const value = profile?.role ?? null;
  return value === 'studio';
}

export default function StudioPublicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const user = session?.user ?? null;

  const [studio, setStudio] = useState<PublicStudioProfile | null>(null);
  const [missions, setMissions] = useState<StudioMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      if (!id) {
        if (!active) return;
        setStudio(null);
        setMissions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const profileRow = await getPublicProfile(id);

        if (!active) return;
        if (!profileRow || !isStudioType(profileRow)) {
          setStudio(null);
          setMissions([]);
          return;
        }

        setStudio(profileRow);

        const publicMissions = await supabase.rpc('get_public_studio_missions', {
          p_studio_id: id,
        });
        if (publicMissions.error) throw publicMissions.error;
        const missionRows = (publicMissions.data as StudioMission[] | null) ?? [];

        if (!active) return;
        setMissions(missionRows);
      } catch (fetchError) {
        if (!active) return;
        setStudio(null);
        setMissions([]);
        setError(fetchError instanceof Error ? fetchError.message : 'Impossible de charger ce studio.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchData();
    return () => {
      active = false;
    };
  }, [id]);

  const displayName = getPublicProfileDisplayName(studio);
  const ratingText = studio?.rating_avg
    ? `${studio.rating_avg.toFixed(1)} · ${studio.rating_count} avis`
    : null;
  const viewerType = (profile as { user_type?: 'studio' | 'pro' | null; type?: 'studio' | 'pro' | null } | null)?.user_type
    ?? (profile as { user_type?: 'studio' | 'pro' | null; type?: 'studio' | 'pro' | null } | null)?.type
    ?? null;
  const canContact = viewerType === 'pro';

  return (
    <div className="app-shell min-h-[100dvh] pb-28">
      <Helmet>
        <title>{studio ? `${displayName} — StudioLink` : 'Studio public — StudioLink'}</title>
        <meta name="description" content="Consultez le profil public d’un studio sur StudioLink." />
        <meta property="og:title" content={studio ? `${displayName} — StudioLink` : 'Studio public — StudioLink'} />
        <meta property="og:description" content="Consultez les missions ouvertes et le profil public d’un studio sur StudioLink." />
      </Helmet>

      <div className="app-container-wide pb-28">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1 text-sm text-white/50 transition hover:text-white"
        >
          <span>←</span> Retour
        </button>

        {loading ? (
          <div className="animate-pulse space-y-4 pt-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-200" />
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-gray-200 rounded w-40" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-full mt-6" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}

        {!loading && !error && !studio ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏢</p>
            <p className="text-white/55 text-sm">Ce studio n&apos;existe pas ou n&apos;est plus disponible.</p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-2 block mx-auto text-sm text-orange-300 hover:underline"
            >
              Retour
            </button>
          </div>
        ) : null}

        {!loading && !error && studio ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <header className="app-card p-6">
              {studio.avatar_url ? (
                <img
                  src={studio.avatar_url}
                  alt={displayName}
                  className="w-20 h-20 rounded-full object-cover border border-white/50"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {displayName.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}

              <h1 className="mt-4 text-3xl font-bold text-white">{displayName}</h1>
              {studio.location ? <p className="mt-2 text-sm text-white/65">{studio.location}</p> : null}
              {ratingText ? (
                <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
                  {ratingText}
                </div>
              ) : null}
              </header>

              <section className="app-card p-4">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">À propos</h2>
                <p className="text-sm leading-relaxed text-white/72">
                  {studio.bio?.trim() ? studio.bio : 'Aucune présentation renseignée pour le moment.'}
                </p>
              </section>

              <section className="app-card p-4">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Missions ouvertes</h2>
                {missions.length === 0 ? (
                  <p className="text-sm text-white/45">Aucune mission ouverte pour le moment.</p>
                ) : (
                  <div className="space-y-2">
                    {missions.map((mission) => (
                      <button
                        key={mission.id}
                        type="button"
                        onClick={() => navigate(`/pro/offer/${mission.id}`)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
                      >
                        <p className="text-sm font-medium text-white">{mission.title ?? 'Mission'}</p>
                        <p className="mt-1 text-xs text-white/55">
                          {(mission.city ?? mission.location ?? 'Localisation à définir')}
                          {(mission.daily_rate ?? mission.budget_min) !== null
                            ? ` · ${(mission.daily_rate ?? mission.budget_min)} €/j`
                            : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-5">
              <section className="app-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Vue rapide</p>
                <div className="mt-4 space-y-3 text-sm text-white/70">
                  <div className="flex items-center justify-between gap-3">
                    <span>Localisation</span>
                    <span className="font-medium text-white">{studio.location ?? 'Non renseignée'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Note</span>
                    <span className="font-medium text-white">{ratingText ?? 'Pas encore d’avis'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Missions actives</span>
                    <span className="font-medium text-white">{missions.length}</span>
                  </div>
                </div>
              </section>

              {canContact ? (
                <section className="app-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Action rapide</p>
                  <p className="mt-3 text-sm text-white/60">
                    Ouvrez une conversation immédiatement pour échanger sur une mission active ou un besoin à venir.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        navigate('/login');
                        return;
                      }
                      navigate('/studio/new-conversation', {
                        state: { studioId: studio.id, studioName: displayName },
                      });
                    }}
                    className="mt-4 w-full rounded-2xl bg-orange-500 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    Contacter ce studio
                  </button>
                </section>
              ) : null}
            </aside>
          </div>
        ) : null}
      </div>

      {!loading && !error && studio && canContact ? (
        <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#10101b]/92 p-4 pb-safe backdrop-blur-xl lg:hidden">
          <div className="mx-auto max-w-lg">
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                navigate('/studio/new-conversation', {
                  state: { studioId: studio.id, studioName: displayName },
                });
              }}
              className="w-full rounded-2xl bg-orange-500 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
            >
              Contacter ce studio
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
