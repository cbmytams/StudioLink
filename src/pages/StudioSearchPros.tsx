import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';

type ProResult = {
  id: string
  full_name: string | null
  username: string | null
  bio: string | null
  city: string | null
  daily_rate: number | null
  skills: string[] | null
  avatar_url: string | null
}

export default function StudioSearchPros() {
  const navigate = useNavigate();
  const [pros, setPros] = useState<ProResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [maxRate, setMaxRate] = useState('');

  useEffect(() => {
    let active = true;

    const fetchPros = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseSelect = 'id, full_name, username, bio, city, daily_rate, skills, avatar_url, user_type';
        const primary = await supabase
          .from('profiles')
          .select(baseSelect)
          .eq('user_type', 'pro');

        if (primary.error) throw primary.error;
        if (!active) return;
        setPros((primary.data ?? []) as ProResult[]);
      } catch (primaryError) {
        try {
          const fallback = await supabase
            .from('profiles')
            .select('id, full_name, username, bio, city, daily_rate, skills, avatar_url, type')
            .eq('type', 'pro');
          if (fallback.error) throw fallback.error;
          if (!active) return;
          setPros((fallback.data ?? []) as ProResult[]);
        } catch (fetchError) {
          if (!active) return;
          setError(fetchError instanceof Error ? fetchError.message : 'Impossible de charger les profils pro.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchPros();

    return () => {
      active = false;
    };
  }, []);

  const allSkills = useMemo(
    () => Array.from(
      new Set(
        pros.flatMap((pro) => pro.skills ?? []),
      ),
    ).sort((a, b) => a.localeCompare(b, 'fr')),
    [pros],
  );

  const filteredPros = useMemo(
    () => pros.filter((pro) => {
      if (selectedSkill && !(pro.skills ?? []).includes(selectedSkill)) return false;
      if (cityFilter && !(pro.city ?? '').toLowerCase().includes(cityFilter.toLowerCase())) return false;
      if (maxRate) {
        const parsedRate = Number(maxRate);
        if (!Number.isNaN(parsedRate) && pro.daily_rate !== null && pro.daily_rate > parsedRate) return false;
      }
      return true;
    }),
    [cityFilter, maxRate, pros, selectedSkill],
  );

  return (
    <div className="app-shell">
      <div className="app-container-wide">
        <button
          type="button"
          onClick={() => navigate('/studio/dashboard')}
          className="mb-5 text-sm app-muted transition-colors hover:text-black"
        >
          ← Retour au dashboard
        </button>

        <header className="mb-5">
          <h1 className="app-title">Trouver des pros</h1>
          <p className="app-subtitle">{filteredPros.length} profil(s) trouvé(s)</p>
        </header>

        <section className="app-card p-4 mb-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              value={cityFilter}
              onChange={(event) => setCityFilter(event.target.value)}
              placeholder="Ville"
              className="w-full glass-input rounded-xl px-4 py-3 text-stone-900 placeholder:text-stone-400"
            />
            <input
              value={maxRate}
              onChange={(event) => setMaxRate(event.target.value)}
              inputMode="numeric"
              placeholder="Tarif max (€)"
              className="w-full glass-input rounded-xl px-4 py-3 text-stone-900 placeholder:text-stone-400"
            />
            <button
              type="button"
              onClick={() => {
                setSelectedSkill('');
                setCityFilter('');
                setMaxRate('');
              }}
              className="min-h-[44px] rounded-xl border border-black/10 bg-white/70 px-4 text-sm font-medium text-black/70 transition hover:bg-white"
            >
              Réinitialiser
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedSkill('')}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                selectedSkill === '' ? 'bg-orange-500 text-white' : 'app-chip'
              }`}
            >
              Toutes compétences
            </button>
            {allSkills.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => setSelectedSkill(skill)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  selectedSkill === skill ? 'bg-orange-500 text-white' : 'app-chip'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="app-card p-6 flex items-center justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
          </div>
        ) : error ? (
          <div className="app-card p-6">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : filteredPros.length === 0 ? (
          <div className="app-card p-6 text-center">
            <p className="text-sm app-muted">Aucun pro ne correspond aux filtres.</p>
          </div>
        ) : (
          <div className="app-list">
            {filteredPros.map((pro) => (
              <div key={pro.id} className="app-card-soft p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {pro.avatar_url ? (
                      <img
                        src={pro.avatar_url}
                        alt="Avatar pro"
                        className="h-12 w-12 rounded-full border border-white/50 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white">
                        {(pro.full_name ?? pro.username ?? '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-black/85">{pro.full_name ?? pro.username ?? 'Anonyme'}</p>
                      <p className="text-xs app-muted">
                        {pro.city ?? 'Ville non renseignée'}
                        {pro.daily_rate ? ` · ${pro.daily_rate}€/j` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/pro/public/${pro.id}`)}
                    className="rounded-lg border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-black/80 transition hover:bg-white"
                  >
                    Voir profil →
                  </button>
                </div>

                {pro.bio ? <p className="mt-3 text-sm text-black/70">{pro.bio}</p> : null}
                {(pro.skills ?? []).length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(pro.skills ?? []).slice(0, 6).map((skill) => (
                      <span key={skill} className="app-chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

