import { supabase } from '@/lib/supabase/client';
import type { PortfolioItem } from '@/types/backend';

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
      .from('portfolio_items' as never)
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
    const payload = {
      pro_id: proId,
      title,
      description: description?.trim() ? description.trim() : null,
      url: url?.trim() ? url.trim() : null,
    };

    const { data, error } = await client
      .from('portfolio_items' as never)
      .insert(payload as never)
      .select(PORTFOLIO_ITEM_SELECT_COLUMNS)
      .single();

    if (error) throw error;
    return data as PortfolioItem;
  },

  async deletePortfolioItem(id: string): Promise<void> {
    const client = ensureClient();
    const { error } = await client
      .from('portfolio_items' as never)
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
