import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { buildURL } from '@/lib/search/searchService';

type SearchFiltersShape = {
  query?: string;
  location?: string;
  page?: number;
  limit?: number;
};

type UseSearchOptions<TFilters extends SearchFiltersShape> = {
  parseFilters: (searchParams: URLSearchParams) => Partial<TFilters>;
  debounceMs?: number;
};

function mergeFilters<TFilters extends SearchFiltersShape>(
  base: TFilters,
  updates: Partial<TFilters>,
): TFilters {
  return {
    ...base,
    ...updates,
  };
}

function shallowEqual<TFilters extends SearchFiltersShape>(left: TFilters, right: TFilters): boolean {
  const leftKeys = Object.keys(left) as Array<keyof TFilters>;
  const rightKeys = Object.keys(right) as Array<keyof TFilters>;

  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => left[key] === right[key]) && rightKeys.every((key) => left[key] === right[key]);
}

export function useSearch<TResult, TFilters extends SearchFiltersShape>(
  searchFn: (filters: TFilters) => Promise<TResult[]>,
  initialFilters: TFilters,
  options: UseSearchOptions<TFilters>,
) {
  const { parseFilters, debounceMs = 300 } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  const parsedFilters = useMemo(
    () => mergeFilters(initialFilters, parseFilters(searchParams)),
    [initialFilters, parseFilters, searchParams],
  );

  const [filters, setFilters] = useState<TFilters>(parsedFilters);
  const [debouncedQuery, setDebouncedQuery] = useState(filters.query ?? '');
  const [results, setResults] = useState<TResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    setFilters((current) => (shallowEqual(current, parsedFilters) ? current : parsedFilters));
    setDebouncedQuery(parsedFilters.query ?? '');
  }, [parsedFilters]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(filters.query ?? '');
    }, debounceMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [debounceMs, filters.query]);

  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      query: debouncedQuery || undefined,
    }),
    [debouncedQuery, filters],
  );

  useEffect(() => {
    const nextUrl = buildURL(effectiveFilters);
    const currentUrl = searchParams.toString() ? `?${searchParams.toString()}` : '';
    if (nextUrl === currentUrl) return;
    setSearchParams(nextUrl ? new URLSearchParams(nextUrl.slice(1)) : new URLSearchParams(), { replace: true });
  }, [effectiveFilters, searchParams, setSearchParams]);

  useEffect(() => {
    let active = true;
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    setLoading(true);
    setError(null);

    void searchFn(effectiveFilters)
      .then((nextResults) => {
        if (!active || latestRequestRef.current !== requestId) return;
        setResults(nextResults);
      })
      .catch((searchError) => {
        if (!active || latestRequestRef.current !== requestId) return;
        setResults([]);
        setError(searchError instanceof Error ? searchError.message : 'Impossible de charger les résultats.');
      })
      .finally(() => {
        if (!active || latestRequestRef.current !== requestId) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [effectiveFilters, searchFn]);

  const pageSize = filters.limit ?? initialFilters.limit ?? 20;
  const currentPage = filters.page ?? 1;
  const hasMore = results.length >= pageSize;

  const setFilter = <K extends keyof TFilters>(key: K, value: TFilters[K]) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? (value as TFilters['page']) : 1,
    }));
  };

  const resetFilters = () => {
    setFilters({
      ...initialFilters,
      page: 1,
    });
  };

  const nextPage = () => {
    if (!hasMore) return;
    setFilters((current) => ({
      ...current,
      page: (current.page ?? 1) + 1,
    }));
  };

  const prevPage = () => {
    setFilters((current) => ({
      ...current,
      page: Math.max(1, (current.page ?? 1) - 1),
    }));
  };

  return {
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
  };
}
