import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import type { ChatFileType, SessionRecord } from '@/types/backend';
import { getPublicProfilesMap, type PublicProfileRecord } from '@/services/publicProfileService';
import { detectChatFileType, normalizeChatMessageRow, type NormalizedChatMessage } from './chatUtils';

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

type SessionProfileRow = PublicProfileRecord;

type SessionMissionRow = {
  id: string;
  title: string | null;
};

type SessionRow = SessionRecord & {
  mission?: SessionMissionRow | SessionMissionRow[] | null;
};

type MessageRow = {
  id: string;
  session_id: string | null;
  conversation_id?: string | null;
  sender_id: string;
  content: string | null;
  file_url: string | null;
  file_name?: string | null;
  file_type?: ChatFileType | null;
  is_read?: boolean | null;
  read?: boolean | null;
  read_at?: string | null;
  created_at: string;
};

function asSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export type ChatSession = SessionRecord & {
  mission: SessionMissionRow | null;
  studio: SessionProfileRow | null;
  pro: SessionProfileRow | null;
};

export type ChatMessage = NormalizedChatMessage;

export type ChatUpload = {
  fileUrl: string;
  fileName: string;
  fileType: ChatFileType;
};

function mapSessionRow(
  row: SessionRow,
  profilesById: Map<string, SessionProfileRow>,
): ChatSession {
  return {
    id: row.id,
    mission_id: row.mission_id,
    studio_id: row.studio_id,
    pro_id: row.pro_id,
    application_id: row.application_id,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    completed_at: row.completed_at ?? null,
    mission: asSingle(row.mission),
    studio: profilesById.get(row.studio_id) ?? null,
    pro: profilesById.get(row.pro_id) ?? null,
  };
}

async function fetchSessionProfiles(rows: Array<Pick<SessionRow, 'studio_id' | 'pro_id'>>) {
  const ids = rows.flatMap((row) => [row.studio_id, row.pro_id]);
  return getPublicProfilesMap(ids);
}

export const chatService = {
  async getSession(sessionId: string): Promise<ChatSession> {
    const client = ensureClient();
    const { data, error } = await client
      .from('sessions')
      .select(`
        id,
        mission_id,
        studio_id,
        pro_id,
        application_id,
        status,
        created_at,
        updated_at,
        completed_at,
        mission:missions!sessions_mission_id_fkey (
          id,
          title
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    const row = data as unknown as SessionRow;
    const profilesById = await fetchSessionProfiles([row]);
    return mapSessionRow(row, profilesById);
  },

  async getSessionByMissionId(missionId: string): Promise<ChatSession | null> {
    const client = ensureClient();
    const { data, error } = await client
      .from('sessions')
      .select(`
        id,
        mission_id,
        studio_id,
        pro_id,
        application_id,
        status,
        created_at,
        updated_at,
        completed_at,
        mission:missions!sessions_mission_id_fkey (
          id,
          title
        )
      `)
      .eq('mission_id', missionId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    const row = data as unknown as SessionRow;
    const profilesById = await fetchSessionProfiles([row]);
    return mapSessionRow(row, profilesById);
  },

  async getOrCreateSession(missionId: string): Promise<ChatSession> {
    const client = ensureClient();
    const { data, error } = await client.rpc('get_or_create_session_for_mission', {
      p_mission_id: missionId,
    });

    if (error) throw error;

    const sessionId = Array.isArray(data) ? data[0] : data;
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Session de chat introuvable.');
    }

    return this.getSession(sessionId);
  },

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const client = ensureClient();
    const { data, error } = await client
      .from('messages')
      .select('id, session_id, sender_id, content, file_url, file_name, file_type, is_read, read, read_at, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return ((data as MessageRow[] | null) ?? []).map(normalizeChatMessageRow);
  },

  async sendMessage(
    sessionId: string,
    senderId: string,
    content: string,
    attachment?: ChatUpload,
  ): Promise<ChatMessage> {
    const client = ensureClient();
    const payload = {
      session_id: sessionId,
      sender_id: senderId,
      content: content.trim() ? content.trim() : null,
      file_url: attachment?.fileUrl ?? null,
      file_name: attachment?.fileName ?? null,
      file_type: attachment?.fileType ?? null,
      is_read: false,
      read: false,
      read_at: null,
    };

    const { data, error } = await client
      .from('messages')
      .insert(payload)
      .select('id, session_id, sender_id, content, file_url, file_name, file_type, is_read, read, read_at, created_at')
      .single();

    if (error) throw error;

    const { error: sessionError } = await client
      .from('sessions')
      .update({ updated_at: new Date().toISOString() } as never)
      .eq('id', sessionId);

    if (sessionError) {
      // Non bloquant pour l'expérience chat.
    }

    return normalizeChatMessageRow(data as MessageRow);
  },

  subscribeToMessages(sessionId: string, onNewMessage: (message: ChatMessage) => void): RealtimeChannel {
    const client = ensureClient();
    return client
      .channel(`chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => onNewMessage(normalizeChatMessageRow(payload.new as MessageRow)),
      )
      .subscribe();
  },

  async markMessagesAsRead(sessionId: string): Promise<void> {
    const client = ensureClient();
    const { error } = await client.rpc('mark_session_messages_as_read', {
      p_session_id: sessionId,
    });
    if (error) throw error;
  },

  async getUnreadCount(userId: string): Promise<number> {
    const client = ensureClient();
    const { data, error } = await client
      .from('sessions')
      .select('id')
      .or(`studio_id.eq.${userId},pro_id.eq.${userId}`);

    if (error) throw error;
    const sessionIds = ((data as Array<{ id: string }> | null) ?? []).map((session) => session.id);
    if (sessionIds.length === 0) return 0;

    const { count, error: countError } = await client
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('session_id', sessionIds)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (countError) throw countError;
    return count ?? 0;
  },

  async listSessions(userId: string): Promise<ChatSession[]> {
    const client = ensureClient();
    const { data, error } = await client
      .from('sessions')
      .select(`
        id,
        mission_id,
        studio_id,
        pro_id,
        application_id,
        status,
        created_at,
        updated_at,
        completed_at,
        mission:missions!sessions_mission_id_fkey (
          id,
          title
        )
      `)
      .or(`studio_id.eq.${userId},pro_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    const rows = (data as SessionRow[] | null) ?? [];
    const profilesById = await fetchSessionProfiles(rows);
    return rows.map((row) => mapSessionRow(row, profilesById));
  },

  async uploadFile(file: File, userId: string): Promise<ChatUpload> {
    const client = ensureClient();
    const safeName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const path = `${userId}/${safeName}`;
    const { error } = await client.storage.from('message-files').upload(path, file, {
      upsert: false,
    });

    if (error) throw error;

    return {
      fileUrl: path,
      fileName: file.name,
      fileType: detectChatFileType(file),
    };
  },
};
