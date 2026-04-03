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
  uses: number | null
  max_uses: number | null
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

type AdminStats = {
  totalUsers: number;
  studios: number;
  pros: number;
  activeMissions: number;
  pendingApplications: number;
  completedSessions: number;
};

const ADMIN_FALLBACK_EMAILS = [
  'sasha@wafia.fr',
  import.meta.env.VITE_ADMIN_EMAIL ?? '',
]
  .map((email) => email.trim().toLowerCase())
  .filter((email): email is string => Boolean(email));

function mapRowToInvitation(row: InvitationRow): Invitation {
  const usedBy = typeof row.used_by === 'string' ? row.used_by : null;

  return {
    id: row.id,
    code: row.code,
    type: row.type,
    email: typeof row.email === 'string' ? row.email : null,
    used: typeof row.used === 'boolean' ? row.used : usedBy !== null,
    uses: typeof row.used === 'boolean' && row.used ? 1 : 0,
    max_uses: 1,
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
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState<'studio' | 'pro'>('pro');
  const [newEmail, setNewEmail] = useState('');
  const [batchCount, setBatchCount] = useState(1);
  const [maxUses, setMaxUses] = useState(1);
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
      const emailFallbackAuthorized = ADMIN_FALLBACK_EMAILS.includes(user.email?.toLowerCase() ?? '');
      if ((rpcError || !isAdmin) && !emailFallbackAuthorized) {
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
        const [
          { count: totalUsers, error: totalUsersError },
          { count: studios, error: studiosError },
          { count: pros, error: prosError },
          { count: activeMissions, error: activeMissionsError },
          { count: pendingApplications, error: pendingApplicationsError },
          { count: completedSessions, error: completedSessionsError },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'studio'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'pro'),
          supabase.from('missions').select('*', { count: 'exact', head: true }).in('status', ['published', 'open', 'in_progress']),
          supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        ]);

        if (
          totalUsersError
          || studiosError
          || prosError
          || activeMissionsError
          || pendingApplicationsError
          || completedSessionsError
        ) {
          setError('Impossible de charger les statistiques admin.');
        } else if (active) {
          setStats({
            totalUsers: totalUsers ?? 0,
            studios: studios ?? 0,
            pros: pros ?? 0,
            activeMissions: activeMissions ?? 0,
            pendingApplications: pendingApplications ?? 0,
            completedSessions: completedSessions ?? 0,
          });
        }

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

    const count = Math.max(1, Math.min(50, Math.floor(batchCount || 1)));
    const cappedMaxUses = Math.max(1, Math.min(50, Math.floor(maxUses || 1)));
    const now = new Date().toISOString();
    const codes = Array.from({ length: count }, () => buildInvitationCode());

    try {
      const { data, error: insertError } = await supabase
        .from('invitations')
        .insert(
          codes.map((code) => ({
            code,
            type: newType,
            email: newEmail.trim() || null,
            used: false,
            expires_at: null,
            created_at: now,
          })),
        )
        .select();

      if (insertError || !data || data.length === 0) {
        const message = toUserFacingErrorMessage(insertError, "Impossible de créer l'invitation");
        setError(message);
        showToast({ title: 'Création impossible', description: message, variant: 'destructive' });
        return;
      }

      setInvitations((prev) => [...data.map(mapRowToInvitation), ...prev]);
      setNewEmail('');
      if (cappedMaxUses > 1) {
        showToast({
          title: `${data.length} invitation(s) générée(s)`,
          description: 'Schema actuel: max_uses non persiste (limite effective a 1 usage).',
          variant: 'default',
        });
        return;
      }
      showToast({ title: `${data.length} invitation(s) générée(s)`, variant: 'default' });
    } catch (createErr) {
      const message = toUserFacingErrorMessage(createErr, "Impossible de créer l'invitation");
      setError(message);
      showToast({ title: 'Création impossible', description: message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    setDeletingInvitationId(id);
    setError(null);

    const nowIso = new Date().toISOString();
    try {
      const { error: deactivateError } = await supabase
        .from('invitations')
        .update({ used: true, expires_at: nowIso })
        .eq('id', id);

      if (deactivateError) {
        const message = toUserFacingErrorMessage(deactivateError, "Impossible de désactiver l'invitation");
        setError(message);
        showToast({ title: 'Désactivation impossible', description: message, variant: 'destructive' });
        return;
      }

      setInvitations((prev) => prev.map((invitation) => (
        invitation.id === id
          ? { ...invitation, used: true, expires_at: nowIso }
          : invitation
      )));
      showToast({ title: 'Code désactivé', variant: 'default' });
    } catch (deactivateErr) {
      const message = toUserFacingErrorMessage(deactivateErr, "Impossible de désactiver l'invitation");
      setError(message);
      showToast({ title: 'Désactivation impossible', description: message, variant: 'destructive' });
    } finally {
      setDeletingInvitationId(null);
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
          <h1 className="app-title">Administration</h1>
          <p className="app-subtitle mt-1">{summary}</p>
        </header>

        {stats ? (
          <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              { label: 'Total utilisateurs', value: stats.totalUsers },
              { label: 'Studios', value: stats.studios },
              { label: 'Pros', value: stats.pros },
              { label: 'Missions actives', value: stats.activeMissions },
              { label: 'Candidatures en attente', value: stats.pendingApplications },
              { label: 'Sessions terminées', value: stats.completedSessions },
            ].map((item) => (
              <article key={item.label} className="app-card p-4 text-center">
                <p className="text-2xl font-semibold tabular-nums text-white">{item.value}</p>
                <p className="mt-1 text-xs text-white/55">{item.label}</p>
              </article>
            ))}
          </section>
        ) : null}

        <section className="app-card p-6 mb-6">
          <h2 className="mb-4 text-base font-semibold text-white">Codes d&apos;invitation</h2>
          <div className="mb-4">
            <p className="mb-2 text-sm text-white/70">Type d&apos;invitation</p>
            <div className="grid grid-cols-2 gap-2 max-w-xs">
              {(['studio', 'pro'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewType(type)}
                  className={`min-h-[var(--size-touch)] rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 ${
                    newType === type
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {type === 'studio' ? 'Studio' : 'Pro'}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <input
              id="admin-invitation-email"
              aria-label="Email destinataire de l’invitation"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="Email destinataire (optionnel)"
              className="w-full glass-input rounded-xl px-4 py-3 md:col-span-2"
            />
            <input
              id="admin-invitation-count"
              aria-label="Nombre de codes à générer"
              type="number"
              min={1}
              max={50}
              value={batchCount}
              onChange={(event) => setBatchCount(Number(event.target.value) || 1)}
              placeholder="Nombre"
              className="w-full glass-input rounded-xl px-4 py-3"
            />
            <input
              id="admin-invitation-max-uses"
              aria-label="Nombre d'utilisations max par code"
              type="number"
              min={1}
              max={50}
              value={maxUses}
              onChange={(event) => setMaxUses(Number(event.target.value) || 1)}
              placeholder="Max usages"
              className="w-full glass-input rounded-xl px-4 py-3"
            />
          </div>

          <Button
            onClick={() => void handleCreate()}
            disabled={creating}
            loading={creating}
            loadingLabel="Génération..."
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            Générer des codes
          </Button>

          {error ? <p className="text-red-400 text-sm mt-3">{error}</p> : null}
        </section>

        <section className="app-card overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black/70 inline-block" />
            </div>
          ) : invitations.length === 0 ? (
            <p className="p-8 text-center text-white/55">Aucune invitation pour le moment.</p>
          ) : (
            <div className="divide-y divide-white/40">
              {invitations.map((invitation) => {
                const isExpired = Boolean(
                  invitation.expires_at && new Date(invitation.expires_at) < new Date(),
                );
                const statusNode = invitation.used
                  ? <span className="text-red-400">Désactivée</span>
                  : isExpired
                    ? <span className="text-stone-400">Expirée</span>
                    : <span className="text-green-400">Active</span>;
                const usageLabel = invitation.max_uses && invitation.max_uses > 0
                  ? `${invitation.uses ?? 0}/${invitation.max_uses}`
                  : invitation.used
                    ? '1/1'
                    : '0/1';

                return (
                  <div key={invitation.id} className="p-4 grid grid-cols-1 md:grid-cols-[var(--layout-admin-grid)] gap-3 items-center">
                    <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                      invitation.type === 'studio'
                        ? 'bg-cyan-100 text-cyan-700 border border-cyan-200'
                        : 'bg-orange-100 text-orange-700 border border-orange-200'
                    }`}>
                      {invitation.type}
                    </span>

                    <p className="font-mono text-sm">{invitation.code}</p>
                    <p className="text-sm text-white/65">{invitation.email || '-'}</p>
                    <div className="text-sm">{statusNode}</div>
                    <p className="text-sm text-white/65">{usageLabel}</p>
                    <p className="text-sm text-white/65">
                      {invitation.expires_at
                        ? new Date(invitation.expires_at).toLocaleDateString('fr-FR')
                        : 'Sans limite'}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleCopy(invitation.code)}
                        className="inline-flex min-h-[var(--size-touch)] items-center rounded-xl px-2 text-sm text-orange-600 transition-colors hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
                      >
                        {copySuccess === invitation.code ? '✓ Copié !' : 'Copier le lien'}
                      </button>
                      <button
                        type="button"
                        disabled={deletingInvitationId === invitation.id || invitation.used}
                        onClick={() => void handleDeactivate(invitation.id)}
                        className="inline-flex min-h-[var(--size-touch)] items-center rounded-xl px-2 text-sm text-amber-600 transition-colors hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingInvitationId === invitation.id ? 'Désactivation…' : 'Désactiver'}
                      </button>
                      <button
                        type="button"
                        disabled={deletingInvitationId === invitation.id}
                        onClick={() => void handleDelete(invitation.id)}
                        className="inline-flex min-h-[var(--size-touch)] items-center rounded-xl px-2 text-sm text-red-500 transition-colors hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
