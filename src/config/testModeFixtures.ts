export type TestModeUserType = 'studio' | 'pro';

export type TestModeSeedProfile = {
  display_name: string;
  full_name: string;
  company_name: string | null;
  city: string | null;
  bio: string | null;
  skills: string[];
  daily_rate: number | null;
  avatar_url: string | null;
  onboarding_complete: boolean;
  onboarding_completed: boolean;
  onboarding_step: number;
};

export type TestModeSeedAccount = {
  id: string;
  email: string;
  password: string;
  user_type: TestModeUserType;
  profile: TestModeSeedProfile;
};

export type TestModeSeedInvitation = {
  code: string;
  invitation_type: TestModeUserType;
  email: string | null;
  reusable: boolean;
  expires_at: string | null;
};

export const TEST_MODE_DEFAULT_PASSWORD = 'StudioLink!123';

export const TEST_MODE_SEED_ACCOUNTS: TestModeSeedAccount[] = [
  {
    id: 'test-user-studio-phase0',
    email: 'phase0.studio.mn5xe7w4@example.com',
    password: TEST_MODE_DEFAULT_PASSWORD,
    user_type: 'studio',
    profile: {
      display_name: 'Phase0 Studio',
      full_name: 'Phase0 Studio',
      company_name: 'Phase0 Studio',
      city: 'Paris',
      bio: 'Studio de test pour valider les parcours UX en mode local.',
      skills: [],
      daily_rate: null,
      avatar_url: null,
      onboarding_complete: true,
      onboarding_completed: true,
      onboarding_step: 4,
    },
  },
  {
    id: 'test-user-pro-phase0',
    email: 'phase0.pro.mn5xe7w4@example.com',
    password: TEST_MODE_DEFAULT_PASSWORD,
    user_type: 'pro',
    profile: {
      display_name: 'Phase0 Pro',
      full_name: 'Phase0 Pro',
      company_name: null,
      city: 'Paris',
      bio: 'Profil pro de test pour valider candidatures, chat et onboarding.',
      skills: ['Mixage', 'Mastering'],
      daily_rate: 450,
      avatar_url: null,
      onboarding_complete: true,
      onboarding_completed: true,
      onboarding_step: 4,
    },
  },
];

export const TEST_MODE_SEED_INVITATIONS: TestModeSeedInvitation[] = [
  {
    code: 'STUDIO-TEST',
    invitation_type: 'studio',
    email: null,
    reusable: true,
    expires_at: null,
  },
  {
    code: 'PRO-TEST',
    invitation_type: 'pro',
    email: null,
    reusable: true,
    expires_at: null,
  },
];
