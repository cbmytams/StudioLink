import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '@/services/reviewService';
import { useToast } from '@/components/ui/Toast';

export function useReviews(reviewedId?: string) {
  return useQuery({
    queryKey: ['reviews', reviewedId],
    queryFn: async () => {
      if (!reviewedId) return [];
      return reviewService.getReviewsForUser(reviewedId);
    },
    enabled: Boolean(reviewedId),
  });
}

export function useCreateReview(reviewerId?: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (input: { missionId: string; reviewedId: string; rating: number; comment?: string }) => {
      if (!reviewerId) throw new Error('Utilisateur manquant');
      return reviewService.createReview(
        input.missionId,
        input.reviewedId,
        input.rating,
        input.comment,
        reviewerId,
      );
    },
    onSuccess: () => {
      showToast({ title: 'Avis envoyé', variant: 'default' });
      void queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Impossible d’envoyer votre avis.';
      showToast({
        title: 'Envoi impossible',
        description: message,
        variant: 'destructive',
      });
    },
  });
}
