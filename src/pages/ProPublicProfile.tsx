import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useReviews } from '@/hooks/useReviews';

type ProProfile = {
  id: string
  full_name: string | null
  username: string | null
  bio: string | null
  city: string | null
  daily_rate: number | null
  skills: string[] | null
  avatar_url: string | null
  type: string
}

type PortfolioItem = {
  id: string
  title: string
  description: string | null
  url: string
  image_url: string | null
  created_at: string
}

export function ProPublicProfile() {
  const navigate = useNavigate();
  const { proId } = useParams<{ proId: string }>();

  const [proProfile, setProProfile] = useState<ProProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const { data: reviews = [] } = useReviews(proId);

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
          .select('id, full_name, username, bio, city, daily_rate, skills, avatar_url, type')
          .eq('id', proId)
          .eq('type', 'pro')
          .single();

        if (!data) {
          setNotFound(true);
        } else {
          setProProfile(data as unknown as ProProfile);
          const { data: portfolioRows } = await supabase
            .from('portfolio_items' as never)
            .select('id, title, description, url, image_url, created_at')
            .eq('pro_id', proId)
            .order('created_at', { ascending: false });
          setPortfolioItems((portfolioRows ?? []) as PortfolioItem[]);
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
    (proProfile?.skills?.length ?? 0) > 0 ||
    portfolioItems.length > 0 ||
    reviews.length > 0,
  );
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length)
    : null;

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
            {proProfile.avatar_url ? (
              <img
                src={proProfile.avatar_url}
                alt="Avatar pro"
                className="w-16 h-16 rounded-full border border-white/50 object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-2xl font-semibold text-white">
                {proProfile.full_name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
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
            <section className="app-card-soft p-4 mt-4">
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Avis</p>
              {averageRating !== null ? (
                <p className="text-sm text-black/70 mb-3">
                  Note moyenne : <span className="font-semibold text-orange-700">{averageRating.toFixed(1)} / 5</span> ({reviews.length} avis)
                </p>
              ) : (
                <p className="text-sm app-muted">Aucun avis pour le moment.</p>
              )}
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="rounded-xl border border-white/50 bg-white/70 p-3 mt-2">
                  <p className="text-sm font-medium text-orange-700">{'★'.repeat(review.rating)}</p>
                  {review.comment ? <p className="text-sm text-black/70 mt-1">{review.comment}</p> : null}
                  <p className="text-xs app-muted mt-1">{new Date(review.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              ))}
            </section>
            {portfolioItems.length > 0 ? (
              <section className="app-card-soft p-4 mt-4">
                <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Portfolio</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {portfolioItems.map((item) => (
                    <div key={item.id} className="rounded-xl border border-white/50 bg-white/70 p-3">
                      <p className="text-sm font-medium text-black/80">{item.title}</p>
                      {item.description ? <p className="text-xs text-black/60 mt-1">{item.description}</p> : null}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-orange-600 underline mt-2 block"
                      >
                        Ouvrir le projet
                      </a>
                    </div>
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
