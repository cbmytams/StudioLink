import { StrictMode } from 'react';
import {createRoot} from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { inject as injectAnalytics } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import {
  assertRuntimeFlagsSafety,
  disableAnalytics,
  getActiveTestFlags,
} from '@/config/runtimeFlags';
import App from './App.tsx';
import { AuthProvider } from './lib/supabase/auth.ts';
import { initPostHog } from './lib/analytics/posthog.ts';
import { queryClient } from './lib/queryClient.ts';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { ToastProvider } from './components/ui/Toast.tsx';
import './index.css';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
let startupError: Error | null = null;

try {
  assertRuntimeFlagsSafety();
} catch (error) {
  startupError = error instanceof Error
    ? error
    : new Error('Erreur de démarrage liée à la configuration runtime.');
}

if (!startupError && !disableAnalytics && sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.2,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: false,
      }),
    ],
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      const message = event.exception?.values?.[0]?.value;
      if (typeof message === 'string' && message.includes('JWT')) {
        return null;
      }
      return event;
    },
  });
}

if (typeof window !== 'undefined') {
  const consent = window.localStorage.getItem('cookie_consent');
  if (consent !== 'accepted') {
    // PostHog reste opt-out jusqu'au consentement explicite.
  }
  if (disableAnalytics) {
    console.debug('[RuntimeFlags] Analytics désactivés en runtime.');
  }
}

if (!startupError && !disableAnalytics) {
  initPostHog();
  injectAnalytics();
  injectSpeedInsights();
}

function RuntimeConfigErrorScreen({ error }: { error: Error }) {
  const activeFlags = getActiveTestFlags();
  const activeFlagsLabel = activeFlags.length > 0 ? activeFlags.join(', ') : 'none';
  return (
    <main className="app-shell flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <section className="w-full max-w-2xl rounded-[2rem] border border-red-300/25 bg-[#190d0d]/90 p-8 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-200/80">Runtime guard</p>
        <h1 className="mt-3 text-2xl font-semibold text-red-100">Mode test bloqué en production</h1>
        <p className="mt-3 text-sm leading-6 text-red-100/90">
          {error.message}
        </p>
        <p className="mt-3 rounded-xl border border-red-200/20 bg-red-950/40 px-4 py-3 font-mono text-xs text-red-100/90">
          Active flags: {activeFlagsLabel}
        </p>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {startupError ? (
        <RuntimeConfigErrorScreen error={startupError} />
      ) : (
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </ToastProvider>
          </QueryClientProvider>
        </HelmetProvider>
      )}
    </ErrorBoundary>
  </StrictMode>,
);

if (!startupError && import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}
