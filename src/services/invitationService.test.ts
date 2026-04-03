import assert from 'node:assert/strict';
import { afterEach, beforeEach, test, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test('test invitation codes are accepted in test mode', async () => {
  vi.stubEnv('VITE_APP_MODE', 'TEST');
  vi.stubEnv('VITE_MOCK_SUPABASE', 'true');

  const { validateInvitationCode } = await import('./invitationService');

  const studioResult = await validateInvitationCode('STUDIO-TEST');
  const proResult = await validateInvitationCode('PRO-TEST');

  assert.deepEqual(studioResult, {
    is_valid: true,
    code_type: 'studio',
    message: 'Code valide',
  });
  assert.deepEqual(proResult, {
    is_valid: true,
    code_type: 'pro',
    message: 'Code valide',
  });
});

