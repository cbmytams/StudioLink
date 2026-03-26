import { supabase } from '@/lib/supabase/client';
import type { ApplicationRecord, ApplicationStatus, CreateApplicationInput } from '@/types/backend';
import {
  buildApplicationWritePayload,
  formatApplicationInsertError,
  normalizeApplicationStatus,
} from '@/lib/applications/phase2Compat';

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

type ApplicationRow = {
  id: string;
  mission_id: string;
  pro_id: string;
  status: string | null;
  cover_letter: string | null;
  created_at: string | null;
  updated_at: string | null;
  message?: string | null;
  applied_at?: string | null;
};

type ApplicationRpcRow = {
  session_id?: string | null;
  application_id?: string;
  mission_id?: string;
  pro_id?: string;
  status?: string | null;
  accepted_application_id?: string;
  accepted_mission_id?: string;
  accepted_pro_id?: string;
  accepted_status?: string | null;
  rejected_application_id?: string;
  rejected_mission_id?: string;
  rejected_pro_id?: string;
  rejected_status?: string | null;
};

export interface MissionApplication {
  id: string;
  missionId: string;
  proId: string;
  coverLetter: string;
  status: ApplicationStatus;
  createdAt: string;
}

function mapApplicationRow(row: ApplicationRow): ApplicationRecord {
  return {
    id: row.id,
    mission_id: row.mission_id,
    pro_id: row.pro_id,
    cover_letter: row.cover_letter ?? row.message ?? null,
    status: normalizeApplicationStatus(row.status),
    created_at: row.created_at ?? row.applied_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? row.created_at ?? row.applied_at ?? new Date().toISOString(),
    message: row.message ?? row.cover_letter ?? null,
    applied_at: row.applied_at ?? row.created_at ?? undefined,
  };
}

function mapLegacy(row: ApplicationRecord): MissionApplication {
  return {
    id: row.id,
    missionId: row.mission_id,
    proId: row.pro_id,
    coverLetter: row.cover_letter ?? row.message ?? '',
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapRpcRow(row: ApplicationRpcRow) {
  const applicationId = row.application_id ?? row.accepted_application_id ?? row.rejected_application_id;
  const missionId = row.mission_id ?? row.accepted_mission_id ?? row.rejected_mission_id;
  const proId = row.pro_id ?? row.accepted_pro_id ?? row.rejected_pro_id;
  const status = row.status ?? row.accepted_status ?? row.rejected_status;

  return {
    sessionId: row.session_id ?? null,
    applicationId,
    missionId,
    proId,
    status: normalizeApplicationStatus(status),
  };
}

export const applicationService = {
  async getMissionApplications(missionId: string): Promise<ApplicationRecord[]> {
    const client = ensureClient();
    const { data, error } = await client
      .from('applications')
      .select('id, mission_id, pro_id, status, cover_letter, created_at, updated_at, message, applied_at')
      .eq('mission_id', missionId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as ApplicationRow[] | null ?? []).map(mapApplicationRow);
  },

  async getMyApplications(proId: string): Promise<ApplicationRecord[]> {
    const client = ensureClient();
    const { data, error } = await client
      .from('applications')
      .select('id, mission_id, pro_id, status, cover_letter, created_at, updated_at, message, applied_at')
      .eq('pro_id', proId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as ApplicationRow[] | null ?? []).map(mapApplicationRow);
  },

  async createApplication(input: CreateApplicationInput, proId: string): Promise<ApplicationRecord> {
    const client = ensureClient();
    const payload = buildApplicationWritePayload({
      missionId: input.mission_id,
      proId,
      coverLetter: input.cover_letter,
    });

    const { data, error } = await client
      .from('applications')
      .insert(payload)
      .select('id, mission_id, pro_id, status, cover_letter, created_at, updated_at, message, applied_at')
      .single();

    if (error) {
      throw new Error(formatApplicationInsertError(error));
    }

    return mapApplicationRow(data as ApplicationRow);
  },

  async acceptApplication(applicationId: string) {
    const client = ensureClient();
    const { data, error } = await client
      .rpc('accept_application', { p_application_id: applicationId });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error('Réponse serveur vide.');
    return mapRpcRow(row as ApplicationRpcRow);
  },

  async rejectApplication(applicationId: string) {
    const client = ensureClient();
    const { data, error } = await client
      .rpc('reject_application', { p_application_id: applicationId });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error('Réponse serveur vide.');
    return mapRpcRow(row as ApplicationRpcRow);
  },

  async withdrawApplication(applicationId: string): Promise<void> {
    const client = ensureClient();
    const { error } = await client
      .from('applications')
      .delete()
      .eq('id', applicationId)
      .eq('status', 'pending');
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

export async function createApplication(params: { missionId: string; proId: string; coverLetter?: string }) {
  await applicationService.createApplication(
    {
      mission_id: params.missionId,
      cover_letter: params.coverLetter,
    },
    params.proId,
  );
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus) {
  if (status === 'accepted') {
    await applicationService.acceptApplication(id);
    return;
  }
  await applicationService.rejectApplication(id);
}
