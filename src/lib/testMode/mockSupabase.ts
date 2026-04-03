import type { Session } from '@supabase/supabase-js';
import type { Profile, UserType } from '@/types/backend';
import {
  TEST_MODE_SEED_ACCOUNTS,
  TEST_MODE_SEED_INVITATIONS,
} from '@/config/testModeFixtures';

type StoredAccount = {
  id: string;
  email: string;
  password: string;
  user_type: UserType;
  type: UserType;
  display_name: string | null;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  skills: string[];
  daily_rate: number | null;
  rating_avg: number | null;
  rating_count: number;
  onboarding_complete: boolean;
  onboarding_completed: boolean;
  onboarding_step: number;
  notification_preferences: {
    new_application: boolean;
    messages: boolean;
    status_updates: boolean;
  } | null;
  is_public: boolean;
  contact_email: string | null;
  username: string | null;
  website: string | null;
  search_vector: string | null;
  created_at: string;
  updated_at: string;
};

type StoredInvitation = {
  id: string;
  code: string;
  invitation_type: UserType;
  email: string | null;
  reusable: boolean;
  used_by: string | null;
  expires_at: string | null;
  created_at: string;
};

type MockDatabase = {
  version: number;
  accounts: StoredAccount[];
  invitations: StoredInvitation[];
};

export type MockInvitationLookup = {
  id: string;
  code: string;
  invitation_type: UserType;
  email: string | null;
  used: boolean;
  expires_at: string | null;
  created_at: string;
};

const MOCK_DB_STORAGE_KEY = 'studiolink:test-mode:db:v1';
export const MOCK_SESSION_STORAGE_KEY = 'studiolink:test-mode:session:v1';
const MOCK_DB_VERSION = 1;

