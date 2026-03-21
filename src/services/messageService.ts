import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import type { ConversationRecord, MessageRecord } from '@/types/backend';

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

export const messageService = {
  async getConversations(userId: string): Promise<ConversationRecord[]> {
    const client = ensureClient();
    const primary = await client
      .from('conversations')
      .select('id, created_at, studio_id, pro_id, participant_1, participant_2, last_message_at')
      .or(`studio_id.eq.${userId},pro_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (!primary.error) {
      const rows = (primary.data ?? []) as Array<{
        id: string
        created_at: string
        studio_id?: string | null
        pro_id?: string | null
        participant_1?: string | null
        participant_2?: string | null
      }>;

      return rows.map((row) => ({
        id: row.id,
        participant_1: row.participant_1 ?? row.studio_id ?? '',
        participant_2: row.participant_2 ?? row.pro_id ?? '',
        created_at: row.created_at,
      }));
    }

    const fallback = await client
      .from('conversations')
      .select('*')
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (fallback.error) throw fallback.error;
    return (fallback.data ?? []) as ConversationRecord[];
  },

  async getUnreadConversationCount(userId: string): Promise<number> {
    const client = ensureClient();
    const conversations = await this.getConversations(userId);
    if (conversations.length === 0) return 0;
    const conversationIds = conversations.map((conversation) => conversation.id);
    const { count, error } = await client
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .eq('read', false)
      .neq('sender_id', userId);
    if (error) throw error;
    return count ?? 0;
  },

  async getMessages(conversationId: string): Promise<MessageRecord[]> {
    const client = ensureClient();
    const { data, error } = await client
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as MessageRecord[];
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    fileUrl?: string,
  ): Promise<MessageRecord> {
    const client = ensureClient();
    const payload = {
      conversation_id: conversationId,
      sender_id: senderId,
      content: content || null,
      file_url: fileUrl ?? null,
    };
    const { data, error } = await client.from('messages').insert(payload).select('*').single();
    if (error) throw error;
    return data as MessageRecord;
  },

  async getOrCreateConversation(userId1: string, userId2: string): Promise<ConversationRecord> {
    const client = ensureClient();
    const primaryExisting = await client
      .from('conversations')
      .select('id, created_at, studio_id, pro_id, participant_1, participant_2')
      .or(
        `and(studio_id.eq.${userId1},pro_id.eq.${userId2}),and(studio_id.eq.${userId2},pro_id.eq.${userId1})`,
      )
      .maybeSingle();

    if (!primaryExisting.error && primaryExisting.data) {
      const row = primaryExisting.data as {
        id: string
        created_at: string
        studio_id?: string | null
        pro_id?: string | null
        participant_1?: string | null
        participant_2?: string | null
      };
      return {
        id: row.id,
        participant_1: row.participant_1 ?? row.studio_id ?? '',
        participant_2: row.participant_2 ?? row.pro_id ?? '',
        created_at: row.created_at,
      };
    }

    if (primaryExisting.error) {
      const legacyExisting = await client
        .from('conversations')
        .select('*')
        .or(
          `and(participant_1.eq.${userId1},participant_2.eq.${userId2}),and(participant_1.eq.${userId2},participant_2.eq.${userId1})`,
        )
        .maybeSingle();
      if (legacyExisting.error) throw legacyExisting.error;
      if (legacyExisting.data) return legacyExisting.data as ConversationRecord;
    }

    const primaryInsert = await client
      .from('conversations')
      .insert({ studio_id: userId1, pro_id: userId2, last_message_at: new Date().toISOString() } as never)
      .select('id, created_at, studio_id, pro_id')
      .single();

    if (!primaryInsert.error) {
      const row = primaryInsert.data as {
        id: string
        created_at: string
        studio_id?: string | null
        pro_id?: string | null
      };
      return {
        id: row.id,
        participant_1: row.studio_id ?? '',
        participant_2: row.pro_id ?? '',
        created_at: row.created_at,
      };
    }

    const fallbackInsert = await client
      .from('conversations')
      .insert({ participant_1: userId1, participant_2: userId2 })
      .select('*')
      .single();

    if (fallbackInsert.error) throw fallbackInsert.error;
    return fallbackInsert.data as ConversationRecord;
  },

  subscribeToMessages(conversationId: string, onMessage: (message: MessageRecord) => void): RealtimeChannel {
    const client = ensureClient();
    return client
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => onMessage(payload.new as MessageRecord),
      )
      .subscribe();
  },

  async uploadFile(file: File, userId: string): Promise<string> {
    const client = ensureClient();
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await client.storage.from('message-files').upload(path, file, {
      upsert: false,
    });
    if (error) throw error;
    const { data } = client.storage.from('message-files').getPublicUrl(path);
    return data.publicUrl;
  },
};
