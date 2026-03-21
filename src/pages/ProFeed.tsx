import { type KeyboardEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';

type StudioProfile = {
  id: string
  full_name: string | null
  company_name: string | null
  avatar_url: string | null
};

type Mission = {
  id: string
  title: string
  city: string | null
  daily_rate: number | null
  skills: string[]
  start_date: string | null
  status: string
  created_at: string
  studio: StudioProfile | null
};

type MissionPrimaryRow = {
  id: string
  title: string | null
  city: string | null
  daily_rate: number | null
  skills: string[] | null
  start_date: string | null
  status: string | null
  created_at: string
  studio: StudioProfile | StudioProfile[] | null
};

type MissionFallbackRow = {
  id: string
  title: string | null
  location: string | null
  budget_min: number | null
  required_skills: string[] | null
  status: string | null
  created_at: string
  studio: StudioProfile | StudioProfile[] | null
};

type AppliedRow = {
  mission_id: string
};

function asSingle<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function relativeDate(value: string): string {
  const now = new Date();
  const created = new Date(value);
  const diffMs = now.getTime() - created.getTime();
  if (Number.isNaN(diffMs)) return '';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return created.toLocaleDateString('fr-FR');
}

export default function ProFeed() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const userId = session?.user?.id ?? null;
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

  const [missions, setMissions] = useState<Mission[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasActiveFilters = useMemo(
    () => [filters.skill, filters.city, filters.max_rate].some((value) => value.trim().length > 0),
    [filters.city, filters.max_rate, filters.skill],
  );

  const updateFilter = useCallback((key: 'skill' | 'city' | 'max_rate', value: string) => {
    const next = new URLSearchParams(searchParams);
    const normalized = value.trim();
    if (normalized) next.set(key, normalized);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const applyFilterOnEnter = useCallback((
    event: KeyboardEvent<HTMLInputElement>,
    key: 'skill' | 'city' | 'max_rate',
    value: string,
  ) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    updateFilter(key, value);
  }, [updateFilter]);

  const fetchMissions = useCallback(async () => {
    if (!userId) {
      setMissions([]);
      setAppliedIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let normalizedMissions: Mission[] = [];
      const skillFilter = (searchParams.get('skill') ?? '').trim();
      const cityFilter = (searchParams.get('city') ?? '').trim();
      const maxRateFilter = (searchParams.get('max_rate') ?? '').trim();

      const baseSelectPrimary = `
        id, title, city, daily_rate, skills, start_date, status, created_at,
        studio:studio_id (id, full_name, company_name, avatar_url)
      `;
      let primaryQuery = supabase
        .from('missions')
        .select(baseSelectPrimary)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (skillFilter) primaryQuery = primaryQuery.contains('skills', [skillFilter]);
      if (cityFilter) primaryQuery = primaryQuery.ilike('city', `%${cityFilter}%`);
      if (maxRateFilter) {
        const maxRate = Number(maxRateFilter);
        if (!Number.isNaN(maxRate)) primaryQuery = primaryQuery.lte('daily_rate', maxRate);
      }

      const primaryResult = await primaryQuery;

      if (!primaryResult.error) {
        normalizedMissions = (primaryResult.data as unknown as MissionPrimaryRow[] | null ?? []).map((row) => ({
          id: row.id,
          title: row.title ?? 'Mission',
          city: row.city ?? null,
          daily_rate: row.daily_rate,
          skills: row.skills ?? [],
          start_date: row.start_date ?? null,
          status: row.status ?? 'open',
          created_at: row.created_at,
          studio: asSingle(row.studio),
        }));
      } else {
        const baseSelectFallback = `
          id, title, location, budget_min, required_skills, status, created_at,
          studio:studio_id (id, full_name, company_name, avatar_url)
        `;
        let fallbackQuery = supabase
          .from('missions')
          .select(baseSelectFallback)
          .eq('status', 'open')
          .order('created_at', { ascending: false });

        if (skillFilter) fallbackQuery = fallbackQuery.contains('required_skills', [skillFilter]);
        if (cityFilter) fallbackQuery = fallbackQuery.ilike('location', `%${cityFilter}%`);
        if (maxRateFilter) {
          const maxRate = Number(maxRateFilter);
          if (!Number.isNaN(maxRate)) fallbackQuery = fallbackQuery.lte('budget_min', maxRate);
        }

        const fallbackResult = await fallbackQuery;
        if (fallbackResult.error) throw fallbackResult.error;

        normalizedMissions = (fallbackResult.data as unknown as MissionFallbackRow[] | null ?? []).map((row) => ({
          id: row.id,
          title: row.title ?? 'Mission',
          city: row.location ?? null,
          daily_rate: row.budget_min,
          skills: row.required_skills ?? [],
          start_date: null,
          status: row.status ?? 'open',
          created_at: row.created_at,
          studio: asSingle(row.studio),
        }));
      }

      const { data: appliedRows, error: appliedError } = await supabase
        .from('applications')
        .select('mission_id')
        .eq('pro_id', userId);
      if (appliedError) throw appliedError;

      const appliedSet = new Set((appliedRows as AppliedRow[] | null ?? []).map((row) => row.mission_id));
      setMissions(normalizedMissions);
      setAppliedIds(appliedSet);
    } catch (fetchError) {
      setMissions([]);
      setAppliedIds(new Set());
      setError(fetchError instanceof Error ? fetchError.message : 'Impossible de charger le feed.');
    } finally {
      setLoading(false);
    }
  }, [searchParams, userId]);

  useEffect(() => {
    void fetchMissions();
  }, [fetchMissions]);

  useEffect(() => {
    setSkillInput(filters.skill);
    setCityInput(filters.city);
    setMaxRateInput(filters.max_rate);
  }, [filters.city, filters.max_rate, filters.skill]);

  useEffect(() => {
    const channel = supabase
      .channel('missions-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'missions',
        filter: 'status=eq.open',
      }, () => {
        void fetchMissions();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchMissions]);

  const profileIdentity = profile as {
    full_name?: string | null
    username?: string | null
    display_name?: string | null
  } | null;
  const greetingName = profileIdentity?.full_name
    ?? profileIdentity?.username
    ?? profileIdentity?.display_name
    ?? 'Pro';

  return (
    <div className="app-shell">
      <Helmet>
        <title>StudioLink — Feed des missions</title>
        <meta
          name="description"
          content="Découvrez les missions ouvertes des studios et postulez rapidement."
        />
      </Helmet>
      <div className="app-container-compact">
        <header className="mb-5">
          <h1 className="app-title">Bonjour, {greetingName} 👋</h1>
          <p className="app-subtitle">{missions.length} mission(s) disponible(s)</p>
        </header>

        <section className="bg-white rounded-2xl border border-white/50 p-3 mb-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              type="text"
              value={skillInput}
              onChange={(event) => setSkillInput(event.target.value)}
              onBlur={() => updateFilter('skill', skillInput)}
              onKeyDown={(event) => applyFilterOnEnter(event, 'skill', skillInput)}
              placeholder="Compétence"
              className="bg-[#f4ece4] border-0 rounded-xl px-3 py-2 text-sm text-gray-700 w-full"
            />
            <input
              type="text"
              value={cityInput}
              onChange={(event) => setCityInput(event.target.value)}
              onBlur={() => updateFilter('city', cityInput)}
              onKeyDown={(event) => applyFilterOnEnter(event, 'city', cityInput)}
              placeholder="Ville"
              className="bg-[#f4ece4] border-0 rounded-xl px-3 py-2 text-sm text-gray-700 w-full"
            />
            <input
              type="number"
              value={maxRateInput}
              onChange={(event) => setMaxRateInput(event.target.value)}
              onBlur={() => updateFilter('max_rate', maxRateInput)}
              onKeyDown={(event) => applyFilterOnEnter(event, 'max_rate', maxRateInput)}
              placeholder="Tarif max (€/j)"
              className="bg-[#f4ece4] border-0 rounded-xl px-3 py-2 text-sm text-gray-700 w-full"
            />
          </div>
        </section>

        <button
          type="button"
          onClick={() => void fetchMissions()}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition-colors mx-auto mb-3"
        >
          ↻ Actualiser
        </button>

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">
            {missions.length} mission{missions.length > 1 ? 's' : ''} disponible{missions.length > 1 ? 's' : ''}
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
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-2xl border border-white/50 p-4 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-stone-200" />
                  <div className="h-3 w-24 rounded bg-stone-200" />
                  <div className="ml-auto h-3 w-16 rounded bg-stone-200" />
                </div>
                <div className="mt-3 h-4 w-3/4 rounded bg-stone-200" />
                <div className="mt-2 h-3 w-1/2 rounded bg-stone-200" />
                <div className="mt-2 h-3 w-2/3 rounded bg-stone-200" />
              </div>
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}

        {!loading && !error && missions.length === 0 && !hasActiveFilters ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-gray-500 text-sm">Aucune mission disponible pour l&apos;instant.</p>
          </div>
        ) : null}

        {!loading && !error && missions.length === 0 && hasActiveFilters ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-500 text-sm">Aucune mission ne correspond à ces critères.</p>
            <button
              type="button"
              onClick={() => setSearchParams({}, { replace: true })}
              className="text-orange-500 text-sm hover:underline mt-2 block mx-auto"
            >
              Effacer les filtres
            </button>
          </div>
        ) : null}

        {!loading && !error && missions.length > 0 ? (
          <div className="app-list">
            {missions.map((mission) => {
              const studioName = mission.studio?.company_name ?? mission.studio?.full_name ?? 'Studio';
              const visibleSkills = mission.skills.slice(0, 3);
              const alreadyApplied = appliedIds.has(mission.id);

              return (
                <button
                  key={mission.id}
                  type="button"
                  onClick={() => navigate(`/pro/offer/${mission.id}`)}
                  className="w-full bg-white rounded-2xl border border-white/50 p-4 text-left cursor-pointer transition-colors hover:bg-orange-50"
                >
                  <div className="flex items-center gap-2">
                    {mission.studio?.avatar_url ? (
                      <img
                        src={mission.studio.avatar_url}
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
                    <p className="text-sm font-semibold text-gray-900">{studioName}</p>
                    <span className="text-xs text-gray-400 ml-auto">{relativeDate(mission.created_at)}</span>
                  </div>

                  <p className="text-base font-bold text-gray-900 mt-1">{mission.title}</p>

                  <p className="text-xs text-gray-500 mt-2">
                    {mission.city ? `📍 ${mission.city}` : '📍 Localisation à définir'}
                    {mission.daily_rate !== null ? ` · 💰 ${mission.daily_rate} €/j` : ''}
                  </p>

                  {visibleSkills.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
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

                  <div className="mt-3 flex justify-end">
                    {alreadyApplied ? (
                      <span className="text-xs text-green-600 font-medium">✓ Candidature envoyée</span>
                    ) : (
                      <span className="text-xs text-orange-500 font-medium">Voir &amp; postuler →</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
