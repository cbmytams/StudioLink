import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';

type PublicProProfile = {
  id: string
  full_name: string | null
  bio: string | null
  city: string | null
  daily_rate: number | null
  skills: string[] | null
  avatar_url: string | null
  type: string
};

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
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('id, full_name, bio, city, daily_rate, skills, avatar_url, type')
          .eq('id', id)
          .eq('type', 'pro')
          .maybeSingle();

        if (queryError) throw queryError;
        if (!active) return;
        setProfile((data as PublicProProfile | null) ?? null);
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

  const displayName = profile?.full_name ?? 'Profil pro';
  const hasSkills = (profile?.skills?.length ?? 0) > 0;

  return (
    <div className="app-shell min-h-screen pb-24">
      <Helmet>
        <title>{profile ? `${displayName} — StudioLink` : 'Profil public — StudioLink'}</title>
        <meta name="description" content="Consultez le profil public d’un pro sur StudioLink." />
        <meta property="og:title" content={profile ? `${displayName} — StudioLink` : 'Profil public — StudioLink'} />
        <meta property="og:description" content="Consultez les compétences et le profil public d’un pro sur StudioLink." />
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

        {!loading && !error && !profile ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">👤</p>
            <p className="text-gray-500 text-sm">Ce profil n&apos;existe pas ou n&apos;est plus disponible.</p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-orange-500 text-sm hover:underline mt-2 block mx-auto"
            >
              Retour
            </button>
          </div>
        ) : null}

        {!loading && !error && profile ? (
          <>
            <header>
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

              <h1 className="text-2xl font-bold text-gray-900 mt-3">{displayName}</h1>
              <p className="text-sm text-gray-400 mt-1">
                {profile.city ? <span>{profile.city}</span> : null}
                {profile.city && profile.daily_rate ? <span> · </span> : null}
                {profile.daily_rate ? (
                  <span className="text-orange-500 font-medium">{profile.daily_rate} €/j</span>
                ) : null}
              </p>
            </header>

            <section className="mt-8">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">À propos</h2>
              {profile.bio ? (
                <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">Aucune bio renseignée.</p>
              )}
            </section>

            {hasSkills ? (
              <section className="mt-6">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Compétences</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.map((skill) => (
                    <span
                      key={skill}
                      className="bg-orange-50 text-orange-600 text-xs px-2 py-0.5 rounded-full"
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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#f4ece4] border-t border-black/5">
          <div className="mx-auto max-w-lg">
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                navigate('/studio/new-conversation', {
                  state: { proId: profile.id, proName: profile.full_name },
                });
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-2xl transition-colors"
            >
              Contacter ce pro
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
