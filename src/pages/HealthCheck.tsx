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
  const generatedAt = new Date(payload.timestamp).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const services = [
    {
      label: 'Analytics',
      ok: payload.services.analytics,
      value: payload.services.analytics ? 'Actif' : 'Désactivé',
    },
    {
      label: 'Monitoring',
      ok: payload.services.monitoring,
      value: payload.services.monitoring ? 'Actif' : 'Désactivé',
    },
    {
      label: 'Email',
      ok: payload.services.email === 'edge-function',
      value: payload.services.email === 'edge-function' ? 'Edge Function' : 'Boîte mock locale',
    },
  ];

  return (
    <main className="app-shell min-h-[var(--size-full-dvh)] px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <section className="app-card p-5">
          <h1 style={{ fontSize: 'var(--text-lg)' }} className="font-semibold text-white [font-family:var(--font-body)]">Health Check</h1>
          <p className="mt-2 text-sm text-white/60">
            Vérification rapide des services techniques utilisés par StudioLink.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-white/45">Version</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-white">{payload.version}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-white/45">Statut global</p>
              <p className="mt-1 text-base font-semibold text-emerald-200">Opérationnel</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-white/45">Mis à jour</p>
              <p className="mt-1 text-sm font-medium text-white/80">{generatedAt}</p>
            </div>
          </div>
        </section>

        <section className="app-card p-5">
          <h2 className="text-lg font-semibold text-white">Services</h2>
          <div className="mt-4 space-y-3">
            {services.map((service) => (
              <div key={service.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      service.ok ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <p className="text-sm font-medium text-white">{service.label}</p>
                </div>
                <p className={`text-sm ${service.ok ? 'text-emerald-200' : 'text-amber-200'}`}>
                  {service.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
