import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/supabase/auth';
import { getPublicProfile, getPublicProfileDisplayName, type PublicProfileRecord } from '@/services/publicProfileService';

type PublicProProfile = PublicProfileRecord;

export default function ProPublicProfile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { session, profile: viewerProfile } = useAuth();
  const user = session?.user ?? null;
  const viewerType = (viewerProfile as { user_type?: 'studio' | 'pro' | null; type?: 'studio' | 'pro' | null } | null)?.user_type
    ?? (viewerProfile as { user_type?: 'studio' | 'pro' | null; type?: 'studio' | 'pro' | null } | null)?.type
    ?? null;

  const [profile, setProfile] = useState<PublicProProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      if (!id) {
        if (active) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getPublicProfile(id);
        if (!active) return;
        setProfile(data?.role === 'pro' ? data : null);
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Impossible de charger ce profil.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchProfile();
    return () => {
      active = false;
    };
  }, [id]);

  const displayName = getPublicProfileDisplayName(profile);
  const hasSkills = (profile?.skills.length ?? 0) > 0;
  const ratingText = profile?.rating_avg
    ? `${profile.rating_avg.toFixed(1)} · ${profile.rating_count} avis`
    : null;

  return (
    <div className="app-shell min-h-screen pb-24">
      <Helmet>
        <title>{profile ? `${displayName} — StudioLink` : 'Profil public — StudioLink'}</title>
        <meta name="description" content="Consultez le profil public d’un pro sur StudioLink." />
        <meta property="og:title" content={profile ? `${displayName} — StudioLink` : 'Profil public — StudioLink'} />
        <meta property="og:description" content="Consultez les compétences et le profil public d’un pro sur StudioLink." />
      </Helmet>

      <div className="app-container-compact pb-28">
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

        {!loading && !error && !profile ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">👤</p>
            <p className="text-white/55 text-sm">Ce profil n&apos;existe pas ou n&apos;est plus disponible.</p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-2 block mx-auto text-sm text-orange-300 hover:underline"
            >
              Retour
            </button>
          </div>
        ) : null}

        {!loading && !error && profile ? (
          <>
            <header className="app-card p-6">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
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
              <p className="mt-2 text-sm text-white/65">
                {profile.location ? <span>{profile.location}</span> : null}
                {profile.location && profile.daily_rate ? <span> · </span> : null}
                {profile.daily_rate ? (
                  <span className="font-medium text-orange-300">{profile.daily_rate} €/j</span>
                ) : null}
              </p>
              {ratingText ? (
                <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
                  {ratingText}
                </div>
              ) : null}
            </header>

            <section className="mt-5 app-card p-5">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">À propos</h2>
              {profile.bio ? (
                <p className="text-sm leading-relaxed text-white/72">{profile.bio}</p>
              ) : (
                <p className="text-sm italic text-white/45">Aucune bio renseignée.</p>
              )}
            </section>

            {hasSkills ? (
              <section className="mt-5 app-card p-5">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">Compétences</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-orange-400/30 bg-orange-500/12 px-2.5 py-1 text-xs text-orange-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>

      {!loading && !error && profile && (!user || viewerType === 'studio') ? (
        <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#10101b]/92 p-4 pb-safe backdrop-blur-xl">
          <div className="mx-auto max-w-lg">
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                navigate('/studio/new-conversation', {
                  state: { proId: profile.id, proName: profile.display_name },
                });
              }}
              className="w-full rounded-2xl bg-orange-500 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
            >
              Contacter ce pro
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
