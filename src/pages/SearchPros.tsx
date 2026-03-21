import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';

type ProProfile = {
  id: string
  full_name: string | null
  bio: string | null
  city: string | null
  daily_rate: number | null
  skills: string[] | null
  avatar_url: string | null
};

export default function SearchPros() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(
    () => ({
      skill: searchParams.get('skill') ?? '',
      city: searchParams.get('city') ?? '',
      max_rate: searchParams.get('max_rate') ?? '',
    }),
    [searchParams],
  );

  const [skillInput, setSkillInput] = useState(filters.skill);
  const [cityInput, setCityInput] = useState(filters.city);
  const [maxRateInput, setMaxRateInput] = useState(filters.max_rate);

  const [pros, setPros] = useState<ProProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasActiveFilters = useMemo(
    () => [filters.skill, filters.city, filters.max_rate].some((value) => value.trim() !== ''),
    [filters],
  );

  const updateFilter = (key: 'skill' | 'city' | 'max_rate', value: string) => {
    const next = new URLSearchParams(searchParams);
    const normalizedValue = value.trim();
    if (normalizedValue) next.set(key, normalizedValue);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const handleEnterCommit = (
    event: KeyboardEvent<HTMLInputElement>,
    key: 'skill' | 'city' | 'max_rate',
    value: string,
  ) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    updateFilter(key, value);
  };

  useEffect(() => {
    setSkillInput(filters.skill);
    setCityInput(filters.city);
    setMaxRateInput(filters.max_rate);
  }, [filters.city, filters.max_rate, filters.skill]);

  useEffect(() => {
    let active = true;

    const fetchPros = async () => {
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from('profiles')
          .select('id, full_name, bio, city, daily_rate, skills, avatar_url')
          .eq('type', 'pro')
          .order('created_at', { ascending: false });

        if (filters.skill) query = query.contains('skills', [filters.skill]);
        if (filters.city) query = query.ilike('city', `%${filters.city}%`);
        if (filters.max_rate) {
          const parsedRate = Number(filters.max_rate);
          if (!Number.isNaN(parsedRate)) {
            query = query.lte('daily_rate', parsedRate);
          }
        }

        const { data, error: queryError } = await query;
        if (queryError) throw queryError;
        if (!active) return;

        setPros((data as ProProfile[] | null) ?? []);
      } catch (fetchError) {
        if (!active) return;
        setPros([]);
        setError(fetchError instanceof Error ? fetchError.message : 'Impossible de charger les profils.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchPros();
    return () => {
      active = false;
    };
  }, [filters.city, filters.max_rate, filters.skill]);

  return (
    <div className="app-shell pb-24">
      <Helmet>
        <title>Trouver des pros — StudioLink</title>
        <meta name="description" content="Recherchez des professionnels par compétence, ville et tarif." />
      </Helmet>
      <div className="app-container">
        <button
          type="button"
          onClick={() => navigate('/studio/dashboard')}
          className="mb-4 text-sm app-muted transition-colors hover:text-black"
        >
          ← Retour au dashboard
        </button>

        <header className="mb-4">
          <h1 className="app-title">Trouver des pros</h1>
          <p className="app-subtitle">Parcourez les profils disponibles</p>
        </header>

        <section className="bg-white rounded-2xl border border-white/50 p-3 mb-4">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(event) => setSkillInput(event.target.value)}
              onBlur={() => updateFilter('skill', skillInput)}
              onKeyDown={(event) => handleEnterCommit(event, 'skill', skillInput)}
              placeholder="Compétence (ex: montage vidéo)"
              className="bg-[#f4ece4] border-0 rounded-xl px-3 py-2 text-sm text-gray-700 w-full"
            />
            <input
              type="text"
              value={cityInput}
              onChange={(event) => setCityInput(event.target.value)}
              onBlur={() => updateFilter('city', cityInput)}
              onKeyDown={(event) => handleEnterCommit(event, 'city', cityInput)}
              placeholder="Ville"
              className="bg-[#f4ece4] border-0 rounded-xl px-3 py-2 text-sm text-gray-700 w-full"
            />
            <input
              type="number"
              value={maxRateInput}
              onChange={(event) => setMaxRateInput(event.target.value)}
              onBlur={() => updateFilter('max_rate', maxRateInput)}
              onKeyDown={(event) => handleEnterCommit(event, 'max_rate', maxRateInput)}
              placeholder="Tarif max (€/j)"
              className="bg-[#f4ece4] border-0 rounded-xl px-3 py-2 text-sm text-gray-700 w-full col-span-2"
            />
          </div>
        </section>

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">
            {pros.length} pro{pros.length > 1 ? 's' : ''} trouvé{pros.length > 1 ? 's' : ''}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => setSearchParams({}, { replace: true })}
              className="text-xs text-orange-500 hover:underline"
            >
              Réinitialiser les filtres
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-white/50 p-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-stone-200" />
                  <div className="flex-1">
                    <div className="h-4 w-40 bg-stone-200 rounded" />
                    <div className="mt-2 h-3 w-28 bg-stone-200 rounded" />
                  </div>
                </div>
                <div className="mt-3 h-3 w-full bg-stone-200 rounded" />
              </div>
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}

        {!loading && !error && pros.length === 0 && hasActiveFilters ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-500 text-sm">Aucun pro ne correspond à ces critères.</p>
            <button
              type="button"
              onClick={() => setSearchParams({}, { replace: true })}
              className="text-orange-500 text-sm hover:underline mt-2 block mx-auto"
            >
              Effacer les filtres
            </button>
          </div>
        ) : null}

        {!loading && !error && pros.length === 0 && !hasActiveFilters ? (
          <p className="app-empty-state">Aucun pro inscrit pour l&apos;instant</p>
        ) : null}

        {!loading && !error && pros.length > 0 ? (
          <div className="app-list">
            {pros.map((pro) => {
              const displayName = pro.full_name ?? 'Profil pro';
              const visibleSkills = (pro.skills ?? []).slice(0, 3);

              return (
                <button
                  key={pro.id}
                  type="button"
                  onClick={() => navigate(`/pro/public/${pro.id}`)}
                  className="bg-white rounded-2xl border border-white/50 p-4 flex items-center gap-3 w-full text-left hover:bg-orange-50 transition-colors"
                >
                  {pro.avatar_url ? (
                    <img
                      src={pro.avatar_url}
                      alt={displayName}
                      className="w-12 h-12 rounded-full object-cover border border-white/50"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-orange-600">
                        {displayName.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                    {pro.city ? <p className="text-xs text-gray-400">{pro.city}</p> : null}
                    {pro.daily_rate ? (
                      <p className="text-xs text-orange-500 font-medium">{pro.daily_rate} €/j</p>
                    ) : null}
                    {visibleSkills.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {visibleSkills.map((skill) => (
                          <span
                            key={skill}
                            className="bg-orange-50 text-orange-600 text-xs px-2 py-0.5 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <span className="text-gray-300">›</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
