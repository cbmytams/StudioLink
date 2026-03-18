import { supabase } from '@/lib/supabase/client';
import type { ApplicationRecord, ApplicationStatus, CreateApplicationInput } from '@/types/backend';

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

export interface MissionApplication {
  id: string;
  missionId: string;
  proId: string;
  message: string;
  status: ApplicationStatus;
  appliedAt: string;
}

function mapLegacy(row: ApplicationRecord): MissionApplication {
  return {
    id: row.id,
    missionId: row.mission_id,
    proId: row.pro_id,
    message: row.message ?? '',
    status: row.status,
    appliedAt: row.applied_at,
  };
}

export const applicationService = {
  async getMissionApplications(missionId: string): Promise<ApplicationRecord[]> {
    const client = ensureClient();
    const { data, error } = await client
      .from('applications')
      .select('*')
      .eq('mission_id', missionId)
      .order('applied_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ApplicationRecord[];
  },

  async getMyApplications(proId: string): Promise<ApplicationRecord[]> {
    const client = ensureClient();
    const { data, error } = await client
      .from('applications')
      .select('*')
      .eq('pro_id', proId)
      .order('applied_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ApplicationRecord[];
  },

  async createApplication(input: CreateApplicationInput, proId: string): Promise<ApplicationRecord> {
    const client = ensureClient();
    const payload = {
      mission_id: input.mission_id,
      pro_id: proId,
      message: input.message,
      status: 'pending' as const,
    };
    const { data, error } = await client.from('applications').insert(payload).select('*').single();
    if (error) throw error;
    return data as ApplicationRecord;
  },

  async updateStatus(id: string, status: ApplicationStatus): Promise<void> {
    const client = ensureClient();
    const { error } = await client.from('applications').update({ status }).eq('id', id);
    if (error) throw error;
  },

  async hasApplied(missionId: string, proId: string): Promise<boolean> {
    const client = ensureClient();
    const { count, error } = await client
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('mission_id', missionId)
      .eq('pro_id', proId);
    if (error) throw error;
    return (count ?? 0) > 0;
  },
};

// Legacy wrappers
export async function listApplicationsForMission(missionId: string): Promise<MissionApplication[]> {
  const rows = await applicationService.getMissionApplications(missionId);
  return rows.map(mapLegacy);
}

export async function getMyApplicationForMission(
  missionId: string,
  proId: string,
): Promise<MissionApplication | null> {
  const rows = await applicationService.getMissionApplications(missionId);
  const found = rows.find((row) => row.pro_id === proId);
  return found ? mapLegacy(found) : null;
}

export async function createApplication(params: { missionId: string; proId: string; message: string }) {
  await applicationService.createApplication(
    {
      mission_id: params.missionId,
      message: params.message,
    },
    params.proId,
  );
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus) {
  await applicationService.updateStatus(id, status);
}
