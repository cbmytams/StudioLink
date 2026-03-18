import { supabase } from '@/lib/supabase/client';
import type { CreateReviewInput, ReviewRecord } from '@/types/backend';

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

export const reviewService = {
  async getReviews(revieweeId: string): Promise<ReviewRecord[]> {
    const client = ensureClient();
    const { data, error } = await client
      .from('reviews')
      .select('*')
      .eq('reviewee_id', revieweeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ReviewRecord[];
  },

  async createReview(input: CreateReviewInput, reviewerId: string): Promise<ReviewRecord> {
    const client = ensureClient();
    const payload = {
      reviewer_id: reviewerId,
      reviewee_id: input.reviewee_id,
      mission_id: input.mission_id,
      rating: input.rating,
      comment: input.comment ?? null,
    };
    const { data, error } = await client.from('reviews').insert(payload).select('*').single();
    if (error) throw error;
    return data as ReviewRecord;
  },

  async canReview(reviewerId: string, revieweeId: string, missionId: string): Promise<boolean> {
    const client = ensureClient();
    const { count: missionCount, error: missionError } = await client
      .from('missions')
      .select('id', { count: 'exact', head: true })
      .eq('id', missionId)
      .eq('status', 'completed');
    if (missionError) throw missionError;
    if ((missionCount ?? 0) === 0) return false;

    const { count: existingCount, error: existingError } = await client
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('reviewer_id', reviewerId)
      .eq('reviewee_id', revieweeId)
      .eq('mission_id', missionId);
    if (existingError) throw existingError;

    return (existingCount ?? 0) === 0;
  },
};
