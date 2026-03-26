import assert from 'node:assert/strict';
import { afterEach, beforeEach, test, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test('HealthCheck payload exposes local service readiness flags', async () => {
  vi.stubEnv('VITE_APP_VERSION', '1.0.0');
  vi.stubEnv('VITE_POSTHOG_KEY', '');
  vi.stubEnv('VITE_SENTRY_DSN', '');

  const healthModule = await import('./HealthCheck');
  const buildHealthPayload = (healthModule as Record<string, unknown>).buildHealthPayload;

  assert.equal(typeof buildHealthPayload, 'function');
  const payload = (buildHealthPayload as () => Record<string, unknown>)();

  assert.equal(payload.status, 'ok');
  assert.equal(payload.version, '1.0.0');
  assert.deepEqual(payload.services, {
    analytics: false,
    monitoring: false,
    email: 'edge-function',
  });
});
