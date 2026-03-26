import assert from 'node:assert/strict';
import { afterEach, beforeEach, test, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  signOut: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signOut: authMock.signOut,
    },
  },
}));

const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');

function installWindow() {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: {
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
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
  vi.clearAllMocks();
  installWindow();
});

afterEach(() => {
  restoreWindow();
});

test('redirects and signs out on JWT expiration errors', async () => {
  const navigate = vi.fn();
  const { handleAuthError } = await import('./handleAuthError');

  const result = await handleAuthError(new Error('JWT expired'), navigate);

  assert.equal(result, true);
  assert.equal(authMock.signOut.mock.calls.length, 1);
  assert.deepEqual(authMock.signOut.mock.calls[0][0], { scope: 'local' });
  assert.equal(navigate.mock.calls.length, 1);
  assert.equal(navigate.mock.calls[0][0], '/login');
  assert.deepEqual(navigate.mock.calls[0][1], {
    replace: true,
    state: { reason: 'session_expired' },
  });
});

test('redirects on session_not_found errors', async () => {
  const navigate = vi.fn();
  const { handleAuthError } = await import('./handleAuthError');

  const result = await handleAuthError(new Error('session_not_found'), navigate);

  assert.equal(result, true);
  assert.equal(navigate.mock.calls.length, 1);
});

test('returns false and does not redirect for non-auth errors', async () => {
  const navigate = vi.fn();
  const { handleAuthError } = await import('./handleAuthError');

  const result = await handleAuthError(new Error('Network error'), navigate);

  assert.equal(result, false);
  assert.equal(authMock.signOut.mock.calls.length, 0);
  assert.equal(navigate.mock.calls.length, 0);
});

test('handles non-Error values and keeps redirect reason single-use', async () => {
  const { consumeAuthRedirectReason, handleAuthError } = await import('./handleAuthError');

  const result = await handleAuthError('string error');

  assert.equal(result, false);
  assert.equal(consumeAuthRedirectReason(), null);
});

test('consumeAuthRedirectReason returns and clears stored reason', async () => {
  const { consumeAuthRedirectReason, handleAuthError } = await import('./handleAuthError');

  await handleAuthError(new Error('Invalid JWT'));

  assert.equal(consumeAuthRedirectReason(), 'session_expired');
  assert.equal(consumeAuthRedirectReason(), null);
});
