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

export default function ProPublicProfile() {
  const navigate = useNavigate();
  const { proId } = useParams<{ proId: string }>();

  const [proProfile, setProProfile] = useState<ProProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      if (!proId) {
        setProProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('id, full_name, username, bio, city, daily_rate, skills, type')
          .eq('id', proId)
          .eq('type', 'pro')
          .single();

        if (fetchError || !data) {
          setProProfile(null);
          return;
        }

        if (!active) return;
        setProProfile(data as unknown as ProProfile);
      } catch (fetchErr) {
        if (!active) return;
        setError(fetchErr instanceof Error ? fetchErr.message : 'Impossible de charger ce profil');
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchProfile();

    return () => {
      active = false;
    };
  }, [proId]);

  const hasAnyInfo = Boolean(
    proProfile?.bio ||
    proProfile?.city ||
    proProfile?.daily_rate ||
    (proProfile?.skills?.length ?? 0) > 0,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] text-white flex items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] text-white flex items-center justify-center px-4">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!proProfile) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <p className="text-4xl mb-4">👤</p>
            <p className="text-white/40">Profil introuvable.</p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-violet-400 underline text-sm mt-4"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-white/50 hover:text-white text-sm transition-colors"
        >
          ← Retour
        </button>

        <header className="mt-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-2xl font-semibold">
              {proProfile.full_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {proProfile.full_name ?? proProfile.username ?? 'Anonyme'}
              </h1>
              {proProfile.username ? (
                <p className="text-white/40 text-sm">@{proProfile.username}</p>
              ) : null}
              {proProfile.city ? (
                <p className="text-white/50 text-sm mt-1">{proProfile.city}</p>
              ) : null}
            </div>
          </div>
        </header>

        {hasAnyInfo ? (
          <>
            {proProfile.bio ? (
              <section className="bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
                <h2 className="text-sm font-semibold text-white/85 mb-2">Bio</h2>
                <p className="text-sm text-white/70">{proProfile.bio}</p>
              </section>
            ) : null}

            {proProfile.daily_rate ? (
              <section className="bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
                <h2 className="text-sm font-semibold text-white/85 mb-2">Tarif journalier</h2>
                <p className="text-violet-300 font-medium">{proProfile.daily_rate}€/j</p>
              </section>
            ) : null}

            {proProfile.skills?.length ? (
              <section className="bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
                <h2 className="text-sm font-semibold text-white/85 mb-2">Compétences</h2>
                <div className="flex flex-wrap gap-2">
                  {proProfile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-white/10 text-white/80 text-xs px-2 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <p className="text-white/30 text-sm mt-6">Ce profil est incomplet.</p>
        )}
      </div>
    </div>
  );
}

