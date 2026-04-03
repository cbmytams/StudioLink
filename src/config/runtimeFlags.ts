type RuntimeFlagName =
  | 'isTestMode'
  | 'bypassCaptcha'
  | 'mockEmail'
  | 'disableAnalytics'
  | 'mockSupabase';

function parseOptionalBoolean(value: string | undefined): boolean | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return null;
}

function resolveFlag(value: string | undefined, fallback: boolean): boolean {
  const parsed = parseOptionalBoolean(value);
  return parsed ?? fallback;
}

const appMode = (import.meta.env.VITE_APP_MODE ?? '').trim().toUpperCase();

export const isTestMode = appMode === 'TEST';
export const bypassCaptcha = resolveFlag(import.meta.env.VITE_BYPASS_CAPTCHA, isTestMode);
export const mockEmail = resolveFlag(import.meta.env.VITE_MOCK_EMAIL, isTestMode);
export const disableAnalytics = resolveFlag(import.meta.env.VITE_DISABLE_ANALYTICS, isTestMode);
export const mockSupabase = resolveFlag(import.meta.env.VITE_MOCK_SUPABASE, isTestMode);

export const runtimeFlags = Object.freeze({
  isTestMode,
  bypassCaptcha,
  mockEmail,
  disableAnalytics,
  mockSupabase,
});

export function getActiveTestFlags(): RuntimeFlagName[] {
  return Object.entries(runtimeFlags)
    .filter(([, enabled]) => enabled)
    .map(([flag]) => flag as RuntimeFlagName);
}

export function assertRuntimeFlagsSafety() {
  if (!import.meta.env.PROD) return;

  const activeFlags = getActiveTestFlags();
  if (activeFlags.length === 0) return;

  const message =
    '[RuntimeFlags] Unsafe TEST configuration detected in production build. ' +
    `Disable these flags before shipping: ${activeFlags.join(', ')}.`;
  console.error(message, runtimeFlags);
  throw new Error(message);
}

