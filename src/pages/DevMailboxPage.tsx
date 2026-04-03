import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { mockEmail } from '@/config/runtimeFlags';
import {
  clearMockMailbox,
  readMockMailbox,
  type MockMailboxMessage,
} from '@/lib/email/emailAdapter';

function useMailboxSnapshot() {
  const [version, setVersion] = useState(0);
  const messages = useMemo<MockMailboxMessage[]>(() => readMockMailbox(), [version]);

  return {
    messages,
    refresh: () => setVersion((value) => value + 1),
    clear: () => {
      clearMockMailbox();
      setVersion((value) => value + 1);
    },
  };
}

export default function DevMailboxPage() {
  const { messages, refresh, clear } = useMailboxSnapshot();

  if (!mockEmail) {
    return (
      <main className="app-shell mx-auto flex min-h-[100dvh] max-w-3xl flex-col justify-center gap-4 p-6">
        <h1 className="text-2xl font-semibold text-white">Mailbox mock inactive</h1>
        <p className="text-sm text-white/70">
          Active `VITE_MOCK_EMAIL=true` (ou `VITE_APP_MODE=TEST`) pour utiliser cette page.
        </p>
        <Link to="/login" className="text-sm text-orange-200 underline underline-offset-4">
          Retour à la connexion
        </Link>
      </main>
    );
  }

  return (
    <main className="app-shell mx-auto min-h-[100dvh] max-w-5xl p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">Mode test</p>
          <h1 className="text-2xl font-semibold text-white">Mailbox mock</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refresh}
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium text-white"
          >
            Rafraîchir
          </button>
          <button
            type="button"
            onClick={clear}
            className="rounded-full border border-red-300/30 bg-red-500/15 px-4 py-2 text-xs font-medium text-red-100"
          >
            Vider
          </button>
        </div>
      </header>

      {messages.length === 0 ? (
        <p className="rounded-2xl border border-white/15 bg-white/5 px-4 py-6 text-sm text-white/70">
          Aucun message mock pour le moment.
        </p>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <article
              key={message.id}
              className="rounded-2xl border border-white/15 bg-white/5 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/60">
                <span className="font-mono">{message.id}</span>
                <span>{new Date(message.created_at).toLocaleString('fr-FR')}</span>
              </div>
              <p className="mt-2 text-sm text-white">
                <span className="font-medium">Type:</span> {message.type}
              </p>
              <p className="mt-1 text-sm text-white">
                <span className="font-medium">To:</span> {message.to}
              </p>
              <pre className="mt-3 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/80">
                {JSON.stringify(message.data, null, 2)}
              </pre>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

