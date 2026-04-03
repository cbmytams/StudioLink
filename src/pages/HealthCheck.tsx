import { disableAnalytics, mockEmail } from '@/config/runtimeFlags';

type HealthPayload = {
  status: 'ok';
  timestamp: string;
  version: string;
  services: {
    analytics: boolean;
    monitoring: boolean;
    email: 'edge-function' | 'mock';
  };
};

export function buildHealthPayload(): HealthPayload {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: import.meta.env.VITE_APP_VERSION ?? 'dev',
    services: {
      analytics: disableAnalytics ? false : Boolean(import.meta.env.VITE_POSTHOG_KEY),
      monitoring: disableAnalytics ? false : Boolean(import.meta.env.VITE_SENTRY_DSN),
      email: mockEmail ? 'mock' : 'edge-function',
    },
  };
}

export default function HealthCheck() {
  const payload = buildHealthPayload();

  return (
    <main className="mx-auto max-w-2xl p-6 font-mono text-sm text-stone-800">
      <h1 className="mb-3 text-lg font-semibold">Health Check</h1>
      <pre className="overflow-auto rounded-lg border border-stone-200 bg-stone-50 p-4">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </main>
  );
}
