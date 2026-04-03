import assert from 'node:assert/strict';
import { afterEach, beforeEach, test, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test('runtime flags stay disabled in normal mode by default', async () => {
  vi.stubEnv('VITE_APP_MODE', 'development');
  vi.stubEnv('VITE_BYPASS_CAPTCHA', '');
  vi.stubEnv('VITE_MOCK_EMAIL', '');
  vi.stubEnv('VITE_DISABLE_ANALYTICS', '');
  vi.stubEnv('VITE_MOCK_SUPABASE', '');

  const flags = await import('./runtimeFlags');

  assert.equal(flags.isTestMode, false);
  assert.equal(flags.bypassCaptcha, false);
  assert.equal(flags.mockEmail, false);
  assert.equal(flags.disableAnalytics, false);
  assert.equal(flags.mockSupabase, false);
});

test('test app mode enables all test-safe defaults', async () => {
  vi.stubEnv('VITE_APP_MODE', 'TEST');
  vi.stubEnv('VITE_BYPASS_CAPTCHA', '');
  vi.stubEnv('VITE_MOCK_EMAIL', '');
  vi.stubEnv('VITE_DISABLE_ANALYTICS', '');
  vi.stubEnv('VITE_MOCK_SUPABASE', '');

  const flags = await import('./runtimeFlags');

  assert.equal(flags.isTestMode, true);
  assert.equal(flags.bypassCaptcha, true);
  assert.equal(flags.mockEmail, true);
  assert.equal(flags.disableAnalytics, true);
  assert.equal(flags.mockSupabase, true);
});

test('assertRuntimeFlagsSafety throws in production when test flags are active', async () => {
  vi.stubEnv('PROD', true);
  vi.stubEnv('VITE_APP_MODE', 'TEST');

  const { assertRuntimeFlagsSafety } = await import('./runtimeFlags');

  assert.throws(() => assertRuntimeFlagsSafety(), /production/i);
});
