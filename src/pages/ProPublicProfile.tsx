import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';

type ProProfile = {
  id: string
  full_name: string | null
  username: string | null
  bio: string | null
  city: string | null
  daily_rate: number | null
  skills: string[] | null
  type: string
}

export function ProPublicProfile() {
  const navigate = useNavigate();
  const { proId } = useParams<{ proId: string }>();

  const [proProfile, setProProfile] = useState<ProProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!proId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setNotFound(false);
      setError(null);
      setProProfile(null);

      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, username, bio, city, daily_rate, skills, type')
          .eq('id', proId)
          .eq('type', 'pro')
          .single();

        if (!data) {
          setNotFound(true);
        } else {
          setProProfile(data as unknown as ProProfile);
        }
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Impossible de charger ce profil.');
      }
      setLoading(false);
    };

    void fetchProfile();
  }, [proId]);

  const hasAnyInfo = Boolean(
    proProfile?.bio ||
    proProfile?.city ||
    proProfile?.daily_rate ||
    (proProfile?.skills?.length ?? 0) > 0,
  );

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
      </div>
    );
  }

  if (error && !proProfile && !notFound) {
    return (
      <div className="app-shell">
        <div className="app-container-compact">
          <div className="text-center py-16">
            <p className="text-4xl mb-4">⚠️</p>
            <p className="text-red-500">{error}</p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-orange-600 underline text-sm mt-4 block mx-auto"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !proProfile) {
    return (
      <div className="app-shell">
        <div className="app-container-compact">
          <div className="text-center py-16">
            <p className="text-4xl mb-4">👤</p>
            <p className="app-muted">Profil introuvable.</p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-orange-600 underline text-sm mt-4 block mx-auto"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-container-compact">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm app-muted hover:text-black mb-6 flex items-center gap-1 transition-colors"
        >
          ← Retour
        </button>

        {error ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <header className="mt-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-2xl font-semibold text-white">
              {proProfile.full_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <h1 className="app-title text-2xl">
                {proProfile.full_name ?? proProfile.username ?? 'Anonyme'}
              </h1>
              {proProfile.username ? (
                <p className="app-muted text-sm">@{proProfile.username}</p>
              ) : null}
              {proProfile.city ? (
                <p className="text-sm app-muted mt-1">{proProfile.city}</p>
              ) : null}
            </div>
          </div>
        </header>

        {hasAnyInfo ? (
          <>
            {proProfile.bio ? (
              <section className="app-card-soft p-4 mt-4">
                <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">À propos</p>
                <p className="text-sm text-black/70">{proProfile.bio}</p>
              </section>
            ) : null}

            {proProfile.daily_rate ? (
              <section className="app-card-soft p-4 mt-4">
                <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Tarif journalier</p>
                <p className="text-orange-700 font-medium">{proProfile.daily_rate}€/j</p>
              </section>
            ) : null}

            {proProfile.skills?.length ? (
              <section className="app-card-soft p-4 mt-4">
                <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Compétences</p>
                <div className="flex flex-wrap gap-2">
                  {proProfile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="app-chip"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <p className="app-muted text-sm mt-6">Ce profil est incomplet.</p>
        )}
      </div>
    </div>
  );
}

export default ProPublicProfile;
