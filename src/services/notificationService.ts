import { supabase } from '@/lib/supabaseClient';
import type { NotificationRecord } from '@/types/backend';

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

export const notificationService = {
  async getNotifications(userId: string): Promise<NotificationRecord[]> {
    const client = ensureClient();
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as NotificationRecord[];
  },

  async markAsRead(id: string): Promise<void> {
    const client = ensureClient();
    const { error } = await client.from('notifications').update({ read: true }).eq('id', id);
    if (error) throw error;
  },

  async markAllRead(userId: string): Promise<void> {
    const client = ensureClient();
    const { error } = await client
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) throw error;
  },

  async getUnreadCount(userId: string): Promise<number> {
    const client = ensureClient();
    const { count, error } = await client
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) throw error;
    return count ?? 0;
  },
};
