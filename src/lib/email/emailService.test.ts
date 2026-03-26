import assert from 'node:assert/strict';
import { afterEach, beforeEach, test, vi } from 'vitest';

const supabaseMock = vi.hoisted(() => ({
  invoke: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: supabaseMock.invoke,
    },
  },
}));

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test('sendWelcome skips invocation when Supabase URL is missing', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', '');

  const { emailService } = await import('./emailService');
  await emailService.sendWelcome({
    email: 'test@example.com',
    firstName: 'Test',
    role: 'studio',
  });

  assert.equal(supabaseMock.invoke.mock.calls.length, 0);
});

test('sendWelcome handles Supabase function errors without throwing', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  supabaseMock.invoke.mockResolvedValueOnce({
    error: { message: 'edge function error' },
  });

  const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
  const { emailService } = await import('./emailService');

  await emailService.sendWelcome({
    email: 'test@example.com',
    firstName: 'Test',
    role: 'pro',
  });

  assert.equal(supabaseMock.invoke.mock.calls.length, 1);
  assert.equal(debugSpy.mock.calls.length, 1);
  debugSpy.mockRestore();
});

test('sendWelcome handles invocation exceptions without throwing', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  supabaseMock.invoke.mockRejectedValueOnce(new Error('network down'));

  const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
  const { emailService } = await import('./emailService');

  await emailService.sendWelcome({
    email: 'test@example.com',
    firstName: 'Test',
    role: 'studio',
  });

  assert.equal(supabaseMock.invoke.mock.calls.length, 1);
  assert.equal(debugSpy.mock.calls.length, 1);
  debugSpy.mockRestore();
});
