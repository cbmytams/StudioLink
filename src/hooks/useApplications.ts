import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '@/services/applicationService';
import type { ApplicationStatus, CreateApplicationInput } from '@/types/backend';
import { useToast } from '@/components/ui/Toast';

export function useMissionApplications(missionId?: string) {
  return useQuery({
    queryKey: ['applications', 'mission', missionId],
    queryFn: async () => {
      if (!missionId) return [];
      return applicationService.getMissionApplications(missionId);
    },
    enabled: Boolean(missionId),
  });
}

export function useMyApplications(proId?: string) {
  return useQuery({
    queryKey: ['applications', 'pro', proId],
    queryFn: async () => {
      if (!proId) return [];
      return applicationService.getMyApplications(proId);
    },
    enabled: Boolean(proId),
  });
}

export function useCreateApplication(proId?: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: async (input: CreateApplicationInput) => {
      if (!proId) throw new Error('Profil pro manquant');
      return applicationService.createApplication(input, proId);
    },
    onSuccess: () => {
      showToast({ title: 'Candidature envoyée !', variant: 'default' });
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
      void queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      status === 'accepted'
        ? applicationService.acceptApplication(id)
        : applicationService.rejectApplication(id),
    onSuccess: (_data, variables) => {
      const label = variables.status === 'accepted' ? 'Candidature retenue' : 'Candidature mise à jour';
      showToast({ title: label, variant: 'default' });
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
      void queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });
}
