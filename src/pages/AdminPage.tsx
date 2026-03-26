import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { toUserFacingErrorMessage } from '@/lib/errors/userFacing';

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
  const usedBy = typeof row.used_by === 'string' ? row.used_by : null;

  return {
    id: row.id,
    code: row.code,
    type: row.type,
    email: typeof row.email === 'string' ? row.email : null,
    used: typeof row.used === 'boolean' ? row.used : usedBy !== null,
    expires_at: row.expires_at ?? null,
    created_at: row.created_at,
  };
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const user = session?.user ?? null;

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState<'studio' | 'pro'>('pro');
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [deletingInvitationId, setDeletingInvitationId] = useState<string | null>(null);

  const buildInvitationCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => chars[byte % chars.length]).join('');
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    let active = true;

    const verifyAdminRights = async () => {
      const { data, error: rpcError } = await supabase.rpc('is_admin_user_secure');
      if (!active) return;

      const payload = Array.isArray(data) ? data[0] : data;
      const isAdmin =
        payload === true
        || (
          typeof payload === 'object'
          && payload !== null
          && 'is_admin_user_secure' in payload
          && (payload as { is_admin_user_secure?: boolean }).is_admin_user_secure === true
        );
      if (rpcError || !isAdmin) {
        navigate('/', { replace: true });
        return;
      }

      setIsAuthorized(true);
    };

    void verifyAdminRights();

    return () => {
      active = false;
    };
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

        let data = expected.data as InvitationRow[] | null;
        let fetchError = expected.error;

        if (fetchError) {
          const fallback = await supabase
            .from('invitations')
            .select('id, code, type, used_by, expires_at, created_at')
            .order('created_at', { ascending: false });
          data = fallback.data as InvitationRow[] | null;
          fetchError = fallback.error;
        }

        if (fetchError) {
          setError(toUserFacingErrorMessage(fetchError, 'Impossible de charger les invitations.'));
          return;
        }

        if (!active) return;
        setInvitations((data ?? []).map(mapRowToInvitation));
      } catch (fetchErr) {
        if (!active) return;
        setError(toUserFacingErrorMessage(fetchErr, 'Impossible de charger les invitations'));
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

    const code = buildInvitationCode();
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
        })
        .select()
        .single();

      let data = expected.data as InvitationRow | null;
      let insertError = expected.error;

      if (insertError) {
        const fallback = await supabase
          .from('invitations')
          .insert({
            code,
            type: newType,
            expires_at,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        data = fallback.data as InvitationRow | null;
        insertError = fallback.error;
      }

      if (insertError || !data) {
        const message = toUserFacingErrorMessage(insertError, "Impossible de créer l'invitation");
        setError(message);
        showToast({ title: 'Création impossible', description: message, variant: 'destructive' });
        return;
      }

      setInvitations((prev) => [mapRowToInvitation(data), ...prev]);
      setNewEmail('');
      showToast({ title: 'Invitation générée', variant: 'default' });
    } catch (createErr) {
      const message = toUserFacingErrorMessage(createErr, "Impossible de créer l'invitation");
      setError(message);
      showToast({ title: 'Création impossible', description: message, variant: 'destructive' });
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
      showToast({ title: 'Lien copié', variant: 'default' });
    } catch (copyErr) {
      const message = toUserFacingErrorMessage(copyErr, 'Impossible de copier le lien');
      setError(message);
      showToast({ title: 'Copie impossible', description: message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer définitivement cette invitation ?')) {
      return;
    }

    setDeletingInvitationId(id);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id);

      if (deleteError) {
        const message = toUserFacingErrorMessage(deleteError, 'Impossible de supprimer cette invitation');
        setError(message);
        showToast({ title: 'Suppression impossible', description: message, variant: 'destructive' });
        return;
      }

      setInvitations((prev) => prev.filter((invitation) => invitation.id !== id));
      showToast({ title: 'Invitation supprimée', variant: 'default' });
    } catch (deleteErr) {
      const message = toUserFacingErrorMessage(deleteErr, 'Impossible de supprimer cette invitation');
      setError(message);
      showToast({ title: 'Suppression impossible', description: message, variant: 'destructive' });
    } finally {
      setDeletingInvitationId(null);
    }
  };

  const summary = useMemo(() => `${invitations.length} invitation(s) créées`, [invitations.length]);

  if (authLoading || !isAuthorized) {
    return (
      <div className="app-shell flex items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Helmet>
        <title>Admin — StudioLink</title>
        <meta name="description" content="Générez et gérez les invitations StudioLink." />
      </Helmet>
      <div className="app-container-wide">
        <header className="mb-6">
          <h1 className="app-title">Panel Admin</h1>
          <p className="app-subtitle mt-1">{summary}</p>
        </header>

        <section className="app-card p-6 mb-6">
          <div className="mb-4">
            <p className="text-sm text-black/70 mb-2">Type d&apos;invitation</p>
            <div className="grid grid-cols-2 gap-2 max-w-xs">
              {(['studio', 'pro'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewType(type)}
                  className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                    newType === type
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/80 text-black/70 hover:bg-white'
                  }`}
                >
                  {type === 'studio' ? 'Studio' : 'Pro'}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <input
              id="admin-invitation-email"
              aria-label="Email destinataire de l’invitation"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="Email destinataire (optionnel)"
              className="w-full glass-input rounded-xl px-4 py-3 text-stone-900 placeholder:text-stone-400"
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

        <section className="app-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black/70 inline-block" />
            </div>
          ) : invitations.length === 0 ? (
            <p className="p-8 text-center text-stone-500">Aucune invitation pour le moment.</p>
          ) : (
            <div className="divide-y divide-white/40">
              {invitations.map((invitation) => {
                const isExpired = Boolean(
                  invitation.expires_at && new Date(invitation.expires_at) < new Date(),
                );
                const statusNode = invitation.used
                  ? <span className="text-red-400">Utilisée</span>
                  : isExpired
                    ? <span className="text-stone-400">Expirée</span>
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
                    <p className="text-stone-500 text-sm">{invitation.email || '-'}</p>
                    <div className="text-sm">{statusNode}</div>
                    <p className="text-sm text-stone-500">
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
                        disabled={deletingInvitationId === invitation.id}
                        onClick={() => void handleDelete(invitation.id)}
                        className="text-sm text-red-500 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingInvitationId === invitation.id ? 'Suppression…' : 'Supprimer'}
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
