import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';

type ProProfile = {
  full_name: string | null
  username: string | null
  skills: string[] | null
  city: string | null
  daily_rate: number | null
}

type Application = {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  cover_letter: string | null
  proposed_rate: number | null
  created_at: string
  pro_id: string
  profiles: ProProfile | null
}

type Mission = {
  id: string
  title: string
  status: string
  deadline: string | null
  budget_min: number | null
  budget_max: number | null
}

type MissionRow = {
  id: string
  title: string
  status: string | null
  deadline: string | null
  budget_min: number | null
  budget_max: number | null
}

type ApplicationRow = {
  id: string
  status: string | null
  cover_letter: string | null
  proposed_rate: number | null
  created_at: string
  pro_id: string
  profiles: ProProfile | null
}

function normalizeMissionStatus(status: string | null): string {
  if (status === 'open' || status === 'published' || status === 'selecting') return 'open';
  if (status === 'closed' || status === 'filled' || status === 'cancelled' || status === 'expired') {
    return 'closed';
  }
  return status ?? 'open';
}

function normalizeApplicationStatus(status: string | null): Application['status'] {
  if (status === 'accepted' || status === 'selected') return 'accepted';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

function missionStatusClass(status: string): string {
  return status === 'closed'
    ? 'bg-red-100 text-red-700 border border-red-200'
    : 'bg-green-100 text-green-700 border border-green-200';
}

function applicationStatusClass(status: Application['status']): string {
  if (status === 'accepted') return 'bg-green-100 text-green-700';
  if (status === 'rejected') return 'bg-red-100 text-red-700';
  return 'bg-yellow-100 text-yellow-700';
}

export default function ManageApplications() {
  const navigate = useNavigate();
  const { missionId, id } = useParams<{ missionId: string; id: string }>();
  const targetMissionId = missionId ?? id ?? '';
  const { session } = useAuth();

  const [mission, setMission] = useState<Mission | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        const missionColumns: string = 'id, title, status, deadline, budget_min, budget_max';
        const { data: missionData, error: missionError } = await supabase
          .from('missions')
          .select(missionColumns)
          .eq('id', targetMissionId)
          .single();

        if (missionError) throw missionError;

        const applicationsQuery: string = `
          id,
          status,
          cover_letter,
          proposed_rate,
          created_at,
          pro_id,
          profiles:pro_id (
            full_name,
            username,
            skills,
            city,
            daily_rate
          )
        `;
        const { data: applicationData, error: applicationsError } = await supabase
          .from('applications')
          .select(applicationsQuery)
          .eq('mission_id', targetMissionId)
          .order('created_at', { ascending: false });

        if (applicationsError) throw applicationsError;

        if (!active) return;

        const mappedMissionRow = missionData as unknown as MissionRow;
        setMission({
          id: mappedMissionRow.id,
          title: mappedMissionRow.title,
          status: normalizeMissionStatus(mappedMissionRow.status),
          deadline: mappedMissionRow.deadline,
          budget_min: mappedMissionRow.budget_min,
          budget_max: mappedMissionRow.budget_max,
        });

        const mappedApplications = (applicationData as unknown as ApplicationRow[] | null ?? []).map((application) => ({
          id: application.id,
          status: normalizeApplicationStatus(application.status),
          cover_letter: application.cover_letter,
          proposed_rate: application.proposed_rate,
          created_at: application.created_at,
          pro_id: application.pro_id,
          profiles: application.profiles,
        }));
        setApplications(mappedApplications);
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Erreur de chargement');
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchData();

    return () => {
      active = false;
    };
  }, [targetMissionId]);

  const handleAccept = async (application: Application) => {
    if (!targetMissionId || !session?.user?.id) return;

    setActionLoading(application.id);
    setError(null);

    try {
      const { error: selectError } = await supabase
        .from('applications')
        .update({ status: 'selected' })
        .eq('id', application.id);
      if (selectError) throw selectError;

      const { error: rejectError } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('mission_id', targetMissionId)
        .eq('status', 'pending')
        .neq('id', application.id);
      if (rejectError) throw rejectError;

      const bookingResult = await supabase
        .from('booking_sessions' as never)
        .insert({
          mission_id: targetMissionId,
          studio_id: session.user.id,
          pro_id: application.pro_id,
          status: 'confirmed',
          created_at: new Date().toISOString(),
        } as never);
      if (bookingResult.error) {
        await supabase
          .from('sessions' as never)
          .insert({
            mission_id: targetMissionId,
            studio_id: session.user.id,
            pro_id: application.pro_id,
            application_id: application.id,
            date: new Date().toISOString().slice(0, 10),
            time_start: '10:00',
            duration_hours: 2,
            status: 'confirmed',
            created_at: new Date().toISOString(),
          } as never);
      }

      const missionUpdate = await supabase
        .from('missions')
        .update({ status: 'filled' })
        .eq('id', targetMissionId);
      if (missionUpdate.error) {
        const fallbackMissionUpdate = await supabase
          .from('missions')
          .update({ status: 'in_progress' as never })
          .eq('id', targetMissionId);
        if (fallbackMissionUpdate.error) {
          const lastFallbackMissionUpdate = await supabase
            .from('missions')
            .update({ status: 'closed' as never })
            .eq('id', targetMissionId);
          if (lastFallbackMissionUpdate.error) {
            throw lastFallbackMissionUpdate.error;
          }
        }
      }

      setApplications((prev) =>
        prev.map((item) =>
          item.id === application.id
            ? { ...item, status: 'accepted' }
            : item.status === 'pending'
              ? { ...item, status: 'rejected' }
              : item,
        ),
      );
      setMission((prev) => (prev ? { ...prev, status: 'closed' } : prev));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Impossible d'accepter la candidature");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    setActionLoading(applicationId);
    setError(null);

    try {
      await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId);

      setApplications((prev) =>
        prev.map((item) => (item.id === applicationId ? { ...item, status: 'rejected' } : item)),
      );
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Impossible de rejeter la candidature');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <div className="app-container flex min-h-screen items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-container">
        <button
          type="button"
          onClick={() => navigate('/studio/dashboard')}
          className="mb-4 text-sm app-muted transition-colors hover:text-black"
        >
          ← Mes missions
        </button>

        <header className="mb-6">
          <div className="mb-2 flex items-center gap-3">
            <h1 className="app-title text-2xl">{mission?.title ?? 'Candidatures'}</h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${missionStatusClass(mission?.status ?? 'open')}`}>
              {(mission?.status ?? 'open') === 'closed' ? 'Clôturée' : 'Ouverte'}
            </span>
          </div>
          <p className="app-subtitle mt-0">
            {applications.length} candidature(s) · {applications.filter((item) => item.status === 'pending').length} en attente
          </p>
        </header>

        {error ? <p className="text-red-400 text-center">{error}</p> : null}

        {!error && applications.length === 0 ? (
          <p className="app-empty-state">Aucune candidature reçue pour l&apos;instant.</p>
        ) : null}

        <div className="app-list">
          {applications.map((application) => {
            const displayName =
              application.profiles?.full_name ??
              application.profiles?.username ??
              'Anonyme';
            const pendingAndOpen = application.status === 'pending' && mission?.status !== 'closed';
            const isCurrentAction = actionLoading === application.id;

            return (
              <div key={application.id} className="app-card-soft p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{displayName}</p>
                    {application.pro_id ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/pro/public/${application.pro_id}`)}
                        className="text-orange-600 text-xs hover:underline mt-0.5 block"
                      >
                        Voir le profil complet →
                      </button>
                    ) : null}
                    {application.profiles?.city ? (
                      <p className="text-sm app-muted">{application.profiles.city}</p>
                    ) : null}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${applicationStatusClass(application.status)}`}>
                    {application.status === 'pending'
                      ? 'En attente'
                      : application.status === 'accepted'
                        ? 'Acceptée'
                        : 'Refusée'}
                  </span>
                </div>

                {application.profiles?.skills?.length ? (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {application.profiles.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="app-chip"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}

                {application.cover_letter ? (
                  <p className="text-sm text-stone-600 mt-2">{application.cover_letter}</p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <p className="text-stone-700">
                    Tarif proposé : {application.proposed_rate ? `${application.proposed_rate}€/j` : 'Non renseigné'}
                  </p>
                  <p className="app-muted">
                    {new Date(application.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {pendingAndOpen ? (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleAccept(application)}
                      disabled={Boolean(actionLoading)}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-green-600 px-4 text-sm font-medium text-white transition hover:bg-green-500 disabled:opacity-60"
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
                      type="button"
                      onClick={() => void handleReject(application.id)}
                      disabled={Boolean(actionLoading)}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-red-300 bg-white px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      Rejeter ✗
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
