import { supabase } from '@/lib/supabaseClient';
import type {
  AvailabilitySlot,
  NotificationPreferences,
  Profile,
  ProProfileRecord,
  StudioProfileRecord,
  UserType,
} from '@/types/backend';

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

export const profileService = {
  async getProfile(userId: string): Promise<Profile> {
    const client = ensureClient();
    const { data, error } = await client.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data as Profile;
  },

  async getProProfile(userId: string): Promise<ProProfileRecord> {
    const client = ensureClient();
    const { data, error } = await client
      .from('pro_profiles')
      .select('*')
      .eq('profile_id', userId)
      .single();
    if (error) throw error;
    return {
      ...(data as ProProfileRecord),
      availability_slots: ((data as { availability_slots?: AvailabilitySlot[] }).availability_slots ?? []),
    };
  },

  async getStudioProfile(userId: string): Promise<StudioProfileRecord> {
    const client = ensureClient();
    const { data, error } = await client
      .from('studio_profiles')
      .select('*')
      .eq('profile_id', userId)
      .single();
    if (error) throw error;
    return data as StudioProfileRecord;
  },

  async updateProfile(userId: string, data: Partial<Profile>): Promise<void> {
    const client = ensureClient();
    const { error } = await client.from('profiles').update(data).eq('id', userId);
    if (error) throw error;
  },

  async upsertProProfile(userId: string, data: Partial<ProProfileRecord>): Promise<void> {
    const client = ensureClient();
    const payload = { ...data, profile_id: userId };
    const { error } = await client.from('pro_profiles').upsert(payload);
    if (error) throw error;
  },

  async upsertStudioProfile(userId: string, data: Partial<StudioProfileRecord>): Promise<void> {
    const client = ensureClient();
    const payload = { ...data, profile_id: userId };
    const { error } = await client.from('studio_profiles').upsert(payload);
    if (error) throw error;
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const client = ensureClient();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${userId}/avatar.${ext}`;
    const { error } = await client.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = client.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  },

  calculateProCompletionScore(profile: Partial<ProProfileRecord>, base: Partial<Profile>): number {
    let score = 0;
    if (base.display_name) score += 20;
    if (base.avatar_url) score += 20;
    if (profile.bio) score += 20;
    if (profile.services && profile.services.length > 0) score += 20;
    if (profile.min_rate && profile.min_rate > 0) score += 20;
    return score;
  },
};

// Legacy exports kept for existing pages
export async function getMyProfile(userId: string): Promise<Profile | null> {
  try {
    return await profileService.getProfile(userId);
  } catch {
    return null;
  }
}

export async function upsertStudioProfile(payload: Omit<StudioProfileRecord, 'updated_at'>) {
  await profileService.upsertStudioProfile(payload.profile_id, payload);
}

export async function upsertProProfile(payload: Omit<ProProfileRecord, 'updated_at'>) {
  await profileService.upsertProProfile(payload.profile_id, payload);
}

export async function getMyStudioProfile(userId: string): Promise<StudioProfileRecord | null> {
  try {
    return await profileService.getStudioProfile(userId);
  } catch {
    return null;
  }
}

export async function getMyProProfile(userId: string): Promise<ProProfileRecord | null> {
  try {
    return await profileService.getProProfile(userId);
  } catch {
    return null;
  }
}

export async function setOnboardingProgress(userId: string, step: number, complete: boolean) {
  await profileService.updateProfile(userId, {
    onboarding_step: step,
    onboarding_complete: complete,
  } as Partial<Profile>);
}

export async function updateProfileIdentity(
  userId: string,
  payload: { display_name?: string | null; avatar_url?: string | null; user_type?: UserType },
) {
  await profileService.updateProfile(userId, payload as Partial<Profile>);
}

export async function updateNotificationPreferences(userId: string, prefs: NotificationPreferences) {
  await profileService.updateProfile(userId, { notification_preferences: prefs } as Partial<Profile>);
}
