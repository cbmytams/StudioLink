import { supabase } from '@/lib/supabase/client';
import { getPublicProfilesMap } from '@/services/publicProfileService';
import type { ReviewRecord } from '@/types/backend';

const REVIEW_SELECT_COLUMNS = 'id, reviewer_id, reviewee_id, mission_id, rating, comment, created_at';

export type ReviewWithReviewer = ReviewRecord & {
  reviewer_name: string;
};

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

function resolveReviewerName(profile: {
  display_name?: string | null;
} | null | undefined): string {
  return (
    profile?.display_name
    ?? 'Utilisateur'
  );
}

export const reviewService = {
  async createReview(
    missionId: string,
    reviewedId: string,
    rating: number,
    comment: string | null | undefined,
    reviewerId: string,
  ): Promise<ReviewRecord> {
    const client = ensureClient();
    const payload = {
      reviewer_id: reviewerId,
      reviewee_id: reviewedId,
      mission_id: missionId,
      rating,
      comment: comment?.trim() ? comment.trim() : null,
    };
    const { data, error } = await client.from('reviews').insert(payload).select(REVIEW_SELECT_COLUMNS).single();
    if (error) throw error;
    return data as ReviewRecord;
  },

  async hasReviewed(missionId: string, reviewerId: string): Promise<boolean> {
    const client = ensureClient();
    const { data, error } = await client
      .from('reviews')
      .select('id')
      .eq('mission_id', missionId)
      .eq('reviewer_id', reviewerId)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data?.id);
  },

  async getReviewsForUser(userId: string): Promise<ReviewWithReviewer[]> {
    const client = ensureClient();
    const { data, error } = await client
      .from('reviews')
      .select('id, reviewer_id, reviewee_id, mission_id, rating, comment, created_at')
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const reviews = (data ?? []) as ReviewRecord[];
    if (reviews.length === 0) return [];

    const reviewerIds = Array.from(new Set(reviews.map((review) => review.reviewer_id)));
    const profilesById = await getPublicProfilesMap(reviewerIds);

    return reviews.map((review) => ({
      ...review,
      reviewer_name: resolveReviewerName(profilesById.get(review.reviewer_id)),
    }));
  },

  async getAverageRating(userId: string): Promise<number | null> {
    const reviews = await this.getReviewsForUser(userId);
    if (reviews.length === 0) return null;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  },
};
