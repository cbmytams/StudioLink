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

const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');

function installWindow() {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
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
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  installWindow();
});

afterEach(() => {
  vi.unstubAllEnvs();
  restoreWindow();
});

test('mockEmailAdapter stores messages in local mailbox', async () => {
  const { mockEmailAdapter, readMockMailbox } = await import('./emailAdapter');

  await mockEmailAdapter.sendEmail('welcome', 'mock@example.com', { firstName: 'Mock' });
  await mockEmailAdapter.sendEmail('new_message', 'pro@example.com', { preview: 'hello' });

  const mailbox = readMockMailbox();
  assert.equal(mailbox.length, 2);
  assert.equal(mailbox[0].type, 'new_message');
  assert.equal(mailbox[0].to, 'pro@example.com');
  assert.equal(mailbox[1].to, 'mock@example.com');
});

test('realEmailAdapter no-ops when supabase url is missing', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', '');
  const { realEmailAdapter } = await import('./emailAdapter');

  await realEmailAdapter.sendEmail('welcome', 'test@example.com', { role: 'studio' });

  assert.equal(supabaseMock.invoke.mock.calls.length, 0);
});

