import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { disableAnalytics } from '@/config/runtimeFlags';
import { posthog } from '@/lib/analytics/posthog';

type CookieConsent = 'unknown' | 'accepted' | 'rejected';

const CONSENT_KEY = 'cookie_consent';

function readConsent(): CookieConsent {
  if (typeof window === 'undefined') return 'unknown';
  const value = window.localStorage.getItem(CONSENT_KEY);
  if (value === 'accepted' || value === 'rejected') return value;
  return 'unknown';
}

export function CookieBanner() {
  const [consent, setConsent] = useState<CookieConsent>(() => readConsent());

  useEffect(() => {
    if (disableAnalytics) return;
    if (consent === 'accepted') {
      posthog.opt_in_capturing();
    } else if (consent === 'rejected') {
      posthog.opt_out_capturing();
    }
  }, [consent]);

  if (disableAnalytics || consent !== 'unknown') return null;

  const handleAccept = () => {
    window.localStorage.setItem(CONSENT_KEY, 'accepted');
    posthog.opt_in_capturing();
    setConsent('accepted');
  };

  const handleReject = () => {
    window.localStorage.setItem(CONSENT_KEY, 'rejected');
    posthog.opt_out_capturing();
    setConsent('rejected');
  };

  return (
    <div
      className="fixed inset-x-0 bottom-[var(--bottom-nav-height,64px)] z-cookie-banner px-3 pb-[var(--safe-offset-compact)] md:inset-x-auto md:right-6 md:bottom-6 md:px-0 md:pb-0"
    >
      <div className="mx-auto w-full max-w-[var(--size-cookie-banner-width)] rounded-2xl border border-white/15 bg-[var(--color-surface)]/95 p-3.5 shadow-[var(--shadow-banner)] backdrop-blur-xl md:max-w-md">
        <p className="text-sm text-white/80">
          StudioLink utilise des cookies analytiques pour améliorer votre expérience.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReject}
            className="min-h-[var(--size-touch)] rounded-xl border border-white/20 px-3 text-sm font-medium text-white/80 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
          >
            Tout refuser
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="min-h-[var(--size-touch)] rounded-xl bg-orange-500 px-3 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
          >
            Accepter
          </button>
          <Link
            to="/legal/privacy"
            className="ml-auto inline-flex min-h-[var(--size-touch)] items-center text-xs text-white/65 underline underline-offset-2 hover:text-white"
          >
            En savoir plus
          </Link>
        </div>
      </div>
    </div>
  );
}
