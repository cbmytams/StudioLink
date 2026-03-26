import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProCard } from '@/components/search/ProCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageMeta } from '@/components/shared/PageMeta';
import { useSearch } from '@/hooks/useSearch';
import {
  parseProFiltersFromURL,
  searchPros,
  type ProFilters,
  type SearchProResult,
} from '@/lib/search/searchService';

const INITIAL_FILTERS: ProFilters = {
  page: 1,
  limit: 12,
};

export default function ProsPage() {
  const navigate = useNavigate();
  const runSearch = useCallback((filters: ProFilters) => searchPros(filters), []);
  const {
    results,
    loading,
    error,
    filters,
    setFilter,
    resetFilters,
  } = useSearch<SearchProResult, ProFilters>(runSearch, INITIAL_FILTERS, {
    parseFilters: parseProFiltersFromURL,
  });

  return (
    <main className="app-shell pb-24">
      <PageMeta
        title="Annuaire des Pros"
        description="Recherchez des professionnels de l’audio par texte, ville et compétence."
        canonicalPath="/pros"
      />

      <div className="app-container-wide pt-20 md:pt-24">
        <header className="app-header">
          <div>
            <h1 className="app-title">Trouver des pros</h1>
            <p className="app-subtitle">Annuaire public des profils Pro avec score et compétences.</p>
          </div>
        </header>

        <section className="app-card p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              id="search-input-pros"
              type="search"
              value={filters.query ?? ''}
              onChange={(event) => setFilter('query', event.target.value)}
              placeholder="Recherche : mixage, mastering, Paris..."
              className="glass-input md:col-span-2"
            />
            <input
              id="filter-pro-location"
              type="text"
              value={filters.location ?? ''}
              onChange={(event) => setFilter('location', event.target.value)}
              placeholder="Localisation"
              className="glass-input"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <input
              id="filter-pro-skill"
              type="text"
              value={filters.skill ?? ''}
              onChange={(event) => setFilter('skill', event.target.value)}
              placeholder="Compétence (ex: Mixage)"
              className="glass-input max-w-sm"
            />

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10"
            >
              Réinitialiser
            </button>
          </div>
        </section>

        {loading ? (
          <div id="pros-grid" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
          <div id="no-results-pros" className="mt-6">
            <EmptyState
              icon="🎙️"
              title="Aucun Pro correspondant"
              description="Essaie une autre ville, un autre mot-clé ou remets les filtres à zéro pour repartir d’une recherche large."
              action={{ label: 'Réinitialiser les filtres', onClick: resetFilters }}
            />
          </div>
        ) : null}

        {!loading && !error && results.length > 0 ? (
          <div id="pros-grid" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map((profile) => (
              <div key={profile.id}>
                <ProCard
                  profile={profile}
                  onOpen={(profileId) => navigate(`/pro/public/${profileId}`)}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
