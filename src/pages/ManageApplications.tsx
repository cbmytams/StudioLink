import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { ReviewModal } from '@/components/ReviewModal';
import { useToast } from '@/components/ui/Toast';
import { reviewService } from '@/services/reviewService';
import { applicationService } from '@/services/applicationService';
import { normalizeApplicationStatus } from '@/lib/applications/phase2Compat';
import { getPublicProfileDisplayName, getPublicProfilesMap, type PublicProfileRecord } from '@/services/publicProfileService';
import { toUserFacingErrorMessage } from '@/lib/errors/userFacing';
import { Avatar } from '@/components/ui/Avatar';

type ProProfile = PublicProfileRecord;

type Application = {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  cover_letter: string | null;
  proposed_rate: number | null;
  created_at: string;
  pro_id: string;
  pro: ProProfile | null;
};

type Mission = {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'completed' | 'closed';
  selected_pro_id: string | null;
};

type MissionRow = {
  id: string;
  title: string;
  status: string | null;
  selected_pro_id: string | null;
};

type ApplicationRow = {
  id: string;
  status: string | null;
  cover_letter: string | null;
  proposed_rate: number | null;
  created_at: string;
  pro_id: string;
};

function normalizeMissionStatus(status: string | null): Mission['status'] {
  if (status === 'open' || status === 'published' || status === 'selecting') return 'open';
  if (status === 'in_progress' || status === 'filled') return 'in_progress';
  if (status === 'completed' || status === 'rated') return 'completed';
  return 'closed';
}

function missionStatusClass(status: Mission['status']): string {
  if (status === 'completed') return 'border border-emerald-300/30 bg-emerald-400/15 text-emerald-100';
  if (status === 'in_progress') return 'border border-sky-300/30 bg-sky-400/15 text-sky-100';
  if (status === 'closed') return 'border border-rose-300/30 bg-rose-400/15 text-rose-100';
  return 'border border-emerald-300/30 bg-emerald-400/15 text-emerald-100';
}

function applicationStatusClass(status: Application['status']): string {
  if (status === 'accepted') return 'border border-emerald-300/30 bg-emerald-400/15 text-emerald-100';
  if (status === 'rejected') return 'border border-rose-300/30 bg-rose-400/15 text-rose-100';
  return 'border border-amber-300/30 bg-amber-400/15 text-amber-100';
}

