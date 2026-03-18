import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { missionService } from '@/services/missionService';
import type { CreateMissionInput, MissionStatus } from '@/types/backend';
import { useToast } from '@/components/ui/Toast';

export function useMissions(studioId?: string, status?: MissionStatus) {
  return useQuery({
    queryKey: ['missions', studioId, status],
    queryFn: async () => {
      if (!studioId) return [];
      return missionService.getStudioMissions(studioId, status);
    },
    enabled: Boolean(studioId),
  });
}

export function usePublishedMissions(filters?: { serviceType?: string; search?: string }) {
  return useQuery({
    queryKey: ['missions', 'published', filters],
    queryFn: () => missionService.getPublishedMissions(filters),
  });
}

export function useMission(missionId?: string) {
  return useQuery({
    queryKey: ['mission', missionId],
    queryFn: async () => {
      if (!missionId) throw new Error('Mission manquante');
      return missionService.getMissionById(missionId);
    },
    enabled: Boolean(missionId),
  });
}

export function useCreateMission(studioId?: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: async (input: CreateMissionInput) => {
      if (!studioId) throw new Error('Studio non identifié');
      return missionService.createMission(studioId, input);
    },
    onSuccess: () => {
      showToast({ title: 'Mission créée !', variant: 'default' });
      void queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });
}

export function useUpdateMissionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MissionStatus }) =>
      missionService.updateMissionStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['missions'] });
      void queryClient.invalidateQueries({ queryKey: ['mission'] });
    },
  });
}

export function useDeleteMission() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (id: string) => missionService.deleteMission(id),
    onSuccess: () => {
      showToast({ title: 'Mission supprimée', variant: 'default' });
      void queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });
}
