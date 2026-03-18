import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, MapPin, Clock, User, MessageCircle, Folder, Star } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { mockSessions, Session } from '@/data/mockSessions';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RatingModal } from '@/components/shared/RatingModal';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
  const { userType } = useAppStore();
  const navigate = useNavigate();
  
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 20)); // March 20, 2026 as base
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedDaySessions, setSelectedDaySessions] = useState<Session[]>([]);
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [sessionToRate, setSessionToRate] = useState<Session | null>(null);

  // Filter sessions for the current user
  const mySessions = mockSessions.filter(s => 
    userType === 'studio' ? s.studioId === 'studio-1' : s.proId === 'pro-1'
  );

  const getServiceColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mixage': return 'bg-blue-500 text-white';
      case 'enregistrement': return 'bg-orange-500 text-white';
      case 'mastering': return 'bg-purple-500 text-white';
      case 'beatmaking': return 'bg-emerald-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getServiceLightColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mixage': return 'bg-blue-500/20 text-blue-700';
      case 'enregistrement': return 'bg-orange-500/20 text-orange-700';
      case 'mastering': return 'bg-purple-500/20 text-purple-700';
      case 'beatmaking': return 'bg-emerald-500/20 text-emerald-700';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  const getServiceDotColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mixage': return 'bg-blue-500';
      case 'enregistrement': return 'bg-orange-500';
      case 'mastering': return 'bg-purple-500';
      case 'beatmaking': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  // Week View Logic
  const getWeekDays = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(date.setDate(diff));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays(new Date(currentDate));
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8h to 22h

  // Month View Logic
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday as first day
    
    const days = [];
    for (let i = 0; i < offset; i++) {
      days.push(null); // Empty slots before 1st
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const monthDays = getMonthDays(currentDate);

  const getSessionsForDate = (date: Date) => {
    return mySessions.filter(s => 
      s.date.getDate() === date.getDate() &&
      s.date.getMonth() === date.getMonth() &&
      s.date.getFullYear() === date.getFullYear()
    );
  };

  const handleDayClick = (date: Date) => {
    const sessions = getSessionsForDate(date);
    if (sessions.length > 0) {
      setSelectedDaySessions(sessions);
      setIsDaySheetOpen(true);
    }
  };

  const SessionCard = ({ session }: { session: Session }) => {
    const interlocutorName = userType === 'studio' ? session.proName : session.studioName;
    const interlocutorAvatar = userType === 'studio' ? session.proAvatar : session.studioAvatar;

    return (
      <div className="bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <Badge className={cn("w-fit", getServiceLightColor(session.serviceType))}>
              {session.serviceType}
            </Badge>
            <h3 className="text-xl font-semibold mt-1">{session.artistName}</h3>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center shrink-0">
              <Clock size={16} className="text-black/60" />
            </div>
            <span className="font-medium">
              {session.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {session.timeStart} → {session.timeEnd}
            </span>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={16} className="text-black/60" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{session.studioAddress}</span>
              <button 
                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(session.studioAddress)}`, '_blank')}
                className="text-xs text-orange-600 font-medium mt-1 text-left hover:underline"
              >
                Ouvrir dans Maps
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <img src={interlocutorAvatar} alt={interlocutorName} className="w-8 h-8 rounded-full object-cover border border-black/10" />
            <span className="font-medium">{interlocutorName}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="primary" 
              className="flex-1 gap-2"
              onClick={() => navigate(`/chat/${session.chatSessionId}`)}
            >
              <MessageCircle size={16} />
              Accéder au chat
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 gap-2"
              onClick={() => navigate(`/chat/${session.chatSessionId}?tab=files`)}
            >
              <Folder size={16} />
              Voir les fichiers
            </Button>
          </div>
          
          {session.status === 'completed' && (
            <Button 
              variant="ghost" 
              className="w-full gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              onClick={() => {
                setSessionToRate(session);
                setIsRatingModalOpen(true);
              }}
            >
              <Star size={16} />
              Évaluer la session
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4ece4] flex flex-col pt-safe">
      {/* Header */}
      <header className="px-4 py-6 flex flex-col gap-6 sticky top-0 bg-[#f4ece4]/90 backdrop-blur-md z-30">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-light tracking-tight">Calendrier</h1>
          
          <div className="flex items-center p-1 bg-white/40 rounded-full border border-white/50">
            <button 
              onClick={() => setView('week')}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                view === 'week' ? "bg-white shadow-sm text-black" : "text-black/60 hover:text-black"
              )}
            >
              Semaine
            </button>
            <button 
              onClick={() => setView('month')}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                view === 'month' ? "bg-white shadow-sm text-black" : "text-black/60 hover:text-black"
              )}
            >
              Mois
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button onClick={handlePrev} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <span className="text-lg font-medium capitalize">{formatMonthYear(currentDate)}</span>
          <button onClick={handleNext} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <ChevronRight size={24} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
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
              <div className="min-w-[700px] px-4 pb-24">
                {/* Week Header */}
                <div className="grid grid-cols-8 gap-2 mb-4">
                  <div className="col-span-1" /> {/* Time column spacer */}
                  {weekDays.map((date, i) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <div key={i} className="col-span-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-black/50 uppercase">
                          {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </span>
                        <span className={cn(
                          "w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium",
                          isToday ? "bg-orange-500 text-white" : "text-black"
                        )}>
                          {date.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Grid */}
                <div className="relative grid grid-cols-8 gap-2">
                  {/* Time Column */}
                  <div className="col-span-1 flex flex-col">
                    {hours.map(hour => (
                      <div key={hour} className="h-16 text-xs text-black/40 font-medium text-right pr-4 -mt-2">
                        {hour}:00
                      </div>
                    ))}
                  </div>

                  {/* Days Columns */}
                  {weekDays.map((date, dayIdx) => {
                    const daySessions = getSessionsForDate(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                      <div key={dayIdx} className={cn(
                        "col-span-1 relative border-l border-black/5",
                        isToday && "bg-orange-500/5 rounded-lg"
                      )}>
                        {/* Horizontal Grid Lines */}
                        {hours.map(hour => (
                          <div key={hour} className="h-16 border-t border-black/5" />
                        ))}

                        {/* Sessions */}
                        {daySessions.map(session => {
                          const startHour = parseInt(session.timeStart.split(':')[0]);
                          const startMin = parseInt(session.timeStart.split(':')[1] || '0');
                          
                          // Calculate position (8 is the start hour)
                          const topOffset = ((startHour - 8) * 64) + ((startMin / 60) * 64);
                          const height = session.durationHours * 64;

                          return (
                            <div 
                              key={session.id}
                              onClick={() => setSelectedSession(session)}
                              className={cn(
                                "absolute left-1 right-1 rounded-lg p-2 shadow-sm cursor-pointer overflow-hidden transition-transform hover:scale-[1.02]",
                                getServiceColor(session.serviceType)
                              )}
                              style={{ top: `${topOffset}px`, height: `${height}px` }}
                            >
                              <div className="text-xs font-bold truncate">{session.artistName}</div>
                              <div className="text-[10px] opacity-90 truncate capitalize">{session.serviceType}</div>
                            </div>
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
              <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-4">
                {/* Days Header */}
                <div className="grid grid-cols-7 mb-4">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-black/50 uppercase">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-y-4">
                  {monthDays.map((date, i) => {
                    if (!date) return <div key={`empty-${i}`} className="h-12" />;
                    
                    const isToday = date.toDateString() === new Date().toDateString();
                    const daySessions = getSessionsForDate(date);
                    
                    return (
                      <div 
                        key={i} 
                        onClick={() => handleDayClick(date)}
                        className="h-12 flex flex-col items-center gap-1 cursor-pointer"
                      >
                        <span className={cn(
                          "w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors",
                          isToday ? "bg-orange-500 text-white" : "hover:bg-black/5",
                          daySessions.length > 0 && !isToday && "font-bold"
                        )}>
                          {date.getDate()}
                        </span>
                        
                        {/* Session Dots */}
                        <div className="flex gap-0.5">
                          {daySessions.slice(0, 3).map((s, idx) => (
                            <div 
                              key={idx} 
                              className={cn("w-1.5 h-1.5 rounded-full", getServiceDotColor(s.serviceType))} 
                            />
                          ))}
                          {daySessions.length > 3 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-black/30" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Single Session Details (from Week View) */}
      <BottomSheet isOpen={!!selectedSession} onClose={() => setSelectedSession(null)}>
        {selectedSession && (
          <div className="p-4 pb-8">
            <SessionCard session={selectedSession} />
          </div>
        )}
      </BottomSheet>

      {/* Day Sessions List (from Month View) */}
      <BottomSheet isOpen={isDaySheetOpen} onClose={() => setIsDaySheetOpen(false)}>
        <div className="p-4 pb-8 flex flex-col gap-4">
          <h2 className="text-xl font-semibold px-2">
            {selectedDaySessions[0]?.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          <div className="flex flex-col gap-4">
            {selectedDaySessions.map(session => (
              <div key={session.id}>
                <SessionCard session={session} />
              </div>
            ))}
          </div>
        </div>
      </BottomSheet>

      {/* Rating Modal */}
      {sessionToRate && (
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={() => {
            setIsRatingModalOpen(false);
            setTimeout(() => setSessionToRate(null), 300);
          }}
          sessionData={{
            interlocutorName: userType === 'studio' ? sessionToRate.proName : sessionToRate.studioName,
            interlocutorAvatar: userType === 'studio' ? sessionToRate.proAvatar : sessionToRate.studioAvatar,
            serviceType: sessionToRate.serviceType,
            date: sessionToRate.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
          }}
        />
      )}
    </div>
  );
}
