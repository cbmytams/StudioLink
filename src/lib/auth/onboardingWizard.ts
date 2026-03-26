import type { UserType } from '@/types/backend';

type MaybeUserType = UserType | '';

export type OnboardingDraft = {
  role: MaybeUserType;
  displayName: string;
  city: string;
  avatarUrl: string | null;
  companyName: string;
  bio: string;
  skills: string[];
  skillInput: string;
  dailyRate: string;
};

type ExistingProfile = {
  display_name?: string | null;
  full_name?: string | null;
  city?: string | null;
  avatar_url?: string | null;
  company_name?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  daily_rate?: number | null;
  type?: UserType | null;
  user_type?: UserType | null;
} | null;

type StepErrors = Partial<Record<'role' | 'displayName' | 'bio' | 'skills' | 'dailyRate' | 'companyName', string>>;

function resolveRole(profile: ExistingProfile, invitationType?: UserType | null): MaybeUserType {
  const value = profile?.user_type ?? profile?.type ?? invitationType ?? null;
  return value === 'studio' || value === 'pro' ? value : '';
}

export function normalizeSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const rawSkill of skills) {
    const skill = rawSkill.trim();
    if (!skill) continue;

    const key = skill.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(skill);

    if (normalized.length >= 5) break;
  }

  return normalized;
}

export function createInitialOnboardingDraft(
  profile: ExistingProfile,
  invitationType?: UserType | null,
): OnboardingDraft {
  return {
    role: resolveRole(profile, invitationType),
    displayName: profile?.display_name ?? profile?.full_name ?? '',
    city: profile?.city ?? '',
    avatarUrl: profile?.avatar_url ?? null,
    companyName: profile?.company_name ?? '',
    bio: profile?.bio ?? '',
    skills: normalizeSkills(profile?.skills ?? []),
    skillInput: '',
    dailyRate: profile?.daily_rate ? String(profile.daily_rate) : '',
  };
}

export function getCurrentStepErrors(step: number, draft: OnboardingDraft): StepErrors {
  if (step === 1) {
    return draft.role ? {} : { role: 'Choisis ton type de compte.' };
  }

  if (step === 2) {
    return draft.displayName.trim()
      ? {}
      : { displayName: 'Le nom affiché est requis.' };
  }

  if (step !== 3) return {};

  if (draft.role === 'studio') {
    return draft.companyName.trim()
      ? {}
      : { companyName: 'Le nom du studio est requis.' };
  }

  if (draft.role === 'pro') {
    const errors: StepErrors = {};

    if (draft.bio.trim().length < 50) {
      errors.bio = 'La présentation doit contenir au moins 50 caractères.';
    }
    if (normalizeSkills(draft.skills).length === 0) {
      errors.skills = 'Ajoute au moins une compétence.';
    }
    if (!draft.dailyRate.trim()) {
      errors.dailyRate = 'Le tarif journalier est requis.';
    }

    return errors;
  }

  return { role: 'Choisis ton type de compte.' };
}

export function buildOnboardingProfilePayload(userId: string, draft: OnboardingDraft) {
  if (draft.role !== 'studio' && draft.role !== 'pro') {
    throw new Error('Type de compte invalide pendant l’onboarding.');
  }

  const role: UserType = draft.role;
  const now = new Date().toISOString();
  const skills = normalizeSkills(draft.skills);
  const dailyRate = role === 'pro' && draft.dailyRate.trim()
    ? Number.parseInt(draft.dailyRate, 10)
    : null;

  return {
    id: userId,
    display_name: draft.displayName.trim(),
    full_name: draft.displayName.trim(),
    city: draft.city.trim() || null,
    avatar_url: draft.avatarUrl,
    company_name: role === 'studio' ? (draft.companyName.trim() || draft.displayName.trim()) : null,
    bio: draft.bio.trim() || null,
    skills: role === 'pro' ? skills : [],
    daily_rate: role === 'pro' && Number.isFinite(dailyRate) ? dailyRate : null,
    type: role,
    user_type: role,
    onboarding_complete: true,
    onboarding_completed: true,
    onboarding_step: 4,
    updated_at: now,
  };
}
