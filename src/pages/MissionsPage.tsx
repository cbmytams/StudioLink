import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MissionCard } from '@/components/search/MissionCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageMeta } from '@/components/shared/PageMeta';
import { useSearch } from '@/hooks/useSearch';
import {
  parseFiltersFromURL,
  searchMissions,
  type MissionFilters,
  type SearchMissionResult,
} from '@/lib/search/searchService';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';

const INITIAL_FILTERS: MissionFilters = {
  status: 'published',
  page: 1,
  limit: 12,
};

const GENRE_OPTIONS = [
  '',
  'Hip-Hop',
  'Rock',
  'Pop',
  'Rap',
  'Électro',
  'Jazz',
  'R&B',
  'Afro',
  'Autre',
];

function formatCount(count: number): string {
  return `${count} mission${count > 1 ? 's' : ''} trouvée${count > 1 ? 's' : ''}`;
}

export default function MissionsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const [appliedMissionIds, setAppliedMissionIds] = useState<Set<string>>(new Set());

  const runSearch = useCallback((filters: MissionFilters) => searchMissions(filters), []);
  const {
    results,
    loading,
    error,
    filters,
    setFilter,
    resetFilters,
    currentPage,
    hasMore,
    nextPage,
    prevPage,
  } = useSearch<SearchMissionResult, MissionFilters>(runSearch, INITIAL_FILTERS, {
    parseFilters: parseFiltersFromURL,
  });

  useEffect(() => {
    let active = true;

    const loadApplied = async () => {
      if (!userId) {
        if (active) setAppliedMissionIds(new Set());
        return;
      }

      const { data, error: queryError } = await supabase
        .from('applications')
        .select('mission_id')
        .eq('pro_id', userId);

      if (!active) return;
      if (queryError) {
        setAppliedMissionIds(new Set());
        return;
      }

      setAppliedMissionIds(
        new Set(((data as Array<{ mission_id: string }> | null) ?? []).map((row) => row.mission_id)),
      );
    };

    void loadApplied();
    return () => {
      active = false;
    };
  }, [userId]);

  const hasActiveFilters = Boolean(
    filters.query
    || filters.genre
    || filters.location
    || filters.budgetMin
    || filters.budgetMax,
  );

  return (
    <main className="app-shell pb-24">
      <PageMeta
        title="Missions disponibles"
        description="Trouvez des missions de production musicale avec recherche full-text et filtres persistés."
        canonicalPath="/missions"
      />

      <div className="app-container-wide pt-20 md:pt-24">
        <header className="app-header">
          <div>
            <h1 className="app-title">Explorer les missions</h1>
            <p className="app-subtitle">Recherche plein texte, filtres rapides et pagination.</p>
          </div>
        </header>

        <section className="app-card p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input
              id="search-input-missions"
              type="search"
              value={filters.query ?? ''}
              onChange={(event) => setFilter('query', event.target.value)}
              placeholder="Recherche : mix rock, mastering, Paris..."
              className="glass-input xl:col-span-2"
            />

            <select
              id="filter-genre"
              value={filters.genre ?? ''}
              onChange={(event) => setFilter('genre', event.target.value)}
              className="glass-input"
            >
              <option value="">Tous les genres</option>
              {GENRE_OPTIONS.filter(Boolean).map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>

            <input
              id="filter-location"
              type="text"
              value={filters.location ?? ''}
              onChange={(event) => setFilter('location', event.target.value)}
              placeholder="Localisation"
              className="glass-input"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                id="filter-budget-min"
                type="number"
                inputMode="numeric"
                value={filters.budgetMin ?? ''}
                onChange={(event) => setFilter('budgetMin', event.target.value === '' ? undefined : Number(event.target.value))}
                placeholder="Budget min"
                className="glass-input"
              />
              <input
                id="filter-budget-max"
                type="number"
                inputMode="numeric"
                value={filters.budgetMax ?? ''}
                onChange={(event) => setFilter('budgetMax', event.target.value === '' ? undefined : Number(event.target.value))}
                placeholder="Budget max"
                className="glass-input"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p id="missions-count" className="text-sm font-medium text-white/70">
              {formatCount(results.length)}
            </p>

            <button
              id="btn-reset-filters"
              type="button"
              onClick={resetFilters}
              className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </section>

        {loading ? (
          <div id="missions-grid" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="app-card h-64 animate-pulse" />
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <div className="mt-6 rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {!loading && !error && results.length === 0 ? (
          <div id="no-results" className="mt-6">
            <EmptyState
              icon={hasActiveFilters ? '🔎' : '🎯'}
              title={hasActiveFilters ? 'Aucune mission ne correspond à ces filtres' : 'Aucune mission pour l’instant'}
              description={hasActiveFilters
                ? 'Essaie d’élargir la recherche ou réinitialise les filtres pour retrouver toutes les missions publiées.'
                : 'Les prochaines missions publiées apparaîtront ici automatiquement.'}
              action={hasActiveFilters ? { label: 'Réinitialiser les filtres', onClick: resetFilters } : undefined}
            />
          </div>
        ) : null}

        {!loading && !error && results.length > 0 ? (
          <>
            <div id="missions-grid" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {results.map((mission) => (
                <div key={mission.id}>
                  <MissionCard
                    mission={mission}
                    hasApplied={appliedMissionIds.has(mission.id)}
                    onOpen={(missionId) => navigate(`/missions/${missionId}`)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                id="pagination-prev"
                type="button"
                onClick={prevPage}
                disabled={currentPage <= 1}
                className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Précédent
              </button>
              <span className="text-sm text-white/55">Page {currentPage}</span>
              <button
                id="pagination-next"
                type="button"
                onClick={nextPage}
                disabled={!hasMore}
                className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
