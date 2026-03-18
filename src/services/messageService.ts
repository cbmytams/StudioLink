import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
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
    const { data, error } = await client
      .from('conversations')
      .select('*')
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ConversationRecord[];
  },

  async getUnreadConversationCount(userId: string): Promise<number> {
    const client = ensureClient();
    const conversations = await this.getConversations(userId);
    if (conversations.length === 0) return 0;
    const conversationIds = conversations.map((conversation) => conversation.id);
    const { data, error } = await client
      .from('messages')
      .select('conversation_id,sender_id,read')
      .in('conversation_id', conversationIds)
      .eq('read', false)
      .neq('sender_id', userId);
    if (error) throw error;
    const ids = new Set((data ?? []).map((row) => row.conversation_id as string));
    return ids.size;
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
    const { data: existing, error: existingError } = await client
      .from('conversations')
      .select('*')
      .or(
        `and(participant_1.eq.${userId1},participant_2.eq.${userId2}),and(participant_1.eq.${userId2},participant_2.eq.${userId1})`,
      )
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) return existing as ConversationRecord;

    const { data, error } = await client
      .from('conversations')
      .insert({ participant_1: userId1, participant_2: userId2 })
      .select('*')
      .single();
    if (error) throw error;
    return data as ConversationRecord;
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
