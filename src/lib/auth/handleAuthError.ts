import { supabase } from '@/lib/supabase/client';

type NavigateFn = (
  to: string,
  options?: {
    replace?: boolean;
    state?: Record<string, unknown>;
  },
) => void;

const AUTH_ERROR_PATTERNS = [
  'jwt expired',
  'invalid jwt',
  'session_not_found',
  'pgrst301',
  'auth session missing',
  'invalid token',
  'unauthorized',
  '401',
];
const AUTH_REDIRECT_REASON_KEY = 'auth_redirect_reason';

function readErrorFragment(error: unknown, key: 'message' | 'code' | 'status'): string {
  if (!error || typeof error !== 'object') return '';
  const value = (error as Record<string, unknown>)[key];
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

export async function handleAuthError(error: unknown, navigate?: NavigateFn): Promise<boolean> {
  const rawMessage = error instanceof Error ? error.message : String(error ?? '');
  const code = readErrorFragment(error, 'code');
  const status = readErrorFragment(error, 'status');

  const normalized = `${rawMessage} ${code} ${status}`.toLowerCase();
  const isAuthError = AUTH_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern));

  if (!isAuthError) return false;

  if (supabase) {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
  }

  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(AUTH_REDIRECT_REASON_KEY, 'session_expired');
  }

  if (navigate) {
    navigate('/login', {
      replace: true,
      state: { reason: 'session_expired' },
    });
  }

  return true;
}

export function consumeAuthRedirectReason(): string | null {
  if (typeof window === 'undefined') return null;
  const reason = window.sessionStorage.getItem(AUTH_REDIRECT_REASON_KEY);
  if (!reason) return null;
  window.sessionStorage.removeItem(AUTH_REDIRECT_REASON_KEY);
  return reason;
}
