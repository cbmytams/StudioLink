import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase/auth';
import { profileService } from '@/services/profileService';
import type { Profile, ProProfileRecord, StudioProfileRecord } from '@/types/backend';
import { useToast } from '@/components/ui/Toast';

export function useMyProfile() {
  const { profile } = useAuth();
  return profile;
}

export function useProfileData(userId?: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('Profil manquant');
      return profileService.getProfile(userId);
    },
    enabled: Boolean(userId),
  });
}

export function useProProfile(userId?: string) {
  return useQuery({
    queryKey: ['pro-profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('Profil pro manquant');
      return profileService.getProProfile(userId);
    },
    enabled: Boolean(userId),
  });
}

export function useStudioProfile(userId?: string) {
  return useQuery({
    queryKey: ['studio-profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('Profil studio manquant');
      return profileService.getStudioProfile(userId);
    },
    enabled: Boolean(userId),
  });
}

export function useUpdateProfile(userId?: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      if (!userId) throw new Error('Utilisateur manquant');
      await profileService.updateProfile(userId, data);
    },
    onSuccess: () => {
      showToast({ title: 'Profil mis à jour', variant: 'default' });
      void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}

export function useUpsertProProfile(userId?: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: async (data: Partial<ProProfileRecord>) => {
      if (!userId) throw new Error('Utilisateur manquant');
      await profileService.upsertProProfile(userId, data);
    },
    onSuccess: () => {
      showToast({ title: 'Profil Pro sauvegardé', variant: 'default' });
      void queryClient.invalidateQueries({ queryKey: ['pro-profile'] });
    },
  });
}

export function useUpsertStudioProfile(userId?: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: async (data: Partial<StudioProfileRecord>) => {
      if (!userId) throw new Error('Utilisateur manquant');
      await profileService.upsertStudioProfile(userId, data);
    },
    onSuccess: () => {
      showToast({ title: 'Profil Studio sauvegardé', variant: 'default' });
      void queryClient.invalidateQueries({ queryKey: ['studio-profile'] });
    },
  });
}

export function useUploadAvatar(userId?: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!userId) throw new Error('Utilisateur manquant');
      return profileService.uploadAvatar(userId, file);
    },
    onSuccess: async (avatarUrl) => {
      if (userId) {
        await profileService.updateProfile(userId, { avatar_url: avatarUrl } as Partial<Profile>);
      }
      showToast({ title: 'Avatar mis à jour', variant: 'default' });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
