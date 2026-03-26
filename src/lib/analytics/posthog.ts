import posthog from 'posthog-js';

let postHogInitialized = false;

function readConsent() {
  if (typeof window === 'undefined') return 'unknown';
  return window.localStorage.getItem('cookie_consent');
}

export function initPostHog() {
  if (typeof window === 'undefined' || postHogInitialized) return;

  posthog.init(import.meta.env.VITE_POSTHOG_KEY ?? '', {
    api_host: 'https://eu.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    session_recording: {
      maskAllInputs: true,
      maskInputFn: (text) => '*'.repeat(text.length),
    },
    loaded: (ph) => {
      const consent = readConsent();
      if (import.meta.env.DEV || !import.meta.env.VITE_POSTHOG_KEY || consent !== 'accepted') {
        ph.opt_out_capturing();
        return;
      }
      ph.opt_in_capturing();
    },
  });

  postHogInitialized = true;
}

export function identifyUser(userId: string, props: {
  role: string;
  email?: string;
  displayName?: string;
}) {
  if (typeof window === 'undefined') return;
  posthog.identify(userId, props);
}

export function resetUser() {
  if (typeof window === 'undefined') return;
  posthog.reset();
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  posthog.capture(event, properties);
}

export { posthog };