function isBrowserRuntime() {
  return typeof window !== 'undefined';
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function firstNameFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? '';
  const cleaned = localPart.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return 'Utilisateur Test';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function toStoredAccount(input: {
  id: string;
  email: string;
  password: string;
  user_type: UserType;
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
  created_at: string;
}): StoredAccount {
  return {
    id: input.id,
    email: normalizeEmail(input.email),
    password: input.password,
    user_type: input.user_type,
    type: input.user_type,
    display_name: input.display_name,
    full_name: input.full_name,
    company_name: input.company_name,
    avatar_url: input.avatar_url,
    bio: input.bio,
    city: input.city,
    skills: input.skills,
    daily_rate: input.daily_rate,
    rating_avg: null,
    rating_count: 0,
    onboarding_complete: input.onboarding_complete,
    onboarding_completed: input.onboarding_completed,
    onboarding_step: input.onboarding_step,
    notification_preferences: {
      new_application: true,
      messages: true,
      status_updates: true,
    },
    is_public: true,
    contact_email: normalizeEmail(input.email),
    username: null,
    website: null,
    search_vector: null,
    created_at: input.created_at,
    updated_at: input.created_at,
  };
}

function createSeedDatabase(): MockDatabase {
  const createdAt = nowIso();
  const accounts = TEST_MODE_SEED_ACCOUNTS.map((seed) =>
    toStoredAccount({
      id: seed.id,
      email: seed.email,
      password: seed.password,
      user_type: seed.user_type,
      display_name: seed.profile.display_name,
      full_name: seed.profile.full_name,
      company_name: seed.profile.company_name,
      city: seed.profile.city,
      bio: seed.profile.bio,
      skills: seed.profile.skills,
      daily_rate: seed.profile.daily_rate,
      avatar_url: seed.profile.avatar_url,
      onboarding_complete: seed.profile.onboarding_complete,
      onboarding_completed: seed.profile.onboarding_completed,
      onboarding_step: seed.profile.onboarding_step,
      created_at: createdAt,
    }));
  const invitations = TEST_MODE_SEED_INVITATIONS.map((seed) => ({
    id: `test-invite-${normalizeCode(seed.code)}`,
    code: normalizeCode(seed.code),
    invitation_type: seed.invitation_type,
    email: seed.email ? normalizeEmail(seed.email) : null,
    reusable: seed.reusable,
    used_by: null,
    expires_at: seed.expires_at,
    created_at: createdAt,
  }));

  return {
    version: MOCK_DB_VERSION,
    accounts,
    invitations,
  };
}

function readStoredDatabase(): MockDatabase | null {
  if (!isBrowserRuntime()) return null;

  try {
    const raw = window.localStorage.getItem(MOCK_DB_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as MockDatabase;
    if (parsed?.version !== MOCK_DB_VERSION) return null;
    if (!Array.isArray(parsed.accounts) || !Array.isArray(parsed.invitations)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredDatabase(db: MockDatabase) {
  if (!isBrowserRuntime()) return;
  try {
    window.localStorage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(db));
  } catch {
    // LocalStorage unavailable: keep in-memory flow only.
  }
}

function loadDatabase(): MockDatabase {
  const stored = readStoredDatabase();
  if (stored) return stored;
  const seeded = createSeedDatabase();
  writeStoredDatabase(seeded);
  return seeded;
}

function findAccountByEmail(db: MockDatabase, email: string): StoredAccount | null {
  const normalized = normalizeEmail(email);
  return db.accounts.find((account) => account.email === normalized) ?? null;
}

function findAccountById(db: MockDatabase, userId: string): StoredAccount | null {
  return db.accounts.find((account) => account.id === userId) ?? null;
}

function findInvitationByCode(db: MockDatabase, code: string): StoredInvitation | null {
  const normalized = normalizeCode(code);
  return db.invitations.find((invitation) => invitation.code === normalized) ?? null;
}

function invitationUsed(invitation: StoredInvitation): boolean {
  if (invitation.reusable) return false;
  return Boolean(invitation.used_by);
}

function invitationExpired(invitation: StoredInvitation): boolean {
  if (!invitation.expires_at) return false;
  return new Date(invitation.expires_at).getTime() < Date.now();
}

function accountToSession(account: StoredAccount): Session {
  const issuedAt = Math.floor(Date.now() / 1000);
  return {
    access_token: `test-access-${account.id}`,
    refresh_token: `test-refresh-${account.id}`,
    token_type: 'bearer',
    expires_in: 60 * 60,
    expires_at: issuedAt + (60 * 60),
    user: {
      id: account.id,
      email: account.email,
      aud: 'authenticated',
      app_metadata: {
        provider: 'email',
        providers: ['email'],
      },
      user_metadata: {
        invitation_type: account.user_type,
      },
      created_at: account.created_at,
    },
  } as unknown as Session;
}

function writeMockSession(session: Session | null) {
  if (!isBrowserRuntime()) return;

  try {
    if (!session) {
      window.localStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(MOCK_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore localStorage errors in test mode.
  }
}

export function readMockSession(): Session | null {
  if (!isBrowserRuntime()) return null;

  try {
    const raw = window.localStorage.getItem(MOCK_SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function seedMockSupabaseStorage() {
  loadDatabase();
}

export function mockSignOut() {
  writeMockSession(null);
}

export async function mockGetCurrentSession() {
  return readMockSession();
}

export function mockGetInvitationByCode(code: string): MockInvitationLookup | null {
  if (!code.trim()) return null;
  const db = loadDatabase();
  const invitation = findInvitationByCode(db, code);
  if (!invitation) return null;

  return {
    id: invitation.id,
    code: invitation.code,
    invitation_type: invitation.invitation_type,
    email: invitation.email,
    used: invitationUsed(invitation),
    expires_at: invitation.expires_at,
    created_at: invitation.created_at,
  };
}

export async function mockConsumeInvitationCode(code: string, userId: string): Promise<void> {
  const db = loadDatabase();
  const invitation = findInvitationByCode(db, code);
  if (!invitation) {
    throw new Error('Code introuvable');
  }
  if (invitationExpired(invitation)) {
    throw new Error('Code expiré');
  }
  if (invitation.reusable) return;
  if (invitation.used_by && invitation.used_by !== userId) {
    throw new Error('Code déjà utilisé');
  }

  invitation.used_by = userId;
  writeStoredDatabase(db);
}

export async function mockClaimInvitation(code: string, userId: string): Promise<boolean> {
  await mockConsumeInvitationCode(code, userId);
  return true;
}

export async function mockSignInWithPassword(
  email: string,
  password: string,
): Promise<{ session: Session; user: Session['user'] }> {
  const db = loadDatabase();
  const account = findAccountByEmail(db, email);
  if (!account || account.password !== password) {
    throw new Error('Invalid login credentials');
  }

  const session = accountToSession(account);
  writeMockSession(session);
  return {
    session,
    user: session.user,
  };
}

export async function mockSignUpWithPassword(params: {
  email: string;
  password: string;
  invitationCode: string;
  userType: UserType;
  displayName?: string;
}): Promise<{ session: Session; user: Session['user'] }> {
  const db = loadDatabase();
  const normalizedEmail = normalizeEmail(params.email);

  if (findAccountByEmail(db, normalizedEmail)) {
    throw new Error('User already registered');
  }

  const invitation = findInvitationByCode(db, params.invitationCode);
  if (!invitation) {
    throw new Error('Code invalide ou expiré');
  }
  if (invitation.invitation_type !== params.userType) {
    throw new Error('Code invitation incompatible');
  }
  if (invitationExpired(invitation)) {
    throw new Error('Code invalide ou expiré');
  }
  if (invitationUsed(invitation)) {
    throw new Error('Code déjà utilisé');
  }

  const createdAt = nowIso();
  const displayName = params.displayName?.trim() || firstNameFromEmail(normalizedEmail);
  const account = toStoredAccount({
    id: `test-user-${Math.random().toString(36).slice(2, 10)}`,
    email: normalizedEmail,
    password: params.password,
    user_type: params.userType,
    display_name: displayName,
    full_name: displayName,
    company_name: params.userType === 'studio' ? displayName : null,
    city: null,
    bio: null,
    skills: [],
    daily_rate: null,
    avatar_url: null,
    onboarding_complete: false,
    onboarding_completed: false,
    onboarding_step: 1,
    created_at: createdAt,
  });

  db.accounts.push(account);
  if (!invitation.reusable) {
    invitation.used_by = account.id;
  }

  writeStoredDatabase(db);

  const session = accountToSession(account);
  writeMockSession(session);
  return {
    session,
    user: session.user,
  };
}

export async function mockGetProfile(userId: string): Promise<Profile | null> {
  const db = loadDatabase();
  const account = findAccountById(db, userId);
  if (!account) return null;

  return {
    ...account,
    email: account.email,
    user_type: account.user_type,
    onboarding_complete: account.onboarding_complete,
    onboarding_step: account.onboarding_step,
    avatar_url: account.avatar_url,
    display_name: account.display_name,
    full_name: account.full_name,
    company_name: account.company_name,
    rating_avg: account.rating_avg,
    rating_count: account.rating_count,
    created_at: account.created_at,
    updated_at: account.updated_at,
  };
}

export async function mockUpsertProfile(payload: {
  id: string;
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
  onboarding_complete?: boolean | null;
  onboarding_completed?: boolean | null;
  onboarding_step?: number | null;
  email?: string | null;
}): Promise<void> {
  const db = loadDatabase();
  const account = findAccountById(db, payload.id);
  if (!account) {
    throw new Error('Profil de test introuvable');
  }

  account.display_name = payload.display_name ?? account.display_name;
  account.full_name = payload.full_name ?? account.full_name;
  account.city = payload.city ?? account.city;
  account.avatar_url = payload.avatar_url ?? account.avatar_url;
  account.company_name = payload.company_name ?? account.company_name;
  account.bio = payload.bio ?? account.bio;
  account.skills = payload.skills ?? account.skills;
  account.daily_rate = payload.daily_rate ?? account.daily_rate;

  const nextType = payload.user_type ?? payload.type ?? account.user_type;
  if (nextType === 'studio' || nextType === 'pro') {
    account.user_type = nextType;
    account.type = nextType;
  }

  if (payload.onboarding_complete === true || payload.onboarding_complete === false) {
    account.onboarding_complete = payload.onboarding_complete;
  }
  if (payload.onboarding_completed === true || payload.onboarding_completed === false) {
    account.onboarding_completed = payload.onboarding_completed;
  }
  if (typeof payload.onboarding_step === 'number') {
    account.onboarding_step = payload.onboarding_step;
  }
  if (typeof payload.email === 'string' && payload.email.trim()) {
    account.email = normalizeEmail(payload.email);
    account.contact_email = account.email;
  }

  account.updated_at = nowIso();
  writeStoredDatabase(db);
}
