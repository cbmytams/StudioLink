import { getPublicProfilesMap } from '@/services/publicProfileService';

export type MissionFilters = {
  query?: string;
  genre?: string;
  location?: string;
  budgetMin?: number;
  budgetMax?: number;
  status?: string;
  limit?: number;
  offset?: number;
  page?: number;
};

export type ProFilters = {
  query?: string;
  location?: string;
  skill?: string;
  limit?: number;
  offset?: number;
  page?: number;
};

export type SearchMissionResult = {
  id: string;
  studio_id: string;
  title: string;
  description: string | null;
  category: string | null;
  genre: string | null;
  genres: string[];
  location: string | null;
  city: string | null;
  budget: number | null;
  date: string | null;
  created_at: string;
  status: string | null;
  applications_count: number;
  studio: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type SearchProResult = {
  id: string;
  display_name: string | null;
  role: string | null;
  bio: string | null;
  location: string | null;
  skills: string[];
  avatar_url: string | null;
  rating_avg: number | null;
  rating_count: number | null;
};

type MissionRow = {
  id: string;
  studio_id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  service_type: string | null;
  genres: string[] | null;
  location: string | null;
  city: string | null;
  date: string | null;
  daily_rate: number | null;
  price: string | null;
  created_at: string;
  status: string | null;
  applications_count: number | null;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  role: string | null;
  bio: string | null;
  location: string | null;
  skills: string[] | null;
  avatar_url: string | null;
  rating_avg: number | null;
  rating_count: number | null;
};

async function ensureClient() {
  const { supabase } = await import('@/lib/supabase/client');
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

function cleanString(value: string | null | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function cleanNumber(value: string | number | null | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return undefined;
}

function parseBudget(value: number | string | null): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const digits = value.replace(/\D/g, '');
    if (digits) {
      const parsed = Number.parseInt(digits, 10);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  return null;
}

export function parseFiltersFromURL(searchParams: URLSearchParams): MissionFilters {
  const filters: MissionFilters = {};
  const query = cleanString(searchParams.get('q') ?? undefined);
  const genre = cleanString(searchParams.get('genre') ?? undefined);
  const location = cleanString(searchParams.get('location') ?? undefined);
  const budgetMin = cleanNumber(searchParams.get('budget_min') ?? undefined);
  const budgetMax = cleanNumber(searchParams.get('budget_max') ?? undefined);
  const page = cleanNumber(searchParams.get('page') ?? undefined);

  if (query) filters.query = query;
  if (genre) filters.genre = genre;
  if (location) filters.location = location;
  if (budgetMin !== undefined) filters.budgetMin = budgetMin;
  if (budgetMax !== undefined) filters.budgetMax = budgetMax;
  if (page !== undefined) filters.page = page;

  return filters;
}

export function parseProFiltersFromURL(searchParams: URLSearchParams): ProFilters {
  const filters: ProFilters = {};
  const query = cleanString(searchParams.get('q') ?? undefined);
  const location = cleanString(searchParams.get('location') ?? undefined);
  const skill = cleanString(searchParams.get('skill') ?? undefined);
  const page = cleanNumber(searchParams.get('page') ?? undefined);

  if (query) filters.query = query;
  if (location) filters.location = location;
  if (skill) filters.skill = skill;
  if (page !== undefined) filters.page = page;

  return filters;
}

export function buildURL(filters: MissionFilters | ProFilters): string {
  const params = new URLSearchParams();

  const query = cleanString(filters.query);
  if (query) params.set('q', query);

  const location = cleanString(filters.location);
  if (location) params.set('location', location);

  if ('genre' in filters) {
    const genre = cleanString(filters.genre);
    if (genre) params.set('genre', genre);

    const budgetMin = cleanNumber(filters.budgetMin);
    if (budgetMin !== undefined) params.set('budget_min', String(budgetMin));

    const budgetMax = cleanNumber(filters.budgetMax);
    if (budgetMax !== undefined) params.set('budget_max', String(budgetMax));
  }

  if ('skill' in filters) {
    const skill = cleanString(filters.skill);
    if (skill) params.set('skill', skill);
  }

  const page = cleanNumber(filters.page);
  if (page !== undefined && page > 1) params.set('page', String(page));

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

function mapMissionRow(
  row: MissionRow,
  studio: SearchMissionResult['studio'],
): SearchMissionResult {
  const genres = row.genres ?? [];
  const category = row.category ?? row.service_type ?? null;

  return {
    id: row.id,
    studio_id: row.studio_id,
    title: row.title ?? 'Mission',
    description: row.description,
    category,
    genre: category ?? genres[0] ?? null,
    genres,
    location: row.location ?? row.city ?? null,
    city: row.city ?? row.location ?? null,
    budget: parseBudget(row.daily_rate ?? row.price),
    date: row.date,
    created_at: row.created_at,
    status: row.status,
    applications_count: row.applications_count ?? 0,
    studio,
  };
}

export async function searchMissions(filters: MissionFilters): Promise<SearchMissionResult[]> {
  const client = await ensureClient();
  const page = cleanNumber(filters.page) ?? 1;
  const limit = cleanNumber(filters.limit) ?? 20;
  const offset = cleanNumber(filters.offset) ?? Math.max(0, (page - 1) * limit);

  const { data, error } = await client.rpc('search_missions', {
    p_query: cleanString(filters.query),
    p_genre: cleanString(filters.genre),
    p_location: cleanString(filters.location),
    p_budget_min: cleanNumber(filters.budgetMin),
    p_budget_max: cleanNumber(filters.budgetMax),
    p_status: cleanString(filters.status) ?? 'published',
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw error;

  const rows = (data as MissionRow[] | null) ?? [];
  if (rows.length === 0) return [];

  const studioIds = Array.from(new Set(rows.map((row) => row.studio_id)));
  const publicProfiles = await getPublicProfilesMap(studioIds);
  const studiosById = new Map<string, SearchMissionResult['studio']>(
    Array.from(publicProfiles.values()).map((profile) => [
      profile.id,
      {
        id: profile.id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      },
    ]),
  );

  return rows.map((row) => mapMissionRow(row, studiosById.get(row.studio_id) ?? null));
}

export async function searchPros(filters: ProFilters): Promise<SearchProResult[]> {
  const client = await ensureClient();
  const page = cleanNumber(filters.page) ?? 1;
  const limit = cleanNumber(filters.limit) ?? 20;
  const offset = cleanNumber(filters.offset) ?? Math.max(0, (page - 1) * limit);

  const { data, error } = await client.rpc('search_pros', {
    p_query: cleanString(filters.query),
    p_location: cleanString(filters.location),
    p_skill: cleanString(filters.skill),
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw error;

  return ((data as ProfileRow[] | null) ?? []).map((row) => ({
    id: row.id,
    display_name: row.display_name,
    role: row.role,
    bio: row.bio,
    location: row.location,
    skills: row.skills ?? [],
    avatar_url: row.avatar_url,
    rating_avg: row.rating_avg,
    rating_count: row.rating_count,
  }));
}
