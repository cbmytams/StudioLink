import type { UserType } from '@/types/backend';

type ProfileLike = {
  display_name?: string | null;
  full_name?: string | null;
  bio?: string | null;
  type?: string | null;
  user_type?: string | null;
} | null;

export function resolveProfileType(profile: ProfileLike): UserType | null {
  const value = profile?.user_type ?? profile?.type ?? null;
  return value === 'studio' || value === 'pro' ? value : null;
}

export function getProfileDisplayName(profile: ProfileLike): string {
  return profile?.display_name?.trim()
    || profile?.full_name?.trim()
    || '';
}

export function isProfileIncomplete(profile: ProfileLike): boolean {
  const profileType = resolveProfileType(profile);
  if (!profileType) return true;

  const displayName = getProfileDisplayName(profile);
  if (!displayName) return true;

  if (profileType === 'pro') {
    return !(profile?.bio?.trim() ?? '');
  }

  return false;
}

export function getDashboardPath(profileType: UserType | null): string {
  if (profileType === 'studio') return '/studio/dashboard';
  if (profileType === 'pro') return '/pro/dashboard';
  return '/';
}
