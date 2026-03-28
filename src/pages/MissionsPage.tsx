import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MissionCard } from '@/components/search/MissionCard';
import { SEO } from '@/components/SEO';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
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
      <SEO
        title="Missions creatives"
        description="Trouvez des missions creatives avec recherche full-text et filtres persistes."
        url="/missions"
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
            <label htmlFor="search-input-missions" className="sr-only">Recherche mission</label>
            <input
              id="search-input-missions"
              type="search"
              aria-label="Recherche mission"
              value={filters.query ?? ''}
              onChange={(event) => setFilter('query', event.target.value)}
              placeholder="Recherche : mix rock, mastering, Paris..."
              className="glass-input xl:col-span-2"
            />

            <label htmlFor="filter-genre" className="sr-only">Filtre genre</label>
            <select
              id="filter-genre"
              aria-label="Filtre genre"
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

            <label htmlFor="filter-location" className="sr-only">Filtre localisation</label>
            <input
              id="filter-location"
              type="text"
              aria-label="Filtre localisation"
              value={filters.location ?? ''}
              onChange={(event) => setFilter('location', event.target.value)}
              placeholder="Localisation"
              className="glass-input"
            />

            <div className="grid grid-cols-2 gap-3">
              <label htmlFor="filter-budget-min" className="sr-only">Budget minimum</label>
              <input
                id="filter-budget-min"
                type="number"
                aria-label="Budget minimum"
                inputMode="numeric"
                value={filters.budgetMin ?? ''}
                onChange={(event) => setFilter('budgetMin', event.target.value === '' ? undefined : Number(event.target.value))}
                placeholder="Budget min"
                className="glass-input"
              />
              <label htmlFor="filter-budget-max" className="sr-only">Budget maximum</label>
              <input
                id="filter-budget-max"
                type="number"
                aria-label="Budget maximum"
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
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </section>

        {loading ? (
          <div id="missions-grid" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} lines={4} />
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <ErrorMessage
            title="Impossible de charger les missions"
            message={error}
            onRetry={resetFilters}
            className="mt-6 app-card"
          />
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
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Précédent
              </button>
              <span className="text-sm text-white/55">Page {currentPage}</span>
              <button
                id="pagination-next"
                type="button"
                onClick={nextPage}
                disabled={!hasMore}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
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
