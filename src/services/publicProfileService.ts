import { supabase } from '@/lib/supabase/client';
import type { UserType } from '@/types/backend';

export type PublicProfileRecord = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserType | 'admin' | null;
  bio: string | null;
  location: string | null;
  skills: string[];
  daily_rate: number | null;
  rating_avg: number | null;
  rating_count: number;
};

type PublicProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  bio: string | null;
  location: string | null;
  skills: string[] | null;
  daily_rate: number | null;
  rating_avg: number | null;
  rating_count: number | null;
};

const PUBLIC_PROFILE_SELECT =
  'id, display_name, avatar_url, role, bio, location, skills, daily_rate, rating_avg, rating_count';

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

function mapPublicProfile(row: PublicProfileRow): PublicProfileRecord {
  return {
    id: row.id,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    role: (row.role as PublicProfileRecord['role']) ?? null,
    bio: row.bio,
    location: row.location,
    skills: row.skills ?? [],
    daily_rate: row.daily_rate ?? null,
    rating_avg: row.rating_avg ?? null,
    rating_count: row.rating_count ?? 0,
  };
}

export function getPublicProfileDisplayName(profile: Pick<PublicProfileRecord, 'display_name'> | null | undefined) {
  return profile?.display_name?.trim() || 'Profil';
}

export async function getPublicProfile(id: string): Promise<PublicProfileRecord | null> {
  const client = ensureClient();
  const { data, error } = await client
    .from('public_profiles')
    .select(PUBLIC_PROFILE_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapPublicProfile(data as PublicProfileRow) : null;
}

export async function getPublicProfiles(ids: string[]): Promise<PublicProfileRecord[]> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const client = ensureClient();
  const { data, error } = await client
    .from('public_profiles')
    .select(PUBLIC_PROFILE_SELECT)
    .in('id', uniqueIds);

  if (error) throw error;
  return ((data as PublicProfileRow[] | null) ?? []).map(mapPublicProfile);
}

export async function getPublicProfilesMap(ids: string[]): Promise<Map<string, PublicProfileRecord>> {
  const rows = await getPublicProfiles(ids);
  return new Map(rows.map((row) => [row.id, row] as const));
}
