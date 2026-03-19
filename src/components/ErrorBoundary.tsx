import React, { type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; errorMessage: string };

export class ErrorBoundary extends React.Component {
  declare props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell flex flex-col items-center justify-center text-center px-4">
          <p className="text-5xl mb-4">⚠️</p>
          <h1 className="text-2xl font-bold text-black mb-2">
            Une erreur est survenue
          </h1>
          <p className="text-stone-500 text-sm mb-8">
            {this.state.errorMessage}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors"
          >
            Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
