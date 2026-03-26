import { supabase } from '@/lib/supabase/client';
import { handleAuthError } from '@/lib/auth/handleAuthError';
import type { Database } from '@/types/supabase';
import type { CreateMissionInput, MissionRecord, MissionStatus } from '@/types/backend';
import type { Mission as LegacyMission } from '@/types/mission';

const MISSION_SELECT_COLUMNS =
  'id, studio_id, is_urgent, service_type, artist_name, is_confidential, genres, beat_type, duration, price, location, candidates_count, expires_at, status, created_at, updated_at';

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

type DbMissionStatus = Database['public']['Enums']['mission_status'];

function toDbMissionStatus(status: MissionStatus | undefined, fallback: DbMissionStatus): DbMissionStatus {
  switch (status) {
    case 'draft':
    case 'published':
    case 'in_progress':
    case 'completed':
    case 'cancelled':
    case 'open':
      return status;
    case 'closed':
      return 'completed';
    default:
      return fallback;
  }
}

function mapLegacyMission(row: MissionRecord): LegacyMission {
  return {
    id: row.id,
    isUrgent: row.is_urgent,
    serviceType: row.service_type,
    artistName: row.artist_name ?? 'Confidentiel',
    isConfidential: row.is_confidential,
    genres: row.genres ?? [],
    beatType: row.beat_type ?? undefined,
    duration: row.duration ?? '',
    price: row.price ?? 'À négocier',
    location: row.location ?? 'Paris',
    candidatesCount: row.candidates_count ?? 0,
    expiresAt: row.expires_at ?? row.created_at,
    createdAt: row.created_at,
    status: row.status,
  };
}

export const missionService = {
  async getStudioMissions(studioId: string, status?: MissionStatus): Promise<MissionRecord[]> {
    const client = ensureClient();
    let query = client
      .from('missions')
      .select(MISSION_SELECT_COLUMNS)
      .eq('studio_id', studioId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', toDbMissionStatus(status, 'draft'));

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as MissionRecord[];
  },

  async getPublishedMissions(filters?: { serviceType?: string; search?: string }): Promise<MissionRecord[]> {
    const client = ensureClient();
    let query = client
      .from('missions')
      .select(MISSION_SELECT_COLUMNS)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (filters?.serviceType) query = query.eq('service_type', filters.serviceType);
    if (filters?.search) query = query.ilike('service_type', `%${filters.search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as MissionRecord[];
  },

  async getMissionById(id: string): Promise<MissionRecord> {
    const client = ensureClient();
    const { data, error } = await client.from('missions').select(MISSION_SELECT_COLUMNS).eq('id', id).single();
    if (error) throw error;
    return data as MissionRecord;
  },

  async createMission(studioId: string, input: CreateMissionInput): Promise<MissionRecord> {
    const client = ensureClient();
    const payload = {
      studio_id: studioId,
      is_urgent: input.is_urgent ?? false,
      service_type: input.service_type,
      artist_name: input.artist_name ?? null,
      is_confidential: input.is_confidential ?? false,
      genres: input.genres ?? [],
      beat_type: input.beat_type ?? null,
      duration: input.duration ?? null,
      price: input.price ?? null,
      location: input.location ?? null,
      expires_at: input.expires_at ?? null,
      status: toDbMissionStatus(input.status, 'draft'),
    };

    try {
      const { data, error } = await client.from('missions').insert(payload).select(MISSION_SELECT_COLUMNS).single();
      if (error) throw error;
      return data as MissionRecord;
    } catch (error) {
      const isAuthError = await handleAuthError(error);
      if (isAuthError) {
        throw new Error('Session expirée. Reconnecte-toi pour continuer.');
      }
      throw error;
    }
  },

  async updateMissionStatus(id: string, status: MissionStatus): Promise<void> {
    const client = ensureClient();
    try {
      const { error } = await client
        .from('missions')
        .update({ status: toDbMissionStatus(status, 'draft') })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      const isAuthError = await handleAuthError(error);
      if (isAuthError) {
        throw new Error('Session expirée. Reconnecte-toi pour continuer.');
      }
      throw error;
    }
  },

  async deleteMission(id: string): Promise<void> {
    const client = ensureClient();
    const { error } = await client.from('missions').delete().eq('id', id);
    if (error) throw error;
  },
};

// Legacy wrappers (compat pages existantes)
export async function listStudioMissions(studioId: string): Promise<LegacyMission[]> {
  const records = await missionService.getStudioMissions(studioId);
  return records.map(mapLegacyMission);
}

export async function listPublishedMissions(): Promise<LegacyMission[]> {
  const records = await missionService.getPublishedMissions();
  return records.map(mapLegacyMission);
}

export async function getMissionById(id: string): Promise<LegacyMission | null> {
  try {
    const record = await missionService.getMissionById(id);
    return mapLegacyMission(record);
  } catch {
    return null;
  }
}

export async function createMission(studioId: string, input: {
  serviceType: string;
  artistName: string;
  isConfidential: boolean;
  genres: string[];
  beatType?: string;
  duration?: string;
  price?: string;
  location?: string;
  expiresAt?: string;
  isUrgent?: boolean;
  status?: MissionStatus;
}): Promise<string> {
  const created = await missionService.createMission(studioId, {
    service_type: input.serviceType,
    artist_name: input.artistName || null,
    is_confidential: input.isConfidential,
    genres: input.genres,
    beat_type: input.beatType ?? null,
    duration: input.duration ?? null,
    price: input.price ?? null,
    location: input.location ?? null,
    expires_at: input.expiresAt ?? null,
    is_urgent: input.isUrgent ?? false,
    status: input.status ?? 'draft',
  });
  return created.id;
}

export async function updateMissionStatus(id: string, status: MissionStatus) {
  await missionService.updateMissionStatus(id, status);
}
