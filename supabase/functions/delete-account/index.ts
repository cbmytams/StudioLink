import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type MissionFileRow = {
  file_type: 'reference' | 'delivery' | string;
  file_url: string;
};

function toJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function mapMissionFileBucket(fileType: MissionFileRow['file_type']) {
  return fileType === 'delivery' ? 'delivery-files' : 'mission-files';
}

function isStoragePath(value: string) {
  return value.length > 0 && !/^https?:\/\//i.test(value);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return toJson({ error: 'Missing Supabase environment variables' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return toJson({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  const user = authData.user;

  if (authError || !user) {
    return toJson({ error: 'Unauthorized' }, 401);
  }

  const userId = user.id;
  const storageRemovals = new Map<string, Set<string>>();

  const addStoragePath = (bucket: string, path: string | null | undefined) => {
    if (!path || !isStoragePath(path)) return;
    const existing = storageRemovals.get(bucket);
    if (existing) {
      existing.add(path);
      return;
    }
    storageRemovals.set(bucket, new Set([path]));
  };

  const { data: missionRows } = await supabase
    .from('missions')
    .select('id')
    .eq('studio_id', userId);
  const missionIds = (missionRows ?? []).map((row) => row.id);

  const { data: sessionRows } = await supabase
    .from('sessions')
    .select('id')
    .or(`studio_id.eq.${userId},pro_id.eq.${userId}`);
  const sessionIds = (sessionRows ?? []).map((row) => row.id);

  const missionFiles: MissionFileRow[] = [];

  const { data: ownMissionFiles } = await supabase
    .from('mission_files')
    .select('file_type, file_url')
    .eq('uploaded_by', userId);
  missionFiles.push(...((ownMissionFiles ?? []) as MissionFileRow[]));

  if (missionIds.length > 0) {
    const { data: missionMissionFiles } = await supabase
      .from('mission_files')
      .select('file_type, file_url')
      .in('mission_id', missionIds);
    missionFiles.push(...((missionMissionFiles ?? []) as MissionFileRow[]));
  }

  if (sessionIds.length > 0) {
    const { data: sessionMissionFiles } = await supabase
      .from('mission_files')
      .select('file_type, file_url')
      .in('session_id', sessionIds);
    missionFiles.push(...((sessionMissionFiles ?? []) as MissionFileRow[]));
  }

  for (const file of missionFiles) {
    addStoragePath(mapMissionFileBucket(file.file_type), file.file_url);
  }

  const { data: ownMessageFiles } = await supabase
    .from('messages')
    .select('file_url')
    .eq('sender_id', userId)
    .not('file_url', 'is', null);
  for (const row of ownMessageFiles ?? []) {
    addStoragePath('message-files', row.file_url);
  }

  if (sessionIds.length > 0) {
    const { data: sessionMessageFiles } = await supabase
      .from('messages')
      .select('file_url')
      .in('session_id', sessionIds)
      .not('file_url', 'is', null);
    for (const row of sessionMessageFiles ?? []) {
      addStoragePath('message-files', row.file_url);
    }
  }

  for (const bucket of ['avatars', 'documents']) {
    const { data: files } = await supabase.storage.from(bucket).list(userId, { limit: 1000 });
    for (const file of files ?? []) {
      addStoragePath(bucket, `${userId}/${file.name}`);
    }
  }

  for (const [bucket, paths] of storageRemovals.entries()) {
    if (paths.size === 0) continue;
    await supabase.storage.from(bucket).remove(Array.from(paths));
  }

  await supabase.from('ratings').delete().eq('rater_id', userId);
  await supabase.from('ratings').delete().eq('rated_id', userId);
  await supabase.from('messages').delete().eq('sender_id', userId);
  await supabase.from('notifications').delete().eq('user_id', userId);
  await supabase.from('applications').delete().eq('pro_id', userId);

  if (sessionIds.length > 0) {
    await supabase.from('messages').delete().in('session_id', sessionIds);
    await supabase.from('mission_files').delete().in('session_id', sessionIds);
    await supabase.from('sessions').delete().in('id', sessionIds);
  }

  if (missionIds.length > 0) {
    await supabase.from('applications').delete().in('mission_id', missionIds);
    await supabase.from('mission_files').delete().in('mission_id', missionIds);
    await supabase.from('missions').delete().in('id', missionIds);
  }

  await supabase.from('profiles').delete().eq('id', userId);

  const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteAuthError) {
    return toJson({ error: deleteAuthError.message }, 500);
  }

  return toJson({ success: true }, 200);
});
