import assert from 'node:assert/strict';
import { afterEach, beforeEach, test, vi } from 'vitest';

const posthogMock = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  __loaded: false,
}));

vi.mock('posthog-js', () => ({ default: posthogMock }));

const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');

function installWindow(consent: string | null) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: {
      localStorage: {
        getItem: () => consent,
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
  posthogMock.__loaded = false;
  installWindow('unknown');
});

afterEach(() => {
  vi.unstubAllEnvs();
  restoreWindow();
});

test('initPostHog does nothing when key is missing', async () => {
  vi.stubEnv('VITE_POSTHOG_KEY', '');
  const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);

  const { initPostHog } = await import('./posthog');
  initPostHog();

  assert.equal(posthogMock.init.mock.calls.length, 0);
  assert.equal(debugSpy.mock.calls.length, 1);
  debugSpy.mockRestore();
});

test('track ignores events until PostHog is loaded', async () => {
  vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test_key');
  const { track } = await import('./posthog');

  posthogMock.__loaded = false;
  track('mission_created', { budget: 'small' });

  assert.equal(posthogMock.capture.mock.calls.length, 0);
});

test('track captures events when PostHog is loaded', async () => {
  vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test_key');
  const { track } = await import('./posthog');

  posthogMock.__loaded = true;
  track('mission_created', { budget: 'small' });

  assert.equal(posthogMock.capture.mock.calls.length, 1);
});
