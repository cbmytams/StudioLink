import { supabase } from '@/lib/supabase/client';
import { runtimeFlags } from '@/config/runtimeFlags';
import {
  mockClaimInvitation,
  mockConsumeInvitationCode,
  mockGetInvitationByCode,
} from '@/lib/testMode/mockSupabase';
import type { InvitationValidationResult, UserType } from '@/types/backend';

const FALLBACK_CODES: Record<string, UserType> = {
  STUDIO2024: 'studio',
  STUDIOADMIN: 'studio',
  PRO2024: 'pro',
  PROADMIN: 'pro',
};

const TEST_CODES: Record<string, UserType> = {
  'STUDIO-TEST': 'studio',
  'PRO-TEST': 'pro',
};

export type InvitationLookup = {
  id: string;
  code: string;
  invitation_type: UserType;
  email: string | null;
  used: boolean;
  expires_at: string | null;
  created_at: string;
};

function buildLocalInvitation(code: string, type: UserType): InvitationLookup {
  return {
    id: `local-invite-${code}`,
    code,
    invitation_type: type,
    email: null,
    used: false,
    expires_at: null,
    created_at: new Date().toISOString(),
  };
}

function getLocalInvitation(code: string): InvitationLookup | null {
  const testType = TEST_CODES[code];
  if (runtimeFlags.isTestMode && testType) {
    return buildLocalInvitation(code, testType);
  }

  const fallbackType = FALLBACK_CODES[code];
  if (fallbackType) {
    return buildLocalInvitation(code, fallbackType);
  }

  return null;
}

export async function getInvitationByCode(code: string): Promise<InvitationLookup | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  if (runtimeFlags.mockSupabase) {
    return mockGetInvitationByCode(normalized) ?? getLocalInvitation(normalized);
  }

  const local = getLocalInvitation(normalized);
  if (local && runtimeFlags.isTestMode) {
    return local;
  }

  if (!supabase) {
    return local;
  }

  const { data, error } = await supabase.rpc('get_invitation_by_code', { p_code: normalized });
  if (error) return local;

  const row = (Array.isArray(data) ? data[0] : data) as InvitationLookup | null;
  return row ?? local;
}

export async function validateInvitationCode(code: string): Promise<InvitationValidationResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return {
      is_valid: false,
      code_type: null,
      message: "Code d'invitation requis",
    };
  }

  const invitation = await getInvitationByCode(normalized);
  const row = invitation
    ? { is_valid: true, code_type: invitation.invitation_type, message: 'Code valide' }
    : null;

  return {
    is_valid: Boolean(row?.is_valid),
    code_type: (row?.code_type as UserType | null) ?? null,
    message: row?.message ?? 'Code introuvable',
  };
}

export async function consumeInvitationCode(code: string, userId: string): Promise<void> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    throw new Error("Code d'invitation requis");
  }
  if (runtimeFlags.mockSupabase) {
    await mockConsumeInvitationCode(normalized, userId);
    return;
  }

  if (runtimeFlags.isTestMode && TEST_CODES[normalized]) {
    return;
  }

  if (!supabase) {
    return;
  }

  const { error } = await supabase.rpc('consume_invitation_code', {
    p_code: normalized,
    p_user_id: userId,
  });
  if (error) {
    throw error;
  }
}

export async function claimInvitationCode(code: string, userId: string): Promise<boolean> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    throw new Error("Code d'invitation requis");
  }

  if (runtimeFlags.mockSupabase) {
    return mockClaimInvitation(normalized, userId);
  }

  if (runtimeFlags.isTestMode && TEST_CODES[normalized]) {
    return true;
  }

  if (!supabase) {
    return true;
  }

  const { data, error } = await supabase.rpc('claim_invitation', {
    p_code: normalized,
    p_user_id: userId,
  });
  if (error) {
    throw error;
  }

  const payload = Array.isArray(data) ? data[0] : data;
  if (typeof payload === 'boolean') return payload;
  if (!payload || typeof payload !== 'object') return false;
  if ('claimed' in payload && typeof (payload as { claimed?: unknown }).claimed === 'boolean') {
    return (payload as { claimed: boolean }).claimed;
  }
  return false;
}
