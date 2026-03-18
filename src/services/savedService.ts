import { supabase } from '@/lib/supabase/client';
import type { SavedItemRecord, SavedItemType } from '@/types/backend';

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

export const savedService = {
  async getSavedItems(userId: string): Promise<SavedItemRecord[]> {
    const client = ensureClient();
    const { data, error } = await client
      .from('saved_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as SavedItemRecord[];
  },

  async isSaved(userId: string, itemId: string, itemType: SavedItemType): Promise<boolean> {
    const client = ensureClient();
    const { count, error } = await client
      .from('saved_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .eq('item_type', itemType);
    if (error) throw error;
    return (count ?? 0) > 0;
  },

  async toggleSave(userId: string, itemId: string, itemType: SavedItemType): Promise<boolean> {
    const client = ensureClient();
    const currentlySaved = await this.isSaved(userId, itemId, itemType);
    if (currentlySaved) {
      const { error } = await client
        .from('saved_items')
        .delete()
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .eq('item_type', itemType);
      if (error) throw error;
      return false;
    }

    const { error } = await client.from('saved_items').insert({
      user_id: userId,
      item_id: itemId,
      item_type: itemType,
    });
    if (error) throw error;
    return true;
  },
};
