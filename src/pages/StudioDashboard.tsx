import { motion } from "motion/react";
import { Plus, Clock, MapPin, User, ChevronRight, FileAudio, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SectionTitle, Text } from "@/components/ui/Typography";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

// --- MOCK DATA ---
const MOCK_MISSIONS = [
  {
    id: "m1",
    title: "Mixage EP 5 titres - Rap/Trap",
    type: "Ingénieur mixage",
    status: "En sélection",
    price: "1 500 €",
    expiresIn: "2h restantes",
    candidatesCount: 12,
  },
  {
    id: "m2",
    title: "Enregistrement Voix Lead",
    type: "Ingénieur son",
    status: "Publiée",
    price: "À négocier",
    expiresIn: "12h restantes",
    candidatesCount: 3,
  },
  {
    id: "m3",
    title: "Beatmaking Afrobeat",
    type: "Beatmaker",
    status: "Pourvue",
    price: "500 €",
    expiresIn: null,
    candidatesCount: 24,
  }
];

const MOCK_APPLICATIONS = [
  {
    id: "a1",
    proName: "Alexandre D.",
    role: "Ingénieur mixage",
    missionTitle: "Mixage EP 5 titres",
    date: "Il y a 1h",
    avatar: "https://picsum.photos/seed/alex/100/100",
  },
  {
    id: "a2",
    proName: "Sarah M.",
    role: "Ingénieur mixage",
    missionTitle: "Mixage EP 5 titres",
    date: "Il y a 3h",
    avatar: "https://picsum.photos/seed/sarah/100/100",
  },
  {
    id: "a3",
    proName: "Marcus T.",
    role: "Ingénieur son",
    missionTitle: "Enregistrement Voix Lead",
    date: "Il y a 5h",
    avatar: "https://picsum.photos/seed/marcus/100/100",
  }
];

export default function StudioDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.toast) {
      setToastMessage(location.state.toast);
      // Clear the state so it doesn't show again on refresh
      window.history.replaceState({}, document.title);
      
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto relative">
      {/* Toast Notification */}
      {toastMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1a1a1a] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10"
        >
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </motion.div>
      )}

      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full blur-3xl opacity-20 mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-gradient-to-tr from-blue-300 to-white rounded-full blur-3xl opacity-30 mix-blend-multiply" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-12"
      >
        <div>
          <h1 className="text-3xl font-light tracking-tight">Studio Grande Armée</h1>
          <div className="flex items-center gap-1.5 mt-1 text-black/60">
            <MapPin size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">Paris / Île-de-France</span>
          </div>
        </div>
        
        <button className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/50 shadow-sm hover:scale-105 transition-transform">
          <img src="https://picsum.photos/seed/studio/200/200" alt="Studio Profile" className="w-full h-full object-cover" />
        </button>
      </motion.header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Active Missions (Takes up 2 columns on large screens) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 flex flex-col gap-6"
        >
          <div className="flex justify-between items-end">
            <SectionTitle>Mes missions actives</SectionTitle>
            <Button size="sm" className="gap-2" onClick={() => navigate("/studio/mission/create")}>
              <Plus size={16} />
              Créer une mission
            </Button>
          </div>

          <GlassCard className="p-6 md:p-8 flex flex-col gap-4 min-h-[500px]">
            {MOCK_MISSIONS.length > 0 ? (
              MOCK_MISSIONS.map((mission) => (
                <div 
                  key={mission.id} 
                  onClick={() => navigate(`/studio/mission/${mission.id}/candidatures`)}
                  className="group bg-white/30 hover:bg-white/50 border border-white/40 rounded-2xl p-5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-medium text-lg">{mission.title}</h3>
                      <Badge variant={
                        mission.status === "Publiée" ? "success" : 
                        mission.status === "En sélection" ? "warning" : "default"
                      }>
                        {mission.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-black/60">
                      <span className="flex items-center gap-1.5">
                        <FileAudio size={14} />
                        {mission.type}
                      </span>
                      {mission.expiresIn && (
                        <span className="flex items-center gap-1.5 text-orange-600/80 font-medium">
                          <Clock size={14} />
                          {mission.expiresIn}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                    <span className="font-semibold text-lg">{mission.price}</span>
                    <span className="text-xs text-black/50 font-medium">
                      {mission.candidatesCount} candidat{mission.candidatesCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 opacity-70">
                <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center mb-2">
                  <FileAudio size={24} className="text-black/40" />
                </div>
                <Text>Vous n'avez aucune mission en cours.</Text>
                <Button variant="secondary" size="sm" onClick={() => navigate("/studio/mission/create")}>
                  Créer ma première mission
                </Button>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Right Column: Recent Applications */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-6"
        >
          <SectionTitle>Candidatures récentes</SectionTitle>
          
          <GlassCard className="p-6 flex flex-col gap-4 h-full">
            {MOCK_APPLICATIONS.length > 0 ? (
              MOCK_APPLICATIONS.map((app) => (
                <div 
                  key={app.id} 
                  onClick={() => navigate(`/studio/mission/m1/candidatures`)}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/30 transition-colors cursor-pointer group"
                >
                  <img 
                    src={app.avatar} 
                    alt={app.proName} 
                    className="w-10 h-10 rounded-full object-cover border border-white/50"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{app.proName}</p>
                    <p className="text-xs text-black/60 truncate">{app.missionTitle}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-black/40 font-medium">{app.date}</span>
                    <ChevronRight size={14} className="text-black/20 group-hover:text-black/60 transition-colors" />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                <User size={32} className="mb-4 text-black/20" />
                <Text variant="secondary" className="text-sm">Aucune candidature pour le moment.</Text>
              </div>
            )}
            
            {MOCK_APPLICATIONS.length > 0 && (
              <button className="mt-auto pt-4 text-xs font-medium text-black/50 hover:text-black transition-colors text-center w-full">
                Voir toutes les candidatures
              </button>
            )}
          </GlassCard>
        </motion.div>

      </div>
    </div>
  );
}
