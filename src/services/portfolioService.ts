import { supabase } from '@/lib/supabase/client';
import type { PortfolioItem } from '@/types/backend';
import type { Database } from '@/types/supabase';

const PORTFOLIO_ITEM_SELECT_COLUMNS = 'id, pro_id, title, description, url, image_url, created_at';

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

export const portfolioService = {
  async getPortfolioItems(proId: string): Promise<PortfolioItem[]> {
    const client = ensureClient();
    const { data, error } = await client
      .from('portfolio_items')
      .select(PORTFOLIO_ITEM_SELECT_COLUMNS)
      .eq('pro_id', proId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as PortfolioItem[];
  },

  async addPortfolioItem(
    proId: string,
    title: string,
    description?: string | null,
    url?: string | null,
  ): Promise<PortfolioItem> {
    const client = ensureClient();
    const payload: Database['public']['Tables']['portfolio_items']['Insert'] = {
      pro_id: proId,
      title,
      description: description?.trim() ? description.trim() : null,
      url: url?.trim() || '',
    };

    const { data, error } = await client
      .from('portfolio_items')
      .insert(payload)
      .select(PORTFOLIO_ITEM_SELECT_COLUMNS)
      .single();

    if (error) throw error;
    return data as PortfolioItem;
  },

  async deletePortfolioItem(id: string): Promise<void> {
    const client = ensureClient();
    const { error } = await client
      .from('portfolio_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
