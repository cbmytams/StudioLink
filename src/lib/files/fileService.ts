import { supabase } from '@/lib/supabase/client';
import type { MissionFileRecord, MissionFileType } from '@/types/backend';
import { handleAuthError } from '@/lib/auth/handleAuthError';
import { trackFileUploaded } from '@/lib/analytics/events';
import { buildScopedStoragePath, getBucketFromMissionFileType } from './fileUtils';

type MissionFileRow = MissionFileRecord;
const MISSION_FILE_SELECT_COLUMNS =
  'id, mission_id, session_id, uploaded_by, file_type, file_url, file_name, file_size, mime_type, created_at';

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

async function getCurrentUserId() {
  const client = ensureClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  const userId = data.user?.id ?? null;
  if (!userId) {
    throw new Error('Session expirée. Reconnecte-toi pour continuer.');
  }
  return userId;
}

function mapMissionFile(row: MissionFileRow): MissionFileRecord {
  return {
    id: row.id,
    mission_id: row.mission_id,
    session_id: row.session_id ?? null,
    uploaded_by: row.uploaded_by,
    file_type: row.file_type,
    file_url: row.file_url,
    file_name: row.file_name,
    file_size: row.file_size ?? null,
    mime_type: row.mime_type ?? null,
    created_at: row.created_at,
  };
}

async function uploadScopedFile(
  fileType: MissionFileType,
  scopeId: string,
  file: File,
  values: { missionId: string; sessionId?: string | null },
): Promise<MissionFileRecord> {
  const client = ensureClient();
  const userId = await getCurrentUserId();
  const bucket = getBucketFromMissionFileType(fileType);
  const path = buildScopedStoragePath(scopeId, file.name, crypto.randomUUID());

  try {
    const { error: uploadError } = await client.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (uploadError) throw uploadError;

    const insertPayload = {
      mission_id: values.missionId,
      session_id: values.sessionId ?? null,
      uploaded_by: userId,
      file_type: fileType,
      file_url: path,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
    };

    const { data, error: insertError } = await client
      .from('mission_files')
      .insert(insertPayload)
      .select(MISSION_FILE_SELECT_COLUMNS)
      .single();

    if (insertError) {
      await client.storage.from(bucket).remove([path]);
      throw insertError;
    }

    const mapped = mapMissionFile(data as MissionFileRow);
    trackFileUploaded(fileType === 'reference' ? 'mission' : 'delivery');
    return mapped;
  } catch (error) {
    const isAuthError = await handleAuthError(error);
    if (isAuthError) {
      throw new Error('Session expirée. Reconnecte-toi pour continuer.');
    }
    throw error;
  }
}

export async function uploadMissionFile(missionId: string, file: File): Promise<MissionFileRecord> {
  return uploadScopedFile('reference', missionId, file, { missionId });
}

export async function uploadDeliveryFile(
  sessionId: string,
  missionId: string,
  file: File,
): Promise<MissionFileRecord> {
  return uploadScopedFile('delivery', sessionId, file, { missionId, sessionId });
}

export async function getMissionFiles(missionId: string): Promise<MissionFileRecord[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from('mission_files')
    .select(MISSION_FILE_SELECT_COLUMNS)
    .eq('mission_id', missionId)
    .eq('file_type', 'reference')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data as MissionFileRow[] | null) ?? []).map(mapMissionFile);
}

export async function getDeliveryFiles(sessionId: string): Promise<MissionFileRecord[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from('mission_files')
    .select(MISSION_FILE_SELECT_COLUMNS)
    .eq('session_id', sessionId)
    .eq('file_type', 'delivery')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data as MissionFileRow[] | null) ?? []).map(mapMissionFile);
}

export async function getSignedUrl(
  bucket: 'mission-files' | 'delivery-files' | 'message-files',
  filePath: string,
  expiresIn = 3600,
): Promise<string> {
  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  const client = ensureClient();
  const { data, error } = await client.storage.from(bucket).createSignedUrl(filePath, expiresIn);
  if (error) throw error;
  if (!data?.signedUrl) {
    throw new Error('Impossible de générer un lien de téléchargement.');
  }
  return data.signedUrl;
}

export async function deleteFile(
  fileId: string,
  bucket: 'mission-files' | 'delivery-files',
  filePath: string,
): Promise<void> {
  const client = ensureClient();

  const { error: storageError } = await client.storage.from(bucket).remove([filePath]);
  if (storageError) throw storageError;

  const { error } = await client
    .from('mission_files')
    .delete()
    .eq('id', fileId);

  if (error) throw error;
}
