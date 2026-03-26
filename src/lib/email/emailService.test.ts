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
  Reflect.deleteProperty(globalThis, 'window');
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

test('sendApplicationReceived builds mission manage URL from env app origin', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_APP_URL', 'https://local.studiolink.test');
  supabaseMock.invoke.mockResolvedValueOnce({ error: null });

  const { emailService } = await import('./emailService');
  await emailService.sendApplicationReceived({
    studioEmail: 'studio@example.com',
    proName: 'Pro Name',
    missionTitle: 'Mission',
    missionId: 'mission-42',
  });

  assert.equal(supabaseMock.invoke.mock.calls.length, 1);
  assert.equal(supabaseMock.invoke.mock.calls[0][0], 'send-email');
  const body = supabaseMock.invoke.mock.calls[0][1].body as { data: { missionUrl: string } };
  assert.equal(body.data.missionUrl, 'https://local.studiolink.test/missions/mission-42/manage');
});

test('chat and rating emails use window origin when available', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  supabaseMock.invoke.mockResolvedValue({ error: null });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: {
      location: {
        origin: 'https://studiolink-paris.vercel.app',
      },
    },
  });

  const { emailService } = await import('./emailService');
  await emailService.sendNewMessage({
    recipientEmail: 'pro@example.com',
    senderName: 'Studio',
    missionTitle: 'Mission',
    sessionId: 'session-1',
    preview: 'Hello there',
  });
  await emailService.sendSessionCompletedRating({
    userEmail: 'studio@example.com',
    otherPartyName: 'Pro',
    missionTitle: 'Mission',
    sessionId: 'session-2',
  });

  const newMessageBody = supabaseMock.invoke.mock.calls[0][1].body as { data: { sessionUrl: string } };
  const ratingBody = supabaseMock.invoke.mock.calls[1][1].body as { data: { sessionUrl: string } };

  assert.equal(newMessageBody.data.sessionUrl, 'https://studiolink-paris.vercel.app/chat/session-1');
  assert.equal(ratingBody.data.sessionUrl, 'https://studiolink-paris.vercel.app/chat/session-2');
});

test('application accepted and rejected call expected template types', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  supabaseMock.invoke.mockResolvedValue({ error: null });

  const { emailService } = await import('./emailService');
  await emailService.sendApplicationAccepted({
    proEmail: 'pro@example.com',
    studioName: 'Studio',
    missionTitle: 'Mission',
    sessionId: 'session-3',
  });
  await emailService.sendApplicationRejected({
    proEmail: 'pro@example.com',
    studioName: 'Studio',
    missionTitle: 'Mission',
  });

  const acceptedBody = supabaseMock.invoke.mock.calls[0][1].body as { type: string };
  const rejectedBody = supabaseMock.invoke.mock.calls[1][1].body as { type: string };

  assert.equal(acceptedBody.type, 'application_accepted');
  assert.equal(rejectedBody.type, 'application_rejected');
});
