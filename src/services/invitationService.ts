import { supabase } from '@/lib/supabaseClient';
import type { InvitationValidationResult, UserType } from '@/types/backend';

const FALLBACK_CODES: Record<string, UserType> = {
  STUDIO2024: 'studio',
  STUDIOADMIN: 'studio',
  PRO2024: 'pro',
  PROADMIN: 'pro',
};

export async function validateInvitationCode(code: string): Promise<InvitationValidationResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return {
      is_valid: false,
      code_type: null,
      message: "Code d'invitation requis",
    };
  }

  if (!supabase) {
    const type = FALLBACK_CODES[normalized];
    return {
      is_valid: Boolean(type),
      code_type: type ?? null,
      message: type ? 'Code valide' : 'Code invalide ou expiré',
    };
  }

  const { data, error } = await supabase.rpc('validate_invitation_code', { p_code: normalized });
  if (error) {
    return {
      is_valid: false,
      code_type: null,
      message: error.message,
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    is_valid: Boolean(row?.is_valid),
    code_type: (row?.code_type as UserType | null) ?? null,
    message: row?.message ?? 'Code invalide ou expiré',
  };
}
