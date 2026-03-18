import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '@/services/reviewService';
import type { CreateReviewInput } from '@/types/backend';
import { useToast } from '@/components/ui/Toast';

export function useReviews(revieweeId?: string) {
  return useQuery({
    queryKey: ['reviews', revieweeId],
    queryFn: async () => {
      if (!revieweeId) return [];
      return reviewService.getReviews(revieweeId);
    },
    enabled: Boolean(revieweeId),
  });
}

export function useCreateReview(reviewerId?: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      if (!reviewerId) throw new Error('Utilisateur manquant');
      return reviewService.createReview(input, reviewerId);
    },
    onSuccess: () => {
      showToast({ title: 'Avis envoyé', variant: 'default' });
      void queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}
