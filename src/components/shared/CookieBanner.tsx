import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
    if (consent === 'accepted') {
      posthog.opt_in_capturing();
    } else if (consent === 'rejected') {
      posthog.opt_out_capturing();
    }
  }, [consent]);

  if (consent !== 'unknown') return null;

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
    <div className="fixed bottom-20 left-2 right-2 z-[120] md:bottom-6 md:left-auto md:right-6 md:max-w-md">
      <div className="rounded-2xl border border-white/15 bg-[#0f0f1d]/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <p className="text-sm text-white/80">
          StudioLink utilise des cookies analytiques pour ameliorer votre experience.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReject}
            className="min-h-[44px] rounded-xl border border-white/20 px-3 text-sm font-medium text-white/80 transition hover:bg-white/10"
          >
            Tout refuser
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="min-h-[44px] rounded-xl bg-orange-500 px-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Accepter
          </button>
          <Link
            to="/legal/privacy"
            className="ml-auto min-h-[44px] inline-flex items-center text-xs text-white/65 underline underline-offset-2 hover:text-white"
          >
            En savoir plus
          </Link>
        </div>
      </div>
    </div>
  );
}
