import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Euro, MapPin, CheckCircle2, X, FileAudio, Search } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { mockApplications, ProApplication } from '@/data/mockApplications';
import { cn } from '@/lib/utils';

export default function ProApplications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'selected' | 'rejected'>('pending');
  const [applications, setApplications] = useState(mockApplications);
  const [appToRemove, setAppToRemove] = useState<string | null>(null);

  const pendingApps = applications.filter(a => a.status === 'pending');
  const selectedApps = applications.filter(a => a.status === 'selected');
  const rejectedApps = applications.filter(a => a.status === 'rejected');

  const activeCount = pendingApps.length + selectedApps.length;

  const handleRemove = () => {
    if (appToRemove) {
      setApplications(apps => apps.filter(a => a.id !== appToRemove));
      setAppToRemove(null);
    }
  };

  const getServiceColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mixage': return 'bg-blue-500/10 text-blue-700';
      case 'enregistrement': return 'bg-purple-500/10 text-purple-700';
      case 'beatmaking': return 'bg-emerald-500/10 text-emerald-700';
      case 'toplining': return 'bg-pink-500/10 text-pink-700';
      default: return 'bg-orange-500/10 text-orange-700';
    }
  };

  const getServiceLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mixage': return 'Mixage';
      case 'enregistrement': return 'Enregistrement';
      case 'beatmaking': return 'Beatmaking';
      case 'toplining': return 'Toplining';
      default: return type;
    }
  };

  const slideVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 20 : -20,
      opacity: 0,
      transition: { duration: 0.2, ease: "easeIn" }
    })
  };

  // Determine direction based on tab order
  const tabs = ['pending', 'selected', 'rejected'];
  const [prevTab, setPrevTab] = useState(activeTab);
  const direction = tabs.indexOf(activeTab) - tabs.indexOf(prevTab);

  const handleTabChange = (tab: 'pending' | 'selected' | 'rejected') => {
    setPrevTab(activeTab);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto relative">
      {/* Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full blur-3xl opacity-20 mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-gradient-to-tr from-blue-300 to-white rounded-full blur-3xl opacity-30 mix-blend-multiply" />
      </div>

      {/* Header */}
      <header className="mb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Mes candidatures</h1>
          <p className="text-sm text-black/60 mt-1 font-medium">{activeCount} en cours</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-white/40 backdrop-blur-md rounded-full border border-white/50 w-fit overflow-x-auto max-w-full hide-scrollbar">
          <button 
            onClick={() => handleTabChange('pending')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              activeTab === 'pending' ? "bg-white shadow-sm text-black" : "text-black/60 hover:text-black"
            )}
          >
            En attente ({pendingApps.length})
          </button>
          <button 
            onClick={() => handleTabChange('selected')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              activeTab === 'selected' ? "bg-white shadow-sm text-black" : "text-black/60 hover:text-black"
            )}
          >
            Sélectionné ({selectedApps.length})
          </button>
          <button 
            onClick={() => handleTabChange('rejected')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              activeTab === 'rejected' ? "bg-white shadow-sm text-black" : "text-black/60 hover:text-black"
            )}
          >
            Non retenu ({rejectedApps.length})
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="relative overflow-hidden min-h-[400px]">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={activeTab}
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col gap-4 absolute w-full"
          >
            {activeTab === 'pending' && (
              pendingApps.length > 0 ? (
                <AnimatePresence>
                  {pendingApps.map((app) => (
                    <motion.div 
                      key={app.id} 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                    >
                      <GlassCard className="p-5 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", getServiceColor(app.serviceType))}>
                            {getServiceLabel(app.serviceType)}
                          </span>
                          {app.expiresAt && (
                            <CountdownTimer expiresAt={app.expiresAt} />
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-lg">{app.missionTitle}</h3>
                          <p className="text-sm text-black/60">{app.studioName}</p>
                        </div>

                        <div className="flex items-center gap-4 text-sm font-medium text-black/80">
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} className="text-black/40" />
                            {app.durationHours}h
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Euro size={14} className="text-black/40" />
                            {app.rate} €
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-4 border-t border-black/5">
                          <span className="text-xs text-black/40 font-medium">{app.appliedAt}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="ghost" className="flex-1" onClick={() => navigate(`/pro/mission/${app.missionId}`)}>
                            Voir la mission
                          </Button>
                          <Button variant="ghost" className="flex-1 text-red-400 hover:text-red-500 hover:bg-red-50" onClick={() => setAppToRemove(app.id)}>
                            Retirer
                          </Button>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <GlassCard className="p-8 text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center mb-2">
                    <Search size={24} className="text-black/40" />
                  </div>
                  <p className="font-medium">Tu n'as pas encore postulé à une mission.</p>
                  <Button variant="primary" onClick={() => navigate('/pro/feed')}>
                    Explorer le feed
                  </Button>
                </GlassCard>
              )
            )}

            {activeTab === 'selected' && (
              selectedApps.length > 0 ? (
                selectedApps.map((app) => (
                  <motion.div key={app.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <GlassCard className="p-6 flex flex-col gap-5 border-orange-500/30 bg-orange-50/10">
                      <div className="flex items-center gap-2">
                        <Badge variant="success" className="gap-1.5 py-1">
                          <CheckCircle2 size={14} />
                          Sélectionné
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-xl">{app.missionTitle}</h3>
                        <p className="text-sm text-black/60">{app.studioName}</p>
                      </div>

                      <div className="flex items-center gap-4 text-sm font-medium text-black/80 bg-white/40 p-3 rounded-xl border border-white/50 w-fit">
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-black/40" />
                          {app.durationHours}h
                        </span>
                        <div className="w-px h-4 bg-black/10" />
                        <span className="flex items-center gap-1.5">
                          <Euro size={14} className="text-black/40" />
                          {app.rate} €
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-black/60">
                        <MapPin size={16} className="shrink-0" />
                        <span>{app.studioAddress}</span>
                      </div>

                      <Button 
                        variant="primary" 
                        size="lg" 
                        className="w-full mt-2"
                        onClick={() => navigate(`/chat/${app.sessionId || 'mock-session'}`)}
                      >
                        Accéder au chat
                      </Button>
                    </GlassCard>
                  </motion.div>
                ))
              ) : (
                <GlassCard className="p-8 text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center mb-2">
                    <CheckCircle2 size={24} className="text-black/40" />
                  </div>
                  <p className="font-medium">Tu n'as pas encore été sélectionné pour une session.</p>
                </GlassCard>
              )
            )}

            {activeTab === 'rejected' && (
              rejectedApps.length > 0 ? (
                rejectedApps.map((app) => (
                  <motion.div key={app.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <GlassCard className="p-5 flex flex-col gap-3 opacity-60 grayscale-[20%]">
                      <div className="flex justify-between items-start">
                        <Badge variant="default" className="bg-black/10 text-black/60 border-none">
                          Mission pourvue
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg text-black/80">{app.missionTitle}</h3>
                        <p className="text-sm text-black/50">{app.studioName}</p>
                      </div>

                      <div className="mt-2 pt-3 border-t border-black/5 text-center">
                        <p className="text-xs font-medium text-black/50">Un autre professionnel a été sélectionné</p>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))
              ) : (
                <GlassCard className="p-8 text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center mb-2">
                    <FileAudio size={24} className="text-black/40" />
                  </div>
                  <p className="font-medium text-black/60">Aucune candidature passée pour l'instant.</p>
                </GlassCard>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {appToRemove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setAppToRemove(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#f4ece4] w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-6"
            >
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold">Retirer ta candidature ?</h2>
                <button onClick={() => setAppToRemove(null)} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-sm text-black/60 leading-relaxed">
                Tu es sur le point de retirer ta candidature pour cette mission. Tu ne pourras pas re-postuler.
              </p>

              <div className="flex flex-col gap-3">
                <Button variant="ghost" className="w-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600" onClick={handleRemove}>
                  Confirmer le retrait
                </Button>
                <Button variant="ghost" onClick={() => setAppToRemove(null)} className="w-full">
                  Annuler
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
