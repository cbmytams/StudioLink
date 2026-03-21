import { supabase } from '@/lib/supabase/client';

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

function getExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext && /^[a-z0-9]+$/.test(ext)) return ext;
  return 'jpg';
}

function extractAvatarPathFromUrl(url: string): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const marker = '/avatars/';
    const index = parsed.pathname.indexOf(marker);
    if (index < 0) return null;

    const rawPath = parsed.pathname.slice(index + marker.length);
    if (!rawPath) return null;
    return decodeURIComponent(rawPath);
  } catch {
    const marker = '/avatars/';
    const index = url.indexOf(marker);
    if (index < 0) return null;
    const rawPath = url.slice(index + marker.length).split('?')[0];
    return rawPath || null;
  }
}

export const avatarService = {
  async uploadAvatar(userId: string, file: File): Promise<string> {
    const client = ensureClient();
    const ext = getExtension(file.name);
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await client.storage
      .from('avatars')
      .upload(path, file, { upsert: false, contentType: file.type || undefined });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = client.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  },

  async updateAvatarUrl(userId: string, url: string): Promise<void> {
    const client = ensureClient();
    const { error } = await client
      .from('profiles')
      .update({
        avatar_url: url,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', userId);

    if (error) {
      throw error;
    }
  },

  async deleteOldAvatar(oldUrl: string): Promise<void> {
    const client = ensureClient();
    const path = extractAvatarPathFromUrl(oldUrl);
    if (!path) return;

    const { error } = await client.storage.from('avatars').remove([path]);
    if (error) {
      throw error;
    }
  },
};
