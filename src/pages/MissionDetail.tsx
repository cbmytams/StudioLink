import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { useToast } from '@/components/ui/Toast';
import { useMobileFixedBottomStyle } from '@/hooks/useVisualViewport';
import { normalizeMissionStatus } from '@/lib/missions/phase1Compat';
import { normalizeApplicationStatus } from '@/lib/applications/phase2Compat';
import { ApplyModal } from '@/components/ApplyModal';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { Avatar } from '@/components/ui/Avatar';
import type { MissionFileRecord } from '@/types/backend';
import type { Database } from '@/types/supabase';
import { getMissionFiles, getSignedUrl } from '@/lib/files/fileService';
import { getPublicProfile, getPublicProfileDisplayName, type PublicProfileRecord } from '@/services/publicProfileService';

type MissionRecord = Pick<
Database['public']['Tables']['missions']['Row'],
| 'id'
| 'studio_id'
| 'title'
| 'description'
| 'category'
| 'service_type'
| 'location'
| 'city'
| 'date'
| 'end_date'
| 'daily_rate'
| 'price'
| 'skills_required'
| 'genres'
| 'status'
>;

type Mission = {
  id: string
  title: string
  description: string | null
  category: string | null
  location: string | null
  city: string | null
  date: string | null
  end_date: string | null
  daily_rate: number | null
  skills_required: string[]
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled'
  studio: PublicProfileRecord | null
};

type Application = {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
};

type ApplicationRow = {
  id: string
  status: string | null
  created_at: string
};

const MISSION_DETAIL_SELECT_COLUMNS =
  'id, studio_id, title, description, category, service_type, location, city, date, end_date, daily_rate, price, skills_required, genres, status';

function parseRate(value: number | string | null | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 0) return Number.parseInt(digits, 10);
  }
  return null;
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function statusBadgeClass(status: Mission['status']): string {
  if (status === 'open') return 'bg-green-100 text-green-700 border border-green-200';
  if (status === 'in_progress') return 'bg-blue-100 text-blue-700 border border-blue-200';
  if (status === 'completed') return 'bg-stone-100 text-stone-700 border border-stone-200';
  if (status === 'draft') return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
  return 'bg-red-100 text-red-700 border border-red-200';
}

function statusLabel(status: Mission['status']): string {
  if (status === 'open') return 'Ouverte';
  if (status === 'in_progress') return 'En cours';
  if (status === 'completed') return 'Terminée';
  if (status === 'draft') return 'Brouillon';
  return 'Annulée';
}

