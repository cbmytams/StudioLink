export type InvitationType = 'studio' | 'pro';

export type InvitationContext = {
  code: string;
  type: InvitationType;
  email: string | null;
};

type InvitationContextSource = {
  routeCode?: string | null;
  routeType?: string | null;
  routeEmail?: string | null;
  storageCode?: string | null;
  storageType?: string | null;
  storageEmail?: string | null;
  userMetadata?: Record<string, unknown> | null;
};

function normalizeInvitationType(value: unknown): InvitationType | null {
  return value === 'studio' || value === 'pro' ? value : null;
}

function normalizeInvitationCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return normalized ? normalized : null;
}

function normalizeInvitationEmail(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function getInvitationContext({
  routeCode,
  routeType,
  routeEmail,
  storageCode,
  storageType,
  storageEmail,
  userMetadata,
}: InvitationContextSource): InvitationContext | null {
  const routeTypeValue = normalizeInvitationType(routeType);
  const routeCodeValue = normalizeInvitationCode(routeCode);
  if (routeTypeValue && routeCodeValue) {
    return {
      code: routeCodeValue,
      type: routeTypeValue,
      email: normalizeInvitationEmail(routeEmail),
    };
  }

  const storedType = normalizeInvitationType(storageType);
  const storedCodeValue = normalizeInvitationCode(storageCode);
  if (storedType && storedCodeValue) {
    return {
      code: storedCodeValue,
      type: storedType,
      email: normalizeInvitationEmail(storageEmail),
    };
  }

  const metadata = userMetadata ?? null;
  const metadataType = normalizeInvitationType(
    metadata?.invitation_type ?? metadata?.invitationType ?? null,
  );
  const metadataCode = normalizeInvitationCode(
    metadata?.invitation_code ?? metadata?.invitationCode ?? null,
  );

  if (!metadataType || !metadataCode) {
    return null;
  }

  return {
    code: metadataCode,
    type: metadataType,
    email: normalizeInvitationEmail(
      metadata?.invitation_email ?? metadata?.invitationEmail ?? null,
    ),
  };
}

export function buildSignupEmailRedirect(origin: string): string {
  const callbackUrl = new URL('/auth/callback', origin);
  callbackUrl.searchParams.set('next', '/onboarding');
  return callbackUrl.toString();
}

export function getAuthMode(
  queryMode: string | null | undefined,
  stateMode: string | null | undefined,
): 'signin' | 'signup' {
  return queryMode === 'signup' || stateMode === 'signup' ? 'signup' : 'signin';
}

export function extractClaimSuccess(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (!value || typeof value !== 'object') return false;
  if ('claimed' in value && typeof (value as { claimed?: unknown }).claimed === 'boolean') {
    return (value as { claimed: boolean }).claimed;
  }
  return false;
}
