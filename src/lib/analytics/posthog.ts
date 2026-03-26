import posthog from 'posthog-js';

let postHogInitialized = false;

type PostHogWithLoaded = typeof posthog & { __loaded?: boolean };

function readConsent() {
  if (typeof window === 'undefined') return 'unknown';
  return window.localStorage.getItem('cookie_consent');
}

function isPostHogLoaded() {
  return Boolean((posthog as PostHogWithLoaded).__loaded);
}

export function initPostHog() {
  if (typeof window === 'undefined' || postHogInitialized) return;

  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) {
    console.debug('[PostHog] Cle manquante - analytics desactives');
    return;
  }

  posthog.init(key, {
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
  try {
    if (!isPostHogLoaded()) return;
    posthog.identify(userId, props);
  } catch {
    // Ignore analytics errors when PostHog is unavailable.
  }
}

export function resetUser() {
  if (typeof window === 'undefined') return;
  try {
    if (!isPostHogLoaded()) return;
    posthog.reset();
  } catch {
    // Ignore analytics errors when PostHog is unavailable.
  }
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    if (!isPostHogLoaded()) return;
    posthog.capture(event, properties);
  } catch {
    // Ignore analytics errors when PostHog is unavailable.
  }
}

export { posthog };
