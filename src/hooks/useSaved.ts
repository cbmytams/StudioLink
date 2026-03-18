import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { savedService } from '@/services/savedService';
import type { SavedItemType } from '@/types/backend';

export function useSavedItems(userId?: string) {
  return useQuery({
    queryKey: ['saved', userId],
    queryFn: async () => {
      if (!userId) return [];
      return savedService.getSavedItems(userId);
    },
    enabled: Boolean(userId),
  });
}

export function useToggleSave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      itemId,
      itemType,
    }: {
      userId: string;
      itemId: string;
      itemType: SavedItemType;
    }) => savedService.toggleSave(userId, itemId, itemType),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['saved'] });
    },
  });
}
