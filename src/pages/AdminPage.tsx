import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { Button } from '@/components/ui/Button';

type Invitation = {
  id: string
  code: string
  type: 'studio' | 'pro'
  email: string | null
  used: boolean
  expires_at: string | null
  created_at: string
}

type InvitationRow = {
  id: string
  code: string
  type: 'studio' | 'pro'
  email?: string | null
  used?: boolean
  used_by?: string | null
  expires_at?: string | null
  created_at: string
}

function mapRowToInvitation(row: InvitationRow): Invitation {
  const dynamicRow = row as unknown as Record<string, unknown>;
  const usedBy = typeof dynamicRow.used_by === 'string' ? dynamicRow.used_by : null;

  return {
    id: row.id,
    code: row.code,
    type: row.type,
    email: typeof dynamicRow.email === 'string' ? dynamicRow.email : null,
    used: typeof dynamicRow.used === 'boolean' ? dynamicRow.used : usedBy !== null,
    expires_at: row.expires_at ?? null,
    created_at: row.created_at,
  };
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const user = session?.user ?? null;

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState<'studio' | 'pro'>('pro');
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL ?? '').trim().toLowerCase();
    const currentEmail = (user.email ?? '').trim().toLowerCase();

    if (!adminEmail || currentEmail !== adminEmail) {
      navigate('/', { replace: true });
      return;
    }

    setIsAuthorized(true);
  }, [authLoading, navigate, user]);

  useEffect(() => {
    let active = true;

    const fetchInvitations = async () => {
      if (!isAuthorized) return;

      setLoading(true);
      setError(null);

      try {
        const expected = await supabase
          .from('invitations')
          .select('id, code, type, email, used, expires_at, created_at')
          .order('created_at', { ascending: false });

        let data = expected.data as unknown as InvitationRow[] | null;
        let fetchError = expected.error;

        if (fetchError) {
          const fallback = await supabase
            .from('invitations')
            .select('id, code, type, used_by, expires_at, created_at')
            .order('created_at', { ascending: false });
          data = fallback.data as unknown as InvitationRow[] | null;
          fetchError = fallback.error;
        }

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        if (!active) return;
        setInvitations((data ?? []).map(mapRowToInvitation));
      } catch (fetchErr) {
        if (!active) return;
        setError(fetchErr instanceof Error ? fetchErr.message : 'Impossible de charger les invitations');
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchInvitations();

    return () => {
      active = false;
    };
  }, [isAuthorized]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const expected = await supabase
        .from('invitations')
        .insert({
          code,
          type: newType,
          email: newEmail.trim() || null,
          used: false,
          expires_at,
          created_at: new Date().toISOString(),
        } as never)
        .select()
        .single();

      let data = expected.data as unknown as InvitationRow | null;
      let insertError = expected.error;

      if (insertError) {
        const fallback = await supabase
          .from('invitations')
          .insert({
            code,
            type: newType,
            expires_at,
            created_at: new Date().toISOString(),
          } as never)
          .select()
          .single();

        data = fallback.data as unknown as InvitationRow | null;
        insertError = fallback.error;
      }

      if (insertError || !data) {
        setError(insertError?.message ?? "Impossible de créer l'invitation");
        return;
      }

      setInvitations((prev) => [mapRowToInvitation(data), ...prev]);
      setNewEmail('');
    } catch (createErr) {
      setError(createErr instanceof Error ? createErr.message : "Impossible de créer l'invitation");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (code: string) => {
    try {
      const appUrl = (import.meta.env.VITE_APP_URL ?? window.location.origin).replace(/\/$/, '');
      const url = `${appUrl}/invite/${code}`;
      await navigator.clipboard.writeText(url);
      setCopySuccess(code);
      window.setTimeout(() => setCopySuccess(null), 2000);
    } catch (copyErr) {
      setError(copyErr instanceof Error ? copyErr.message : 'Impossible de copier le lien');
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      setInvitations((prev) => prev.filter((invitation) => invitation.id !== id));
    } catch (deleteErr) {
      setError(deleteErr instanceof Error ? deleteErr.message : 'Impossible de supprimer cette invitation');
    }
  };

  const summary = useMemo(() => `${invitations.length} invitation(s) créées`, [invitations.length]);

  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] text-white flex items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white">
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-24">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Panel Admin</h1>
          <p className="text-sm text-white/60 mt-1">{summary}</p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md mb-6">
          <div className="mb-4">
            <p className="text-sm text-white/70 mb-2">Type d&apos;invitation</p>
            <div className="grid grid-cols-2 gap-2 max-w-xs">
              {(['studio', 'pro'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewType(type)}
                  className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                    newType === type
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {type === 'studio' ? 'Studio' : 'Pro'}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <input
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="Email destinataire (optionnel)"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/45 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>

          <Button
            onClick={() => void handleCreate()}
            disabled={creating}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            {creating ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white inline-block mr-2" />
                Génération...
              </>
            ) : (
              'Générer un lien'
            )}
          </Button>

          {error ? <p className="text-red-400 text-sm mt-3">{error}</p> : null}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/80 inline-block" />
            </div>
          ) : invitations.length === 0 ? (
            <p className="p-8 text-center text-white/45">Aucune invitation pour le moment.</p>
          ) : (
            <div className="divide-y divide-white/10">
              {invitations.map((invitation) => {
                const isExpired = Boolean(
                  invitation.expires_at && new Date(invitation.expires_at) < new Date(),
                );
                const statusNode = invitation.used
                  ? <span className="text-red-400">Utilisée</span>
                  : isExpired
                    ? <span className="text-white/35">Expirée</span>
                    : <span className="text-green-400">Active</span>;

                return (
                  <div key={invitation.id} className="p-4 grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-3 items-center">
                    <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                      invitation.type === 'studio'
                        ? 'bg-cyan-100 text-cyan-700 border border-cyan-200'
                        : 'bg-orange-100 text-orange-700 border border-orange-200'
                    }`}>
                      {invitation.type}
                    </span>

                    <p className="font-mono text-sm">{invitation.code}</p>
                    <p className="text-white/55 text-sm">{invitation.email || '-'}</p>
                    <div className="text-sm">{statusNode}</div>
                    <p className="text-sm text-white/55">
                      {invitation.expires_at
                        ? new Date(invitation.expires_at).toLocaleDateString('fr-FR')
                        : 'Sans limite'}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleCopy(invitation.code)}
                        className="text-sm text-orange-600 hover:text-orange-700 transition-colors"
                      >
                        {copySuccess === invitation.code ? '✓ Copié !' : 'Copier le lien'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(invitation.id)}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
