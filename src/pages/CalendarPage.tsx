import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Clock, Folder, MapPin, MessageCircle, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase/auth';
import { useMissions } from '@/hooks/useMissions';
import { useMyApplications } from '@/hooks/useApplications';
import { useProProfile } from '@/hooks/useProfile';
import { missionService } from '@/services/missionService';
import { applicationService } from '@/services/applicationService';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ReviewModal } from '@/components/ReviewModal';
import { cn } from '@/lib/utils';
import type { MissionRecord, MissionStatus, AvailabilitySlot } from '@/types/backend';

interface CalendarSession {
  id: string;
  missionId: string;
  serviceType: string;
  artistName: string;
  location: string;
  date: Date;
  timeStart: string;
  timeEnd: string;
  durationHours: number;
  status: MissionStatus;
  revieweeId?: string;
}

function getServiceColor(type: string) {
  switch (type.toLowerCase()) {
    case 'mixage':
      return 'bg-blue-500 text-white';
    case 'enregistrement':
    case 'enregistrement voix':
      return 'bg-orange-500 text-white';
    case 'mastering':
      return 'bg-amber-500 text-white';
    case 'beatmaking':
      return 'bg-emerald-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

function getServiceLightColor(type: string) {
  switch (type.toLowerCase()) {
    case 'mixage':
      return 'bg-blue-500/20 text-blue-700';
    case 'enregistrement':
    case 'enregistrement voix':
      return 'bg-orange-500/20 text-orange-700';
    case 'mastering':
      return 'bg-amber-500/20 text-amber-700';
    case 'beatmaking':
      return 'bg-emerald-500/20 text-emerald-700';
    default:
      return 'bg-gray-500/20 text-gray-700';
  }
}

function getServiceDotColor(type: string) {
  switch (type.toLowerCase()) {
    case 'mixage':
      return 'bg-blue-500';
    case 'enregistrement':
    case 'enregistrement voix':
      return 'bg-orange-500';
    case 'mastering':
      return 'bg-amber-500';
    case 'beatmaking':
      return 'bg-emerald-500';
    default:
      return 'bg-gray-500';
  }
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function deriveDurationHours(duration: string | null): number {
  if (!duration) return 2;
  const normalized = duration.toLowerCase();
  if (normalized.includes('demi')) return 4;
  if (normalized.includes('journ')) return 8;
  const numberMatch = normalized.match(/(\d+)/);
  if (numberMatch) return Math.min(Math.max(Number(numberMatch[1]), 1), 8);
  return 2;
}

function deriveSlotDurationHours(slot: AvailabilitySlot) {
  const [startHour, startMinute] = slot.start.split(':').map(Number);
  const [endHour, endMinute] = slot.end.split(':').map(Number);
  const totalStart = (startHour * 60) + startMinute;
  const totalEnd = (endHour * 60) + endMinute;
  const diff = Math.max(60, totalEnd - totalStart);
  return Math.min(8, Math.max(1, Math.round(diff / 60)));
}

function normalizeMissionDate(mission: MissionRecord): Date {
  return new Date(mission.expires_at ?? mission.created_at);
}

function getWeekDays(date: Date) {
  const base = new Date(date);
  const day = base.getDay();
  const diff = base.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(base.setDate(diff));
  const days: Date[] = [];
  for (let i = 0; i < 7; i += 1) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    days.push(next);
  }
  return days;
}

function getMonthDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const days: Array<Date | null> = [];
  for (let i = 0; i < offset; i += 1) days.push(null);
  for (let i = 1; i <= daysInMonth; i += 1) days.push(new Date(year, month, i));
  return days;
}

function getDayLabel(date: Date): AvailabilitySlot['day'] {
  const labels: AvailabilitySlot['day'][] = [
    'dimanche',
    'lundi',
    'mardi',
    'mercredi',
    'jeudi',
    'vendredi',
    'samedi',
  ];
  return labels[date.getDay()];
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const profileType = profile?.user_type ?? (profile as { type?: 'studio' | 'pro' } | null)?.type ?? 'pro';
  const userType = profileType;
  const userId = profile?.id;

  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<CalendarSession | null>(null);
  const [selectedDaySessions, setSelectedDaySessions] = useState<CalendarSession[]>([]);
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ missionId: string; reviewedId: string; reviewedName: string } | null>(null);

  const {
    data: studioMissions = [],
    isLoading: studioMissionsLoading,
    isError: studioMissionsError,
    error: studioMissionsErrorData,
  } = useMissions(userType === 'studio' ? userId : undefined);
  const {
    data: myApplications = [],
    isLoading: myApplicationsLoading,
    isError: myApplicationsError,
    error: myApplicationsErrorData,
  } = useMyApplications(userType === 'pro' ? userId : undefined);
  const {
    data: proProfile,
    isLoading: proProfileLoading,
    isError: proProfileError,
    error: proProfileErrorData,
  } = useProProfile(userType === 'pro' ? userId : undefined);

  const selectedMissionIds = useMemo(() => {
    if (userType !== 'pro') return [];
    return myApplications
      .filter((application) => application.status === 'accepted')
      .map((application) => application.mission_id);
  }, [myApplications, userType]);

  const {
    data: proMissions = [],
    isLoading: proMissionsLoading,
    isError: proMissionsError,
    error: proMissionsErrorData,
  } = useQuery({
    queryKey: ['calendar', 'pro-missions', selectedMissionIds.join(',')],
    queryFn: async () => {
      if (selectedMissionIds.length === 0) return [] as MissionRecord[];
      const rows = await Promise.all(selectedMissionIds.map((missionId) => missionService.getMissionById(missionId)));
      return rows;
    },
    enabled: userType === 'pro' && selectedMissionIds.length > 0,
  });

  const studioMissionIds = useMemo(
    () => studioMissions.map((mission) => mission.id),
    [studioMissions],
  );

  const {
    data: selectedByMission = {},
    isLoading: selectedByMissionLoading,
    isError: selectedByMissionError,
    error: selectedByMissionErrorData,
  } = useQuery({
    queryKey: ['calendar', 'selected-pro-by-mission', studioMissionIds.join(',')],
    queryFn: async () => {
      const map: Record<string, string> = {};
      await Promise.all(
        studioMissionIds.map(async (missionId) => {
          const applications = await applicationService.getMissionApplications(missionId);
          const selected = applications.find((application) => application.status === 'accepted');
          if (selected) map[missionId] = selected.pro_id;
        }),
      );
      return map;
    },
    enabled: userType === 'studio' && studioMissionIds.length > 0,
  });

  const missionSessions = useMemo(() => {
    const source = userType === 'studio' ? studioMissions : proMissions;
    return source
      .filter((mission) => mission.status === 'in_progress' || mission.status === 'completed')
      .map((mission): CalendarSession => {
        const date = normalizeMissionDate(mission);
        const durationHours = deriveDurationHours(mission.duration);
        const startHour = Math.min(20, Math.max(8, date.getHours() || 10));
        const endHour = Math.min(22, startHour + durationHours);
        const timeStart = `${String(startHour).padStart(2, '0')}:00`;
        const timeEnd = `${String(endHour).padStart(2, '0')}:00`;
        const revieweeId = userType === 'studio'
          ? selectedByMission[mission.id]
          : mission.studio_id;

        return {
          id: `mission-${mission.id}`,
          missionId: mission.id,
          serviceType: mission.service_type,
          artistName: mission.artist_name || 'Confidentiel',
          location: mission.location || 'Paris',
          date,
          timeStart,
          timeEnd,
          durationHours,
          status: mission.status,
          revieweeId,
        };
      });
  }, [proMissions, selectedByMission, studioMissions, userType]);

  const availabilitySessions = useMemo(() => {
    if (userType !== 'pro') return [] as CalendarSession[];
    const slots = proProfile?.availability_slots ?? [];
    return slots.map((slot, index): CalendarSession => ({
      id: `slot-${index}-${slot.day}-${slot.start}`,
      missionId: '',
      serviceType: 'Disponibilité',
      artistName: 'Créneau disponible',
      location: 'Paris',
      date: new Date(),
      timeStart: slot.start,
      timeEnd: slot.end,
      durationHours: deriveSlotDurationHours(slot),
      status: 'published',
    }));
  }, [proProfile?.availability_slots, userType]);

  const allSessions = useMemo(() => [...missionSessions], [missionSessions]);
  const hours = Array.from({ length: 15 }, (_, i) => i + 8);
  const weekDays = getWeekDays(new Date(currentDate));
  const monthDays = getMonthDays(currentDate);
  const loadingCalendar = userType === 'studio'
    ? studioMissionsLoading || selectedByMissionLoading
    : myApplicationsLoading || proProfileLoading || proMissionsLoading;

  const calendarError = userType === 'studio'
    ? (studioMissionsError ? studioMissionsErrorData : selectedByMissionError ? selectedByMissionErrorData : null)
    : (
      myApplicationsError
        ? myApplicationsErrorData
        : proProfileError
          ? proProfileErrorData
          : proMissionsError
            ? proMissionsErrorData
            : null
    );

  if (loadingCalendar) {
    return (
      <div className="app-shell flex items-center justify-center pb-20">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
      </div>
    );
  }

  if (calendarError) {
    return (
      <div className="app-shell pb-20 px-4 pt-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-4 text-red-600 text-sm">
          {calendarError instanceof Error ? calendarError.message : 'Impossible de charger le calendrier.'}
        </div>
      </div>
    );
  }

  const getSessionsForDate = (date: Date) => {
    const fromMissions = allSessions.filter((session) =>
      session.date.getDate() === date.getDate()
      && session.date.getMonth() === date.getMonth()
      && session.date.getFullYear() === date.getFullYear(),
    );

    if (userType !== 'pro') return fromMissions;

    const dayLabel = getDayLabel(date);
    const slots = availabilitySessions
      .filter((slot) => {
        const parts = slot.id.split('-');
        return parts[2] === dayLabel;
      })
      .map((slot, index) => ({
        ...slot,
        id: `${slot.id}-${date.toISOString()}-${index}`,
        date,
      }));
    return [...fromMissions, ...slots];
  };

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (view === 'week') next.setDate(next.getDate() - 7);
    else next.setMonth(next.getMonth() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (view === 'week') next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const handleDayClick = (date: Date) => {
    const sessions = getSessionsForDate(date);
    if (sessions.length === 0) return;
    setSelectedDaySessions(sessions);
    setIsDaySheetOpen(true);
  };

  const SessionCard = ({ session }: { session: CalendarSession }) => (
    <div className="rounded-2xl border border-white/50 bg-white/60 p-5 backdrop-blur-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <Badge className={cn('w-fit', getServiceLightColor(session.serviceType))}>
            {session.serviceType}
          </Badge>
          <h3 className="mt-2 text-xl font-semibold">{session.artistName}</h3>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5">
            <Clock size={16} className="text-black/60" />
          </div>
          <span className="font-medium">
            {session.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' · '}
            {session.timeStart} → {session.timeEnd}
          </span>
        </div>
        <div className="flex items-start gap-3 text-sm">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/5">
            <MapPin size={16} className="text-black/60" />
          </div>
          <div>
            <span className="font-medium">{session.location}</span>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(session.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-left text-xs font-medium text-orange-600 hover:underline"
            >
              Ouvrir dans Maps
            </a>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Button variant="primary" className="flex-1 gap-2" onClick={() => navigate('/chat')}>
            <MessageCircle size={16} />
            Accéder au chat
          </Button>
          <Button variant="secondary" className="flex-1 gap-2" onClick={() => navigate('/chat?tab=files')}>
            <Folder size={16} />
            Voir les fichiers
          </Button>
        </div>
        {session.status === 'completed' && session.revieweeId ? (
          <Button
            variant="ghost"
            className="w-full gap-2 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
            onClick={() => setReviewTarget({ missionId: session.missionId, reviewedId: session.revieweeId!, reviewedName: 'Ce contact' })}
          >
            <Star size={16} />
            Évaluer la session ⭐
          </Button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="app-shell pb-20 pt-safe">
      <Helmet>
        <title>Calendrier — StudioLink</title>
        <meta name="description" content="Votre planning de sessions et missions sur StudioLink." />
      </Helmet>
      <header className="sticky top-0 z-30 flex flex-col gap-6 bg-[#f4ece4]/90 px-4 py-6 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Calendrier</h1>
          <div className="flex items-center rounded-full border border-white/50 bg-white/40 p-1">
            <button
              type="button"
              onClick={() => setView('week')}
              className={cn(
                'flex min-h-[44px] items-center rounded-full px-4 text-xs font-medium transition-all',
                view === 'week' ? 'bg-white text-black shadow-sm' : 'text-black/60 hover:text-black',
              )}
            >
              Semaine
            </button>
            <button
              type="button"
              onClick={() => setView('month')}
              className={cn(
                'flex min-h-[44px] items-center rounded-full px-4 text-xs font-medium transition-all',
                view === 'month' ? 'bg-white text-black shadow-sm' : 'text-black/60 hover:text-black',
              )}
            >
              Mois
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors hover:bg-black/5"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-lg font-medium capitalize">{formatMonthYear(currentDate)}</span>
          <button
            type="button"
            onClick={handleNext}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors hover:bg-black/5"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden">
        {allSessions.length === 0 && availabilitySessions.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="text-4xl">📅</span>
            <p className="text-sm leading-relaxed text-stone-500">
              Aucune disponibilité définie pour cette période.
            </p>
            <button
              type="button"
              onClick={() => navigate(profileType === 'studio' ? '/studio/dashboard' : '/pro/feed')}
              className="min-h-[44px] rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Trouver des missions
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {view === 'week' ? (
              <motion.div
                key="week"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-auto"
              >
                <div className="w-full px-4 pb-24">
                  <div className="mb-4 grid grid-cols-8 gap-2">
                    <div className="col-span-1" />
                    {weekDays.map((date, i) => {
                      const isToday = date.toDateString() === new Date().toDateString();
                      return (
                        <div key={i} className="col-span-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-medium uppercase text-black/50">
                            {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                          </span>
                          <span
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                              isToday ? 'bg-orange-500 text-white' : 'text-black',
                            )}
                          >
                            {date.getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="relative grid grid-cols-8 gap-2">
                    <div className="col-span-1 flex flex-col">
                      {hours.map((hour) => (
                        <div key={hour} className="-mt-2 h-16 pr-4 text-right text-xs font-medium text-black/40">
                          {hour}:00
                        </div>
                      ))}
                    </div>

                    {weekDays.map((date, dayIdx) => {
                      const daySessions = getSessionsForDate(date);
                      const isToday = date.toDateString() === new Date().toDateString();
                      return (
                        <div
                          key={dayIdx}
                          className={cn('relative col-span-1 border-l border-black/5', isToday && 'rounded-lg bg-orange-500/5')}
                        >
                          {hours.map((hour) => (
                            <div key={hour} className="h-16 border-t border-black/5" />
                          ))}
                          {daySessions.map((session) => {
                            const [hourPart, minutePart] = session.timeStart.split(':').map(Number);
                            const topOffset = ((hourPart - 8) * 64) + ((minutePart / 60) * 64);
                            const height = Math.max(48, session.durationHours * 64);
                            return (
                              <button
                                key={session.id}
                                type="button"
                                aria-label={`Ouvrir la session de ${session.artistName}`}
                                onClick={() => setSelectedSession(session)}
                                className={cn(
                                  'absolute left-1 right-1 overflow-hidden rounded-lg p-2 text-left shadow-sm transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300',
                                  getServiceColor(session.serviceType),
                                )}
                                style={{ top: `${topOffset}px`, height: `${height}px` }}
                              >
                                <div className="truncate text-xs font-bold">{session.artistName}</div>
                                <div className="truncate text-[10px] opacity-90 capitalize">{session.serviceType}</div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="month"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 px-4 pb-24"
              >
                <div className="rounded-3xl border border-white/50 bg-white/40 p-4 backdrop-blur-md">
                  <div className="mb-4 grid grid-cols-7">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                      <div key={day} className="text-center text-xs font-medium uppercase text-black/50">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-y-4">
                    {monthDays.map((date, index) => {
                      if (!date) return <div key={`empty-${index}`} className="h-12" />;
                      const isToday = date.toDateString() === new Date().toDateString();
                      const daySessions = getSessionsForDate(date);
                      return (
                        <button
                          key={index}
                          type="button"
                          aria-label={`Ouvrir les sessions du ${date.toLocaleDateString('fr-FR')}`}
                          onClick={() => handleDayClick(date)}
                          className="flex h-12 flex-col items-center gap-1"
                        >
                          <span
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                              isToday ? 'bg-orange-500 text-white' : 'hover:bg-black/5',
                              daySessions.length > 0 && !isToday && 'font-bold',
                            )}
                          >
                            {date.getDate()}
                          </span>
                          <div className="flex gap-0.5">
                            {daySessions.slice(0, 3).map((session, dotIndex) => (
                              <div key={`${session.id}-${dotIndex}`} className={cn('h-1.5 w-1.5 rounded-full', getServiceDotColor(session.serviceType))} />
                            ))}
                            {daySessions.length > 3 ? <div className="h-1.5 w-1.5 rounded-full bg-black/30" /> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <BottomSheet isOpen={Boolean(selectedSession)} onClose={() => setSelectedSession(null)}>
        {selectedSession ? (
          <div className="p-4 pb-8">
            <SessionCard session={selectedSession} />
          </div>
        ) : null}
      </BottomSheet>

      <BottomSheet isOpen={isDaySheetOpen} onClose={() => setIsDaySheetOpen(false)}>
        <div className="flex flex-col gap-4 p-4 pb-8">
          {selectedDaySessions.length > 0 ? (
            <h2 className="px-2 text-xl font-semibold">
              {selectedDaySessions[0].date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
          ) : null}
          <div className="flex flex-col gap-4">
            {selectedDaySessions.map((session) => (
              <div key={session.id}>
                <SessionCard session={session} />
              </div>
            ))}
          </div>
        </div>
      </BottomSheet>

      {reviewTarget ? (
        <ReviewModal
          isOpen={Boolean(reviewTarget)}
          missionId={reviewTarget.missionId}
          reviewedId={reviewTarget.reviewedId}
          reviewedName={reviewTarget.reviewedName}
          onClose={() => setReviewTarget(null)}
        />
      ) : null}
    </div>
  );
}
