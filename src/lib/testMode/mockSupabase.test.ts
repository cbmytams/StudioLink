import assert from 'node:assert/strict';
import { afterEach, beforeEach, test, vi } from 'vitest';

const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');

function installWindow() {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
      },
    },
  });
}

function restoreWindow() {
  if (originalWindowDescriptor) {
    Object.defineProperty(globalThis, 'window', originalWindowDescriptor);
    return;
  }
  Reflect.deleteProperty(globalThis, 'window');
}

beforeEach(() => {
  vi.resetModules();
  installWindow();
});

afterEach(() => {
  restoreWindow();
});

test('seeded account can sign in and retrieve profile', async () => {
  const { mockSignInWithPassword, mockGetProfile } = await import('./mockSupabase');
  const auth = await mockSignInWithPassword('phase0.studio.mn5xe7w4@example.com', 'StudioLink!123');

  assert.equal(Boolean(auth.session?.user?.id), true);
  const profile = await mockGetProfile(auth.session.user.id);
  assert.equal(profile?.user_type, 'studio');
});

test('sign up with STUDIO-TEST invitation creates a local session', async () => {
  const { mockSignUpWithPassword, mockGetInvitationByCode } = await import('./mockSupabase');
  const beforeInvitation = mockGetInvitationByCode('STUDIO-TEST');

  const signUpResult = await mockSignUpWithPassword({
    email: `test.signup.${Date.now()}@example.com`,
    password: 'StudioLink!123',
    invitationCode: 'STUDIO-TEST',
    userType: 'studio',
  });

  const afterInvitation = mockGetInvitationByCode('STUDIO-TEST');

  assert.equal(signUpResult.session.user.email?.includes('@example.com'), true);
  assert.equal(beforeInvitation?.used, false);
  assert.equal(afterInvitation?.used, false);
});