export default function MissionDetail() {
  const { id, missionId } = useParams<{ id?: string; missionId?: string }>();
  const targetMissionId = id ?? missionId ?? '';
  const navigate = useNavigate();
  const { session } = useAuth();
  const { showToast } = useToast();
  const mobileFooterStyle = useMobileFixedBottomStyle(64);
  const userId = session?.user?.id ?? null;

  const [mission, setMission] = useState<Mission | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [referenceFiles, setReferenceFiles] = useState<MissionFileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const loadMission = async () => {
      if (!targetMissionId) {
        if (!active) return;
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setNotFound(false);
      setError(null);

      try {
        const { data: missionRow, error: missionError } = await supabase
          .from('missions')
          .select(MISSION_DETAIL_SELECT_COLUMNS)
          .eq('id', targetMissionId)
          .maybeSingle();

        if (missionError) throw missionError;
        if (!missionRow) {
          if (!active) return;
          setNotFound(true);
          return;
        }

        const rawMission: MissionRecord = missionRow;

        const studioProfile = await getPublicProfile(rawMission.studio_id);

        const normalizedMission: Mission = {
          id: rawMission.id,
          title: rawMission.title ?? 'Mission',
          description: rawMission.description,
          category: rawMission.category ?? rawMission.service_type ?? null,
          location: rawMission.location ?? rawMission.city ?? null,
          city: rawMission.city ?? rawMission.location ?? null,
          date: rawMission.date ?? null,
          end_date: rawMission.end_date ?? null,
          daily_rate: parseRate(rawMission.daily_rate ?? rawMission.price),
          skills_required: rawMission.skills_required
            ?? rawMission.genres
            ?? [],
          status: normalizeMissionStatus(rawMission.status ?? null),
          studio: studioProfile,
        };

        if (!active) return;
        setMission(normalizedMission);

        if (!userId) {
          setApplication(null);
          return;
        }

        const { data: existingApplication, error: applicationError } = await supabase
          .from('applications')
          .select('id, status, created_at')
          .eq('mission_id', targetMissionId)
          .eq('pro_id', userId)
          .maybeSingle();

        if (applicationError) throw applicationError;
        if (!active) return;

        const existing = existingApplication as ApplicationRow | null;
        setApplication(existing ? {
          id: existing.id,
          status: normalizeApplicationStatus(existing.status),
          created_at: existing.created_at,
        } : null);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Impossible de charger la mission.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadMission();

    return () => {
      active = false;
    };
  }, [targetMissionId, userId]);

  useEffect(() => {
    let active = true;

    const loadReferenceFiles = async () => {
      if (!targetMissionId || !userId) {
        if (!active) return;
        setReferenceFiles([]);
        return;
      }

      try {
        const files = await getMissionFiles(targetMissionId);
        if (!active) return;
        setReferenceFiles(files);
      } catch {
        if (!active) return;
        setReferenceFiles([]);
      }
    };

    void loadReferenceFiles();

    return () => {
      active = false;
    };
  }, [application?.id, targetMissionId, userId]);

  useEffect(() => {
    if (!targetMissionId) return undefined;

    const missionChannel = supabase
      .channel(`mission-detail:${targetMissionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'missions',
        filter: `id=eq.${targetMissionId}`,
      }, (payload) => {
        setMission((previous) => (
          previous
            ? { ...previous, status: normalizeMissionStatus((payload.new as { status?: string | null }).status ?? null) }
            : previous
        ));
      })
      .subscribe();

    const applicationChannel = supabase
      .channel(`mission-detail-application:${targetMissionId}:${userId ?? 'guest'}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'applications',
        filter: `mission_id=eq.${targetMissionId}`,
      }, (payload) => {
        const nextRow = payload.eventType === 'DELETE'
          ? payload.old as Partial<ApplicationRow & { pro_id?: string }>
          : payload.new as Partial<ApplicationRow & { pro_id?: string }>;
        if (!userId || nextRow.pro_id !== userId) return;

        if (payload.eventType === 'DELETE') {
          setApplication(null);
          return;
        }

        if (nextRow.id && nextRow.created_at) {
          setApplication({
            id: nextRow.id,
            status: normalizeApplicationStatus(nextRow.status ?? null),
            created_at: nextRow.created_at,
          });
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(missionChannel);
      void supabase.removeChannel(applicationChannel);
    };
  }, [targetMissionId, userId]);

  const handleOpenApplyModal = () => {
    if (!userId) {
      navigate('/login');
      return;
    }
    setIsApplyModalOpen(true);
  };

  const missionMeta = useMemo(() => {
    if (!mission) return [];
    const tokens: string[] = [];
    if (mission.location) tokens.push(`📍 ${mission.location}`);
    if (mission.daily_rate !== null) tokens.push(`💰 ${mission.daily_rate} €/j`);
    const missionDate = formatDate(mission.date);
    const missionEndDate = formatDate(mission.end_date);
    if (missionDate) tokens.push(`📅 ${missionDate}`);
    if (missionEndDate) tokens.push(`→ ${missionEndDate}`);
    return tokens;
  }, [mission]);

  const handleDownloadReference = async (file: MissionFileRecord) => {
    try {
      const signedUrl = await getSignedUrl('mission-files', file.file_url);
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (downloadError) {
      showToast({
        title: 'Téléchargement impossible',
        description: downloadError instanceof Error ? downloadError.message : 'Impossible de générer le lien.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="app-shell min-h-[100dvh] pb-28">
        <div className="animate-pulse space-y-4 pt-6 px-4 max-w-2xl mx-auto">
          <div className="h-7 bg-white/10 rounded w-3/4" />
          <div className="flex items-center gap-3 mt-2">
            <div className="w-8 h-8 rounded-full bg-white/10" />
            <div className="h-4 bg-white/10 rounded w-32" />
          </div>
          <div className="h-3 bg-white/10 rounded w-full mt-6" />
          <div className="h-3 bg-white/10 rounded w-5/6" />
          <div className="h-3 bg-white/10 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (notFound || !mission) {
    return (
      <div className="app-shell min-h-[100dvh] pb-28">
        <div className="app-container-compact">
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-white/60 text-sm">Cette mission n&apos;existe pas ou n&apos;est plus disponible.</p>
            <button
              type="button"
              onClick={() => navigate('/pro/missions')}
              className="mx-auto mt-2 inline-flex min-h-[44px] items-center text-sm text-orange-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
            >
              Retour aux missions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showApplyButton = !application && mission.status === 'open';
  const showClosedState = !application && mission.status !== 'open';

  const studioName = getPublicProfileDisplayName(mission?.studio);

  return (
    <div className="app-shell min-h-[100dvh] pb-28">
      <SEO
        title={mission.title}
        description={mission.description ? mission.description.slice(0, 160) : 'Detail mission StudioLink'}
        url={`/missions/${mission.id}`}
      />
      <div className="app-container-compact">
          <button
            type="button"
            onClick={() => navigate('/pro/missions')}
            className="mb-6 inline-flex min-h-[44px] items-center gap-2 px-1 text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
          >
            <span>←</span> Retour aux missions
          </button>

        {error ? (
          <ErrorMessage
            title="Impossible de charger cette mission"
            message={error}
            onRetry={() => window.location.reload()}
            className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/5"
          />
        ) : null}

        <section className="app-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-white">{mission.title}</h1>
            {mission.category ? (
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70">
                {mission.category}
              </span>
            ) : null}
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(mission.status)}`}>
              {statusLabel(mission.status)}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Avatar
              src={mission.studio?.avatar_url}
              name={studioName}
              size="md"
              className="border border-white/20 bg-orange-500/20 text-orange-200"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">{studioName}</p>
              {mission.studio ? (
                <button
                  type="button"
                  onClick={() => navigate(`/studio/public/${mission.studio?.id}`)}
                  className="inline-flex min-h-[44px] items-center text-xs text-orange-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
                >
                  Voir le profil du studio →
                </button>
              ) : null}
            </div>
          </div>

          {missionMeta.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-4 text-xs text-white/60">
              {missionMeta.map((token) => (
                <span key={token} className={token.includes('💰') ? 'text-orange-300 font-medium' : ''}>
                  {token}
                </span>
              ))}
            </div>
          ) : null}

          <section className="mt-6">
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">Description</h2>
            {mission.description ? (
              <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
                {mission.description}
              </p>
            ) : (
              <p className="text-sm text-white/40 italic">Aucune description.</p>
            )}
          </section>

          {mission.skills_required.length > 0 ? (
            <section className="mt-5">
              <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
                Compétences requises
              </h2>
              <div className="flex flex-wrap gap-2">
                {mission.skills_required.map((skill) => (
                  <span
                    key={skill}
                    className="bg-orange-500/15 text-orange-200 text-xs px-2 py-0.5 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {referenceFiles.length > 0 ? (
            <section className="mt-5">
              <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
                Fichiers de référence
              </h2>
              <div className="space-y-2">
                {referenceFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{file.file_name}</p>
                      <p className="text-xs text-white/40">
                        {file.mime_type ?? 'Fichier'}{file.file_size ? ` · ${Math.round(file.file_size / 1024)} Ko` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void handleDownloadReference(file);
                      }}
                      className="inline-flex min-h-[44px] shrink-0 items-center px-2 text-xs font-medium text-orange-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
                    >
                      Télécharger
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-5">
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">À propos du studio</h2>
            <p className="text-sm text-white/70 leading-relaxed">
              {mission.studio?.bio ?? '—'}
            </p>
          </section>
        </section>
      </div>

      <div
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 border-t border-white/10 bg-[#0A0B10]/90 p-4 pb-safe backdrop-blur-md md:static md:mt-6 md:border-t-0 md:bg-transparent md:p-0"
        style={mobileFooterStyle}
      >
        <div className="mx-auto max-w-2xl md:px-0">
          {showApplyButton ? (
            <>
              <button
                id="btn-apply"
                type="button"
                onClick={handleOpenApplyModal}
                className="min-h-[48px] w-full rounded-2xl bg-orange-500 py-3 font-semibold text-white transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 disabled:opacity-50"
              >
                Candidater
              </button>
            </>
          ) : null}

          {application?.status === 'pending' ? (
            <div id="apply-status-badge" className="w-full bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm font-medium py-3 rounded-2xl text-center">
              ⏳ Candidature envoyée · En attente
            </div>
          ) : null}

          {application?.status === 'accepted' ? (
            <div id="apply-status-badge" className="w-full bg-green-50 border border-green-200 text-green-700 text-sm font-medium py-3 rounded-2xl text-center">
              ✓ Candidature acceptée
            </div>
          ) : null}

          {application?.status === 'rejected' ? (
            <div id="apply-status-badge" className="w-full bg-red-50 border border-red-200 text-red-500 text-sm font-medium py-3 rounded-2xl text-center">
              ✗ Candidature refusée
            </div>
          ) : null}

          {showClosedState ? (
            <div className="w-full bg-white/5 border border-white/10 text-white/60 text-sm font-medium py-3 rounded-2xl text-center">
              Cette mission n&apos;accepte plus de candidatures.
            </div>
          ) : null}
        </div>
      </div>
      <ApplyModal
        isOpen={isApplyModalOpen}
        missionId={targetMissionId}
        onClose={() => setIsApplyModalOpen(false)}
        onSubmitted={(createdApplication) => {
          setApplication({
            id: createdApplication.id,
            status: createdApplication.status,
            created_at: createdApplication.created_at,
          });
          void getMissionFiles(targetMissionId).then(setReferenceFiles).catch(() => undefined);
        }}
      />
    </div>
  );
}
