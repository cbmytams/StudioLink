import { supabase } from '@/lib/supabase/client';
import { handleAuthError } from '@/lib/auth/handleAuthError';
import type { ApplicationRecord, ApplicationStatus, CreateApplicationInput } from '@/types/backend';
import { emailService } from '@/lib/email/emailService';
import {
  trackApplicationAccepted,
  trackApplicationRejected,
  trackMissionApplied,
  trackSessionStarted,
} from '@/lib/analytics/events';
import {
  buildApplicationWritePayload,
  formatApplicationInsertError,
  normalizeApplicationStatus,
} from '@/lib/applications/phase2Compat';
import { normalizeMissionStatus } from '@/lib/missions/phase1Compat';

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

type MissionEmailRow = {
  id: string;
  title: string | null;
  studio_id: string;
};

type MissionGuardRow = {
  id: string;
  studio_id: string;
  status: string | null;
};

type EmailProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  full_name: string | null;
  company_name: string | null;
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

function getProfileName(profile: EmailProfileRow | null | undefined, fallback: string) {
  return profile?.display_name ?? profile?.full_name ?? profile?.company_name ?? fallback;
}

async function getProfilesById(
  client: ReturnType<typeof ensureClient>,
  ids: string[],
): Promise<Map<string, EmailProfileRow>> {
  if (ids.length === 0) return new Map();
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await client
    .from('profiles')
    .select('id, email, display_name, full_name, company_name')
    .in('id', uniqueIds);

  if (error || !data) return new Map();
  return new Map((data as EmailProfileRow[]).map((profile) => [profile.id, profile]));
}

async function notifyApplicationCreated(
  client: ReturnType<typeof ensureClient>,
  created: ApplicationRecord,
) {
  const { data: missionData, error: missionError } = await client
    .from('missions')
    .select('id, title, studio_id')
    .eq('id', created.mission_id)
    .maybeSingle();

  if (missionError || !missionData) return;
  const mission = missionData as MissionEmailRow;

  const profilesById = await getProfilesById(client, [mission.studio_id, created.pro_id]);
  const studioProfile = profilesById.get(mission.studio_id) ?? null;
  const proProfile = profilesById.get(created.pro_id) ?? null;

  if (!studioProfile?.email) return;

  await emailService.sendApplicationReceived({
    studioEmail: studioProfile.email,
    proName: getProfileName(proProfile, 'Un professionnel'),
    missionTitle: mission.title ?? 'Mission StudioLink',
    missionId: mission.id,
    coverLetter: created.cover_letter ?? created.message ?? undefined,
  });
}

async function notifyApplicationDecision(
  client: ReturnType<typeof ensureClient>,
  result: ReturnType<typeof mapRpcRow>,
  decision: 'accepted' | 'rejected',
) {
  if (!result.missionId || !result.proId) return;

  const { data: missionData, error: missionError } = await client
    .from('missions')
    .select('title, studio_id')
    .eq('id', result.missionId)
    .maybeSingle();

  if (missionError || !missionData) return;
  const mission = missionData as Pick<MissionEmailRow, 'title' | 'studio_id'>;

  const profilesById = await getProfilesById(client, [mission.studio_id, result.proId]);
  const studioProfile = profilesById.get(mission.studio_id) ?? null;
  const proProfile = profilesById.get(result.proId) ?? null;

  if (!proProfile?.email) return;

  const missionTitle = mission.title ?? 'Mission StudioLink';
  const studioName = getProfileName(studioProfile, 'Studio');

  if (decision === 'accepted') {
    if (!result.sessionId) return;
    await emailService.sendApplicationAccepted({
      proEmail: proProfile.email,
      studioName,
      missionTitle,
      sessionId: result.sessionId,
    });
    return;
  }

  await emailService.sendApplicationRejected({
    proEmail: proProfile.email,
    studioName,
    missionTitle,
  });
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
    const { data: missionData, error: missionError } = await client
      .from('missions')
      .select('id, studio_id, status')
      .eq('id', input.mission_id)
      .maybeSingle();

    if (missionError) throw missionError;

    const mission = missionData as MissionGuardRow | null;
    if (!mission) {
      throw new Error('Mission introuvable.');
    }

    if (mission.studio_id === proId) {
      throw new Error("Vous ne pouvez pas candidater à votre propre mission.");
    }

    if (normalizeMissionStatus(mission.status ?? null) !== 'open') {
      throw new Error("Cette mission n'accepte plus de candidatures.");
    }

    const payload = buildApplicationWritePayload({
      missionId: input.mission_id,
      proId,
      coverLetter: input.cover_letter,
    });

    try {
      const { data, error } = await client
        .from('applications')
        .insert(payload)
        .select('id, mission_id, pro_id, status, cover_letter, created_at, updated_at, message, applied_at')
        .single();

      if (error) {
        throw new Error(formatApplicationInsertError(error));
      }

      const created = mapApplicationRow(data as ApplicationRow);
      trackMissionApplied({
        fromSearch: false,
        missionId: created.mission_id,
      });
      void notifyApplicationCreated(client, created).catch(() => undefined);
      return created;
    } catch (error) {
      const isAuthError = await handleAuthError(error);
      if (isAuthError) {
        throw new Error('Session expirée. Reconnecte-toi pour continuer.');
      }
      throw error;
    }
  },

  async acceptApplication(applicationId: string) {
    const client = ensureClient();
    const { data, error } = await client
      .rpc('accept_application', { p_application_id: applicationId });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error('Réponse serveur vide.');
    const result = mapRpcRow(row as ApplicationRpcRow);
    if (result.missionId) {
      trackApplicationAccepted(result.missionId);
    }
    if (result.sessionId) {
      trackSessionStarted(result.sessionId);
    }
    void notifyApplicationDecision(client, result, 'accepted').catch(() => undefined);
    return result;
  },

  async rejectApplication(applicationId: string) {
    const client = ensureClient();
    const { data, error } = await client
      .rpc('reject_application', { p_application_id: applicationId });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error('Réponse serveur vide.');
    const result = mapRpcRow(row as ApplicationRpcRow);
    if (result.missionId) {
      trackApplicationRejected(result.missionId);
    }
    void notifyApplicationDecision(client, result, 'rejected').catch(() => undefined);
    return result;
  },

  async withdrawApplication(applicationId: string): Promise<void> {
    const client = ensureClient();
    try {
      const { error } = await client
        .from('applications')
        .delete()
        .eq('id', applicationId)
        .eq('status', 'pending');
      if (error) throw error;
    } catch (error) {
      const isAuthError = await handleAuthError(error);
      if (isAuthError) {
        throw new Error('Session expirée. Reconnecte-toi pour continuer.');
      }
      throw error;
    }
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
