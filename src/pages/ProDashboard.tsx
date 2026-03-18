import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { Button } from '@/components/ui/Button';

type MissionRef = {
  id: string
  title: string
  status: string
  category: string
  mission_type: string
  budget_min: number | null
  budget_max: number | null
  profiles: { company_name: string | null } | null
}

type Application = {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  cover_letter: string | null
  proposed_rate: number | null
  created_at: string
  mission_id: string
  missions: MissionRef | null
}

type BookingMissionRef = {
  title: string
  profiles: { company_name: string | null } | null
}

type Booking = {
  id: string
  status: string
  created_at: string
  mission_id: string
  missions: BookingMissionRef | null
}

type ApplicationRow = {
  id: string
  status: string | null
  cover_letter: string | null
  proposed_rate: number | null
  created_at: string
  mission_id: string
  missions: MissionRef | MissionRef[] | null
}

type BookingRow = {
  id: string
  status: string | null
  created_at: string
  mission_id: string
  missions: BookingMissionRef | BookingMissionRef[] | null
}

function normalizeApplicationStatus(status: string | null): Application['status'] {
  if (status === 'accepted' || status === 'selected') return 'accepted';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

function statusClass(status: Application['status']): string {
  if (status === 'accepted') return 'bg-green-100 text-green-700';
  if (status === 'rejected') return 'bg-red-100 text-red-700';
  return 'bg-yellow-100 text-yellow-700';
}

function bookingStatusClass(status: string): string {
  return status === 'confirmed'
    ? 'bg-green-100 text-green-700'
    : 'bg-stone-100 text-stone-600';
}

function budgetText(mission: MissionRef | null): string {
  if (!mission) return 'Budget non renseigné';
  if (mission.budget_min !== null && mission.budget_max !== null) {
    return `${mission.budget_min}€ – ${mission.budget_max}€/j`;
  }
  if (mission.budget_min !== null) {
    return `À partir de ${mission.budget_min}€/j`;
  }
  return 'Budget non renseigné';
}

export default function ProDashboard() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'applications' | 'bookings'>('applications');

  useEffect(() => {
    let active = true;

    const fetchDashboard = async () => {
      const userId = session?.user?.id;
      if (!userId) {
        if (!active) return;
        setApplications([]);
        setBookings([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const applicationsColumns: string = `
          id,
          status,
          cover_letter,
          proposed_rate,
          created_at,
          mission_id,
          missions:mission_id (
            id,
            title,
            status,
            category,
            mission_type,
            budget_min,
            budget_max,
            profiles:studio_id (
              company_name
            )
          )
        `;
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('applications')
          .select(applicationsColumns)
          .eq('pro_id', userId)
          .order('created_at', { ascending: false });

        if (applicationsError) throw applicationsError;

        const bookingsColumns: string = `
          id,
          status,
          created_at,
          mission_id,
          missions:mission_id (
            title,
            profiles:studio_id (
              company_name
            )
          )
        `;
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('booking_sessions' as never)
          .select(bookingsColumns)
          .eq('pro_id', userId)
          .order('created_at', { ascending: false });

        if (bookingsError) throw bookingsError;

        if (!active) return;

        const mappedApplications: Application[] = (applicationsData as unknown as ApplicationRow[] | null ?? []).map((application) => {
          const missionRef = Array.isArray(application.missions)
            ? application.missions[0] ?? null
            : application.missions;

          return {
            id: application.id,
            status: normalizeApplicationStatus(application.status),
            cover_letter: application.cover_letter,
            proposed_rate: application.proposed_rate,
            created_at: application.created_at,
            mission_id: application.mission_id,
            missions: missionRef,
          };
        });

        const mappedBookings: Booking[] = (bookingsData as unknown as BookingRow[] | null ?? []).map((booking) => {
          const missionRef = Array.isArray(booking.missions)
            ? booking.missions[0] ?? null
            : booking.missions;
          return {
            id: booking.id,
            status: booking.status ?? 'unknown',
            created_at: booking.created_at,
            mission_id: booking.mission_id,
            missions: missionRef,
          };
        });

        setApplications(mappedApplications);
        setBookings(mappedBookings);
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Impossible de charger le dashboard');
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchDashboard();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const stats = useMemo(
    () => ({
      totalApplications: applications.length,
      pendingApplications: applications.filter((item) => item.status === 'pending').length,
      acceptedApplications: applications.filter((item) => item.status === 'accepted').length,
      bookingsCount: bookings.length,
    }),
    [applications, bookings.length],
  );

  const profileIdentity = profile as
    | {
      full_name?: string | null
      username?: string | null
      display_name?: string | null
    }
    | null;
  const greetingName =
    profileIdentity?.full_name ??
    profileIdentity?.username ??
    profileIdentity?.display_name ??
    'Pro';

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
        <header className="mb-5">
          <h1 className="text-3xl font-semibold tracking-tight">Bonjour, {greetingName} 👋</h1>
          <p className="text-sm app-muted">{applications.length} candidature(s) envoyée(s)</p>
        </header>

        {error ? <p className="text-red-400 text-center mb-4">{error}</p> : null}

        <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="app-card-soft p-4">
            <p className="text-2xl font-bold">{stats.totalApplications}</p>
            <p className="text-sm app-muted">Candidatures envoyées</p>
          </div>
          <div className="app-card-soft p-4">
            <p className="text-2xl font-bold">{stats.pendingApplications}</p>
            <p className="text-sm app-muted">En attente</p>
          </div>
          <div className="app-card-soft p-4">
            <p className="text-2xl font-bold">{stats.acceptedApplications}</p>
            <p className="text-sm app-muted">Acceptées</p>
          </div>
          <div className="app-card-soft p-4">
            <p className="text-2xl font-bold">{stats.bookingsCount}</p>
            <p className="text-sm app-muted">Missions bookées</p>
          </div>
        </section>

        <div className="mb-5">
          <Button
            onClick={() => navigate('/pro/feed')}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            Voir les missions disponibles →
          </Button>
        </div>

        <div className="mb-4 flex gap-5 border-b border-black/10">
          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            className={`pb-2 text-sm transition-colors ${
              activeTab === 'applications'
                ? 'border-b-2 border-orange-500 text-black'
                : 'text-black/45'
            }`}
          >
            Mes candidatures
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`pb-2 text-sm transition-colors ${
              activeTab === 'bookings'
                ? 'border-b-2 border-orange-500 text-black'
                : 'text-black/45'
            }`}
          >
            Mes bookings
          </button>
        </div>

        {activeTab === 'applications' ? (
          applications.length === 0 ? (
            <div className="text-center app-muted py-8">
              Tu n&apos;as encore postulé à aucune mission.
              <br />
              <button
                onClick={() => navigate('/pro/feed')}
                className="text-orange-600 underline mt-2"
              >
                Découvrir les missions
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((application) => (
                <article key={application.id} className="app-card-soft p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{application.missions?.title ?? 'Mission supprimée'}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(application.status)}`}>
                      {application.status === 'pending'
                        ? 'En attente'
                        : application.status === 'accepted'
                          ? 'Acceptée'
                          : 'Refusée'}
                    </span>
                  </div>

                  <p className="text-sm app-muted">
                    {application.missions?.profiles?.company_name ?? 'Studio inconnu'}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/50 bg-white/80 px-2.5 py-1 text-xs text-black/75">
                      {application.missions?.category ?? 'Catégorie inconnue'}
                    </span>
                    <span className="rounded-full border border-white/50 bg-white/80 px-2.5 py-1 text-xs text-black/75">
                      {application.missions?.mission_type ?? 'Type inconnu'}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-orange-700">{budgetText(application.missions)}</p>
                  {application.proposed_rate ? (
                  <p className="mt-1 text-sm text-stone-600">Tarif proposé : {application.proposed_rate}€/j</p>
                  ) : null}
                  <p className="mt-1 text-xs app-muted">
                    Candidature du {new Date(application.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </article>
              ))}
            </div>
          )
        ) : bookings.length === 0 ? (
          <p className="text-center app-muted py-8">Aucun booking confirmé pour l&apos;instant.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <article key={booking.id} className="app-card-soft p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-semibold">{booking.missions?.title ?? 'Mission'}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${bookingStatusClass(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                <p className="text-sm app-muted">{booking.missions?.profiles?.company_name ?? 'Studio'}</p>
                <p className="mt-1 text-xs app-muted">
                  Booking du {new Date(booking.created_at).toLocaleDateString('fr-FR')}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
