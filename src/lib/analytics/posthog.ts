import posthog from 'posthog-js';

let postHogInitialized = false;

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
      if (import.meta.env.DEV || !import.meta.env.VITE_POSTHOG_KEY) {
        ph.opt_out_capturing();
      }
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
