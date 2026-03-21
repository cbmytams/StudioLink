import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';

type PublicStudioProfile = {
  id: string
  company_name: string | null
  full_name: string | null
  city: string | null
  bio: string | null
  avatar_url: string | null
  type: string | null
  user_type: string | null
};

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
  const value = profile?.type ?? profile?.user_type ?? null;
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
        let profileRow: PublicStudioProfile | null = null;
        const primaryProfile = await supabase
          .from('profiles')
          .select('id, company_name, full_name, city, bio, avatar_url, type, user_type')
          .eq('id', id)
          .maybeSingle();

        if (!primaryProfile.error && primaryProfile.data) {
          profileRow = primaryProfile.data as PublicStudioProfile;
        } else {
          const fallbackProfile = await supabase
            .from('profiles')
            .select('id, company_name, full_name, city, bio, avatar_url, user_type')
            .eq('id', id)
            .eq('user_type', 'studio')
            .maybeSingle();
          if (fallbackProfile.error) throw fallbackProfile.error;
          profileRow = (fallbackProfile.data as PublicStudioProfile | null) ?? null;
        }

        if (!active) return;
        if (!profileRow || !isStudioType(profileRow)) {
          setStudio(null);
          setMissions([]);
          return;
        }

        setStudio(profileRow);

        let missionRows: StudioMission[] = [];
        const primaryMissions = await supabase
          .from('missions')
          .select('id, title, city, daily_rate, status')
          .eq('studio_id', id)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(5);

        if (!primaryMissions.error) {
          missionRows = (primaryMissions.data as StudioMission[] | null) ?? [];
        } else {
          const fallbackMissions = await supabase
            .from('missions')
            .select('id, title, location, budget_min, status')
            .eq('studio_id', id)
            .in('status', ['open', 'published', 'selecting'] as never)
            .order('created_at', { ascending: false })
            .limit(5);
          if (fallbackMissions.error) throw fallbackMissions.error;
          missionRows = (fallbackMissions.data as StudioMission[] | null) ?? [];
        }

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

  const displayName = studio?.company_name ?? studio?.full_name ?? 'Studio';
  const viewerType = (profile as { user_type?: 'studio' | 'pro' | null; type?: 'studio' | 'pro' | null } | null)?.user_type
    ?? (profile as { user_type?: 'studio' | 'pro' | null; type?: 'studio' | 'pro' | null } | null)?.type
    ?? null;
  const canContact = viewerType === 'pro';

  return (
    <div className="app-shell min-h-screen pb-28">
      <Helmet>
        <title>{studio ? `${displayName} — StudioLink` : 'Studio public — StudioLink'}</title>
        <meta name="description" content="Consultez le profil public d’un studio sur StudioLink." />
        <meta property="og:title" content={studio ? `${displayName} — StudioLink` : 'Studio public — StudioLink'} />
        <meta property="og:description" content="Consultez les missions ouvertes et le profil public d’un studio sur StudioLink." />
      </Helmet>

      <div className="app-container-compact">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
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
            <p className="text-gray-500 text-sm">Ce studio n&apos;existe pas ou n&apos;est plus disponible.</p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-orange-500 text-sm hover:underline mt-2 block mx-auto"
            >
              Retour
            </button>
          </div>
        ) : null}

        {!loading && !error && studio ? (
          <>
            <header>
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

              <h1 className="text-2xl font-bold text-gray-900 mt-3">{displayName}</h1>
              {studio.city ? <p className="text-sm text-gray-500 mt-1">{studio.city}</p> : null}
            </header>

            <section className="mt-6 app-card p-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">À propos</h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                {studio.bio?.trim() ? studio.bio : '—'}
              </p>
            </section>

            <section className="mt-4 app-card p-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Missions ouvertes</h2>
              {missions.length === 0 ? (
                <p className="text-sm text-gray-400">Aucune mission ouverte pour le moment.</p>
              ) : (
                <div className="space-y-2">
                  {missions.map((mission) => (
                    <button
                      key={mission.id}
                      type="button"
                      onClick={() => navigate(`/pro/offer/${mission.id}`)}
                      className="w-full rounded-xl border border-white/50 bg-white p-3 text-left transition hover:bg-orange-50"
                    >
                      <p className="text-sm font-medium text-gray-900">{mission.title ?? 'Mission'}</p>
                      <p className="text-xs text-gray-500 mt-1">
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
          </>
        ) : null}
      </div>

      {!loading && !error && studio && canContact ? (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-[#f4ece4] border-t border-black/5">
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
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-2xl transition-colors"
            >
              Contacter ce studio
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
