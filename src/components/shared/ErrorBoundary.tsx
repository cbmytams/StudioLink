import React, { type ReactNode } from 'react';
import { toUserFacingErrorMessage } from '@/lib/errors/userFacing';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage: string;
};

export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Props;
  declare state: State;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: toUserFacingErrorMessage(error, 'Recharge la page pour reprendre là où tu en étais.'),
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    void import('@sentry/react')
      .then(({ captureException }) => {
        captureException(error, {
          extra: { componentStack: info.componentStack },
        });
      })
      .catch(() => undefined);
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          id="error-boundary-fallback"
          className="app-shell flex min-h-[100dvh] flex-col items-center justify-center px-4 text-center"
        >
          <div className="max-w-md rounded-[2rem] border border-white/15 bg-white/6 p-8 shadow-[0_18px_48px_rgba(12,12,12,0.18)]">
            <p className="text-5xl">⚠️</p>
            <h1 className="mt-4 text-2xl font-semibold text-white">Une erreur est survenue</h1>
            <p className="mt-3 text-sm leading-6 text-white/60">
              {this.state.errorMessage || 'Recharge la page pour reprendre là où tu en étais.'}
            </p>
            <button
              id="btn-reload-page"
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-full border border-orange-400/20 bg-orange-400/10 px-5 py-2.5 text-sm font-medium text-orange-100 transition hover:bg-orange-400/15"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
