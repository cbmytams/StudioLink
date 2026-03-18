import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CircleX, Clock3, Euro, MapPin } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ApplyModal } from '@/components/ApplyModal';
import { ReviewModal } from '@/components/ReviewModal';
import { useMission, useUpdateMissionStatus } from '@/hooks/useMissions';
import { useMissionApplications, useUpdateApplicationStatus } from '@/hooks/useApplications';
import { useReviews } from '@/hooks/useReviews';
import { useToast } from '@/components/ui/Toast';
import type { MissionStatus, ApplicationStatus } from '@/types/backend';

const STATUS_LABELS: Record<MissionStatus, string> = {
  draft: 'Brouillon',
  published: 'Publiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const STATUS_VARIANTS: Record<MissionStatus, 'default' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  published: 'success',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
};

const TRANSITION_MAP: Partial<
  Record<MissionStatus, { label: string; next: MissionStatus; variant: 'primary' | 'ghost' }>
> = {
  draft: { label: '📢 Publier la mission', next: 'published', variant: 'primary' },
  published: { label: '▶️ Marquer en cours', next: 'in_progress', variant: 'primary' },
  in_progress: { label: '✅ Marquer terminée', next: 'completed', variant: 'primary' },
};

function StatusActionButtons({
  applicationId,
  onUpdate,
  disabled,
}: {
  applicationId: string;
  onUpdate: (id: string, status: ApplicationStatus) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        className="min-h-[44px]"
        disabled={disabled}
        onClick={() => onUpdate(applicationId, 'selected')}
      >
        Retenir
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="min-h-[44px]"
        disabled={disabled}
        onClick={() => onUpdate(applicationId, 'rejected')}
      >
        Refuser
      </Button>
    </div>
  );
}

export default function MissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const userId = profile?.id;
  const userType = profile?.user_type;
  const isStudio = userType === 'studio';
  const { showToast } = useToast();

  const { data: mission, isLoading, error } = useMission(id);
  const { data: applications = [] } = useMissionApplications(id);
  const { data: reviews = [] } = useReviews(isStudio ? applications[0]?.pro_id : mission?.studio_id);
  const updateStatusMutation = useUpdateMissionStatus();
  const updateApplicationMutation = useUpdateApplicationStatus();

  const [currentStatus, setCurrentStatus] = useState<MissionStatus>('draft');
  const [applyOpen, setApplyOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    if (mission) setCurrentStatus(mission.status);
  }, [mission]);

  const hasApplied = useMemo(() => {
    if (!userId) return false;
    return applications.some((application) => application.pro_id === userId);
  }, [applications, userId]);

  const selectedApplication = useMemo(
    () => applications.find((application) => application.status === 'selected'),
    [applications],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-200 border-t-orange-500" />
      </div>
    );
  }

  if (!mission || error) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl p-4 pb-24">
        <GlassCard className="p-8 text-center">
          <p className="text-base font-medium">Mission introuvable.</p>
          <Button className="mt-4" onClick={() => navigate(isStudio ? '/studio/dashboard' : '/pro/feed')}>
            Retour
          </Button>
        </GlassCard>
      </main>
    );
  }

  const transition = TRANSITION_MAP[currentStatus];
  const revieweeId = isStudio ? selectedApplication?.pro_id : mission.studio_id;

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-4 pb-36">
      <header className="mb-5 flex items-center justify-between">
        <Button
          variant="icon"
          size="icon"
          onClick={() => navigate(isStudio ? '/studio/dashboard' : '/pro/feed')}
        >
          <ArrowLeft size={18} />
        </Button>
        <Badge variant={STATUS_VARIANTS[currentStatus]}>{STATUS_LABELS[currentStatus]}</Badge>
      </header>

      <GlassCard className="mb-4 p-5">
        <h1 className="text-xl font-semibold">{mission.service_type}</h1>
        <p className="mt-1 text-sm text-stone-600">{mission.artist_name || 'Confidentiel'}</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm text-stone-700">
            <MapPin size={15} className="text-stone-500" />
            {mission.location || 'Paris'}
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-700">
            <Euro size={15} className="text-stone-500" />
            {mission.price || 'À négocier'}
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-700">
            <Clock3 size={15} className="text-stone-500" />
            {mission.duration || 'Durée non précisée'}
          </div>
          <div className="text-sm text-stone-700">
            Genres: {mission.genres.join(', ') || 'Non renseigné'}
          </div>
        </div>
      </GlassCard>

      {isStudio ? (
        <GlassCard className="mb-4 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Candidatures</h2>
            <span className="text-xs text-stone-500">{applications.length} total</span>
          </div>
          {applications.length === 0 ? (
            <p className="text-sm text-stone-500">Aucune candidature pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {applications.map((application) => (
                <div key={application.id} className="rounded-xl border border-stone-200 bg-white/80 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Pro: {application.pro_id.slice(0, 8)}…</p>
                    <Badge
                      variant={
                        application.status === 'selected'
                          ? 'success'
                          : application.status === 'rejected'
                            ? 'error'
                            : 'warning'
                      }
                    >
                      {application.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-stone-600">{application.message || 'Sans message'}</p>
                  {application.status === 'pending' ? (
                    <div className="mt-3">
                      <StatusActionButtons
                        applicationId={application.id}
                        disabled={updateApplicationMutation.isPending}
                        onUpdate={(applicationId, status) => {
                          updateApplicationMutation.mutate(
                            { id: applicationId, status },
                            {
                              onSuccess: () => {
                                if (status === 'selected') {
                                  updateStatusMutation.mutate({ id: mission.id, status: 'in_progress' });
                                  setCurrentStatus('in_progress');
                                }
                              },
                            },
                          );
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      ) : (
        <GlassCard className="mb-4 p-5">
          {hasApplied ? (
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 size={18} />
              <p className="text-sm font-medium">Candidature déjà envoyée</p>
            </div>
          ) : currentStatus === 'published' ? (
            <Button className="w-full min-h-[44px]" onClick={() => setApplyOpen(true)}>
              Postuler
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-stone-600">
              <CircleX size={18} />
              <p className="text-sm">Mission non disponible pour candidature.</p>
            </div>
          )}
        </GlassCard>
      )}

      {isStudio && transition ? (
        <div className="mb-4">
          <Button
            variant={transition.variant}
            className="w-full min-h-[44px]"
            onClick={() => {
              updateStatusMutation.mutate(
                { id: mission.id, status: transition.next },
                {
                  onSuccess: () => {
                    setCurrentStatus(transition.next);
                    showToast({
                      title: `Mission passée en ${STATUS_LABELS[transition.next]}`,
                      variant: 'default',
                    });
                    if (transition.next === 'completed' && revieweeId) {
                      setReviewOpen(true);
                    }
                  },
                },
              );
            }}
          >
            {transition.label}
          </Button>
        </div>
      ) : null}

      <GlassCard className="p-5">
        <h3 className="mb-3 text-base font-semibold">Avis</h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-stone-500">Aucun avis pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-stone-200 bg-white/80 p-3">
                <p className="text-sm font-medium">Note: {review.rating}/5</p>
                <p className="mt-1 text-sm text-stone-600">{review.comment || 'Sans commentaire'}</p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <ApplyModal
        isOpen={applyOpen}
        missionId={mission.id}
        onClose={() => setApplyOpen(false)}
      />

      {revieweeId ? (
        <ReviewModal
          isOpen={reviewOpen}
          missionId={mission.id}
          revieweeId={revieweeId}
          onClose={() => setReviewOpen(false)}
        />
      ) : null}
    </main>
  );
}
