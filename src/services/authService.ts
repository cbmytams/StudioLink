import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import type { Profile, UserType } from '@/types/backend';
import type { Database, Json } from '@/types/supabase';

interface SignUpWithPasswordParams {
  email: string;
  password: string;
  invitationCode: string;
  userType: UserType;
  displayName?: string;
}

interface CompleteMagicSignupParams {
  invitationCode: string;
  userType: UserType;
  displayName?: string;
}

function assertSupabase() {
  if (!supabase) {
    throw new Error('Supabase non configuré. Vérifie VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeNotificationPreferences(value: Json | null): Profile['notification_preferences'] {
  if (!isObject(value)) return null;
  return {
    new_application: Boolean(value.new_application),
    messages: Boolean(value.messages),
    status_updates: Boolean(value.status_updates),
  };
}

function normalizeProfile(row: Database['public']['Tables']['profiles']['Row']): Profile {
  return {
    ...row,
    notification_preferences: normalizeNotificationPreferences(row.notification_preferences),
  };
}

async function upsertProfile(userId: string, email: string, userType: UserType, displayName?: string) {
  const client = assertSupabase();
  const { error } = await client.from('profiles').upsert({
    id: userId,
    email,
    user_type: userType,
    display_name: displayName ?? null,
    onboarding_complete: false,
    onboarding_step: 1,
  });

  if (error) throw error;
}

async function consumeInvitationCode(invitationCode: string, userId: string) {
  const client = assertSupabase();
  const { error } = await client.rpc('consume_invitation_code', {
    p_code: invitationCode.trim().toUpperCase(),
    p_user_id: userId,
  });

  if (error) throw error;
}

export async function signInPassword(email: string, password: string) {
  const client = assertSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function sendMagicLink(email: string, redirectTo: string) {
  const client = assertSupabase();
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: false,
    },
  });
  if (error) throw error;
}

export async function sendMagicSignupLink(email: string, redirectTo: string) {
  const client = assertSupabase();
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });
  if (error) throw error;
}

export async function signUpWithPassword(params: SignUpWithPasswordParams) {
  const client = assertSupabase();
  const { data, error } = await client.auth.signUp({
    email: params.email,
    password: params.password,
  });

  if (error) throw error;
  const user = data.user;
  if (!user) throw new Error('Création de compte impossible.');
  if (!data.session) {
    throw new Error(
      'Confirmation email activée côté Supabase. Désactive-la pour ce MVP ou complète le flow callback.'
    );
  }

  await upsertProfile(user.id, params.email, params.userType, params.displayName);
  await consumeInvitationCode(params.invitationCode, user.id);
  return data;
}

export async function completeMagicSignup(params: CompleteMagicSignupParams) {
  const client = assertSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  if (!data.session?.user) throw new Error('Session introuvable après magic link.');

  const user = data.session.user;
  const existingProfile = await getCurrentProfile(data.session);
  if (existingProfile) return;

  await upsertProfile(user.id, user.email ?? '', params.userType, params.displayName);
  try {
    await consumeInvitationCode(params.invitationCode, user.id);
  } catch (consumeError) {
    const message =
      consumeError instanceof Error ? consumeError.message : 'Code invalide, expiré ou déjà utilisé';
    if (!message.toLowerCase().includes('déjà utilisé')) {
      throw consumeError;
    }
  }
}

export async function signOut() {
  const client = assertSupabase();
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export async function getCurrentSession() {
  const client = assertSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentProfile(session: Session | null): Promise<Profile | null> {
  const client = assertSupabase();
  if (!session?.user) return null;
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) return null;
  return normalizeProfile(data);
}

export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  const client = assertSupabase();
  return client.auth.onAuthStateChange(callback);
}