export default function ManageApplications() {
  const navigate = useNavigate();
  const { missionId, id } = useParams<{ missionId: string; id: string }>();
  const targetMissionId = missionId ?? id ?? '';
  const { session } = useAuth();
  const { showToast } = useToast();

  const [mission, setMission] = useState<Mission | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ missionId: string; reviewedId: string; reviewedName: string } | null>(null);
  const [reviewedByProId, setReviewedByProId] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 10;

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      if (!targetMissionId) {
        if (!active) return;
        setError('Mission introuvable');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data: missionData, error: missionError } = await supabase
          .from('missions')
          .select('id, title, status, selected_pro_id')
          .eq('id', targetMissionId)
          .single();

        if (missionError) throw missionError;

        const { data: applicationData, error: applicationsError } = await supabase
          .from('applications')
          .select(`
            id,
            status,
            cover_letter,
            proposed_rate,
            created_at,
            pro_id
          `)
          .eq('mission_id', targetMissionId)
          .order('created_at', { ascending: false });

        if (applicationsError) throw applicationsError;
        if (!active) return;

        const mappedMissionRow = missionData as MissionRow;
        const nextMission: Mission = {
          id: mappedMissionRow.id,
          title: mappedMissionRow.title,
          status: normalizeMissionStatus(mappedMissionRow.status),
          selected_pro_id: mappedMissionRow.selected_pro_id,
        };
        setMission(nextMission);

        const rawApplications = (applicationData as ApplicationRow[] | null ?? []);
        const profilesById = await getPublicProfilesMap(rawApplications.map((application) => application.pro_id));

        const mappedApplications = rawApplications.map((application) => ({
          id: application.id,
          status: normalizeApplicationStatus(application.status),
          cover_letter: application.cover_letter,
          proposed_rate: application.proposed_rate,
          created_at: application.created_at,
          pro_id: application.pro_id,
          pro: profilesById.get(application.pro_id) ?? null,
        }));
        setApplications(mappedApplications);

        const acceptedProIds = mappedApplications
          .filter((application) => application.status === 'accepted')
          .map((application) => application.pro_id);

        if (
          session?.user?.id
          && nextMission.status === 'completed'
          && acceptedProIds.length > 0
        ) {
          const hasReviewed = await reviewService.hasReviewed(targetMissionId, session.user.id);
          const nextReviewedByProId: Record<string, boolean> = {};
          acceptedProIds.forEach((proId) => {
            nextReviewedByProId[proId] = hasReviewed;
          });
          setReviewedByProId(nextReviewedByProId);
        } else {
          setReviewedByProId({});
        }

        setCurrentPage(1);
      } catch (fetchError) {
        if (!active) return;
        setError(toUserFacingErrorMessage(fetchError, 'Erreur de chargement'));
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchData();

    if (!targetMissionId) {
      return () => {
        active = false;
      };
    }

    const channel = supabase
      .channel(`manage-applications:${targetMissionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'applications',
        filter: `mission_id=eq.${targetMissionId}`,
      }, () => {
        void fetchData();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'missions',
        filter: `id=eq.${targetMissionId}`,
      }, () => {
        void fetchData();
      })
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [session?.user?.id, targetMissionId]);

  const handleAccept = async (application: Application) => {
    setActionLoading(application.id);
    setError(null);

    try {
      const result = await applicationService.acceptApplication(application.id);

      setApplications((previous) => previous.map((item) => {
        if (item.id === application.id) return { ...item, status: 'accepted' };
        if (item.status === 'pending') return { ...item, status: 'rejected' };
        return item;
      }));
      setMission((previous) => (
        previous
          ? { ...previous, status: 'in_progress', selected_pro_id: application.pro_id }
          : previous
      ));

      showToast({
        title: 'Candidature acceptée',
        description: 'Le pro a été sélectionné pour cette mission.',
        variant: 'default',
      });

      if (result.sessionId) {
        void navigate(`/chat/${result.sessionId}`);
      }
    } catch (actionError) {
      const message = toUserFacingErrorMessage(actionError, "Impossible d'accepter la candidature");
      setError(message);
      showToast({ title: 'Action impossible', description: message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!window.confirm('Refuser cette candidature ?')) {
      return;
    }

    setActionLoading(applicationId);
    setError(null);

    try {
      await applicationService.rejectApplication(applicationId);
      setApplications((previous) =>
        previous.map((item) => (item.id === applicationId ? { ...item, status: 'rejected' } : item)),
      );
      showToast({ title: 'Candidature refusée', variant: 'default' });
    } catch (actionError) {
      const message = toUserFacingErrorMessage(actionError, 'Impossible de rejeter la candidature');
      setError(message);
      showToast({ title: 'Action impossible', description: message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkCompleted = async () => {
    if (!targetMissionId) return;
    if (!window.confirm('Marquer cette mission comme terminée ?')) {
      return;
    }

    setActionLoading(`mission:${targetMissionId}`);
    setError(null);
    try {
      const update = await supabase
        .from('missions')
        .update({ status: 'completed' })
        .eq('id', targetMissionId);

      if (update.error) throw update.error;

      setMission((previous) => (previous ? { ...previous, status: 'completed' } : previous));
      showToast({ title: 'Mission terminée', variant: 'default' });
    } catch (completeError) {
      const message = toUserFacingErrorMessage(completeError, 'Impossible de terminer la mission.');
      setError(message);
      showToast({ title: 'Mise à jour impossible', description: message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(applications.length / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginatedApplications = applications.slice(start, start + PAGE_SIZE);
  const selectedPro = useMemo(
    () => applications.find((application) => application.pro_id === mission?.selected_pro_id)
      ?? applications.find((application) => application.status === 'accepted')
      ?? null,
    [applications, mission?.selected_pro_id],
  );

  if (loading) {
    return (
      <div className="app-shell">
        <div className="app-container flex min-h-[var(--size-full-dvh)] items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Helmet>
        <title>Candidatures — StudioLink</title>
        <meta name="description" content="Gérez les candidatures reçues pour votre mission." />
      </Helmet>
      <div className="app-container">
        <button
          type="button"
          onClick={() => navigate('/studio/dashboard')}
          className="mb-4 inline-flex min-h-[var(--size-touch)] items-center px-1 text-sm app-muted transition-colors hover:text-white"
        >
          ← Mes missions
        </button>

        <header className="mb-6">
          <div className="mb-2 flex items-center gap-3">
            <h1 className="app-title text-2xl">{mission?.title ?? 'Candidatures'}</h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${missionStatusClass(mission?.status ?? 'open')}`}>
              {(mission?.status ?? 'open') === 'closed'
                ? 'Clôturée'
                : (mission?.status ?? 'open') === 'in_progress'
                  ? 'En cours'
                  : (mission?.status ?? 'open') === 'completed'
                    ? 'Terminée'
                    : 'Ouverte'}
            </span>
          </div>
          <p className="app-subtitle mt-0">
            {applications.length} candidature(s) · {applications.filter((item) => item.status === 'pending').length} en attente
          </p>
          {mission?.status === 'in_progress' && selectedPro ? (
            <span
              id="selected-pro-badge"
              className="mt-3 inline-flex rounded-full border border-sky-300/30 bg-sky-400/15 px-3 py-1 text-xs font-medium text-sky-100"
            >
              Pro sélectionné : {getPublicProfileDisplayName(selectedPro.pro)}
            </span>
          ) : null}
          {mission?.status === 'in_progress' ? (
            <button
              type="button"
              onClick={() => void handleMarkCompleted()}
              disabled={actionLoading === `mission:${targetMissionId}`}
              className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-500 disabled:opacity-60"
            >
              Marquer comme terminée
            </button>
          ) : null}
        </header>

        {error ? <p className="text-red-400 text-center">{error}</p> : null}

        {!error && applications.length === 0 ? (
          <p className="app-empty-state">Aucune candidature reçue pour l&apos;instant.</p>
        ) : null}

        <div id="applications-panel" className="app-list">
          {paginatedApplications.map((application) => {
            const displayName = getPublicProfileDisplayName(application.pro);
            const canAct = application.status === 'pending';
            const isCurrentAction = actionLoading === application.id;
            const alreadyReviewed = reviewedByProId[application.pro_id] ?? false;

            return (
              <div
                key={application.id}
                className="application-item app-card-soft p-4"
                data-application-id={application.id}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={application.pro?.avatar_url}
                      name={displayName}
                      size="md"
                      className="border border-white/50"
                    />
                    <div>
                      <p className="font-semibold">{displayName}</p>
                      <button
                        type="button"
                        onClick={() => navigate(`/pro/public/${application.pro_id}`)}
                        className="mt-0.5 inline-flex min-h-[var(--size-touch)] items-center text-xs text-orange-300 hover:underline"
                      >
                        Voir le profil complet →
                      </button>
                      {application.pro?.location ? (
                        <p className="text-sm app-muted">{application.pro.location}</p>
                      ) : null}
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${applicationStatusClass(application.status)}`}>
                    {application.status === 'pending'
                      ? 'En attente'
                      : application.status === 'accepted'
                        ? 'Acceptée'
                        : 'Refusée'}
                  </span>
                </div>

                {application.pro?.skills?.length ? (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {application.pro.skills.slice(0, 4).map((skill) => (
                      <span key={skill} className="app-chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}

                {application.cover_letter ? (
                  <p className="mt-2 text-sm text-white/75">{application.cover_letter}</p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <p className="text-white/75">
                    Tarif proposé : {application.proposed_rate ? `${application.proposed_rate}€/j` : 'Non renseigné'}
                  </p>
                  <p className="app-muted">
                    {new Date(application.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {canAct ? (
                  <div className="mt-4 flex gap-2">
                    <button
                      id={`btn-accept-${application.id}`}
                      type="button"
                      onClick={() => void handleAccept(application)}
                      disabled={Boolean(actionLoading)}
                      className="inline-flex min-h-[var(--size-touch)] items-center justify-center rounded-xl bg-green-600 px-4 text-sm font-medium text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCurrentAction ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Traitement...
                        </>
                      ) : (
                        'Accepter ✓'
                      )}
                    </button>
                    <button
                      id={`btn-reject-${application.id}`}
                      type="button"
                      onClick={() => void handleReject(application.id)}
                      disabled={Boolean(actionLoading)}
                      className="inline-flex min-h-[var(--size-touch)] items-center justify-center rounded-xl border border-red-300/30 bg-red-500/10 px-4 text-sm font-medium text-red-100 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Refuser ✗
                    </button>
                  </div>
                ) : application.status === 'accepted' ? (
                  <p className="mt-4 text-xs font-medium text-emerald-200">
                    Ce candidat a déjà été sélectionné pour la mission.
                  </p>
                ) : (
                  <p className="mt-4 text-xs font-medium text-white/55">
                    Cette candidature a déjà été traitée.
                  </p>
                )}

                {mission?.status === 'completed' && application.status === 'accepted' ? (
                  <button
                    type="button"
                    onClick={() => setReviewTarget({
                      missionId: targetMissionId,
                      reviewedId: application.pro_id,
                      reviewedName: displayName,
                    })}
                    disabled={alreadyReviewed}
                    className={alreadyReviewed
                      ? 'mt-3 cursor-not-allowed text-xs text-gray-400'
                      : 'mt-3 text-xs text-orange-500 hover:underline'}
                  >
                    {alreadyReviewed ? '✓ Avis déposé' : 'Laisser un avis →'}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        {applications.length > PAGE_SIZE ? (
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 disabled:opacity-50"
            >
              ← Précédent
            </button>
            <p className="text-xs app-muted">
              Page {currentPage} / {totalPages}
            </p>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 disabled:opacity-50"
            >
              Suivant →
            </button>
          </div>
        ) : null}
      </div>

      {reviewTarget ? (
        <ReviewModal
          isOpen={Boolean(reviewTarget)}
          missionId={reviewTarget.missionId}
          reviewedId={reviewTarget.reviewedId}
          reviewedName={reviewTarget.reviewedName}
          onSubmitted={() => {
            setReviewedByProId((previous) => ({ ...previous, [reviewTarget.reviewedId]: true }));
          }}
          onClose={() => setReviewTarget(null)}
        />
      ) : null}
    </div>
  );
}
