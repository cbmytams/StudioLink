import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: Readonly<ErrorBoundaryProps>;

  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {}

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm border border-stone-200 flex flex-col items-center text-center gap-3">
          <AlertTriangle className="text-orange-500" size={28} />
          <h1 className="text-xl font-semibold text-stone-900">Une erreur est survenue</h1>
          {process.env.NODE_ENV === 'development' && this.state.error ? (
            <p className="text-sm text-stone-600 break-words">{this.state.error.message}</p>
          ) : null}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 rounded-lg bg-orange-500 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white"
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
