import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Star, ExternalLink, Music, Globe, Instagram, CheckCircle2, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { StarDisplay } from '@/components/ui/StarDisplay';
import { Text } from '@/components/ui/Typography';
import { MOCK_PROS, ProProfile } from '@/data/mockPros';
import { cn } from '@/lib/utils';

// Mock applications for the mission
const MOCK_APPLICATIONS = [
  { id: 'app1', proId: 'pro1', message: "Spécialisé RnB/Afro, j'ai mixé des projets similaires. Disponible sur tes créneaux.", status: 'new' },
  { id: 'app2', proId: 'pro2', message: "Portfolio dispo sur SoundCloud, réf. artistes signés. Disponible.", status: 'new' },
  { id: 'app3', proId: 'pro3', message: "", status: 'new' },
  { id: 'app4', proId: 'pro4', message: "Je travaille régulièrement avec des studios parisiens, dispo ce weekend.", status: 'new' },
];

export default function ManageApplications() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'new' | 'selected' | 'past'>('new');
  const [applications, setApplications] = useState(MOCK_APPLICATIONS);
  
  // Modals state
  const [selectedProId, setSelectedProId] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [proToConfirm, setProToConfirm] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const newApps = applications.filter(a => a.status === 'new');
  const selectedApps = applications.filter(a => a.status === 'selected');
  const pastApps = applications.filter(a => a.status === 'past');

  const handleSelectPro = (appId: string, proId: string) => {
    setProToConfirm(appId);
    setSelectedProId(proId);
    setIsConfirmModalOpen(true);
  };

  const confirmSelection = () => {
    if (!proToConfirm || !selectedProId) return;
    
    const pro = MOCK_PROS[selectedProId];
    
    setApplications(apps => apps.map(app => {
      if (app.id === proToConfirm) return { ...app, status: 'selected' };
      if (app.status === 'new') return { ...app, status: 'past' };
      return app;
    }));
    
    setIsConfirmModalOpen(false);
    setSelectedProId(null);
    setProToConfirm(null);
    setActiveTab('selected');
    
    setToastMessage(`${pro.firstName} a été sélectionné. Le chat est maintenant ouvert.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const renderProProfile = (pro: ProProfile) => {
    const getPlatformIcon = (platform: string) => {
      if (platform.toLowerCase().includes('instagram')) return <Instagram size={16} />;
      if (platform.toLowerCase().includes('spotify') || platform.toLowerCase().includes('soundcloud')) return <Music size={16} />;
      return <Globe size={16} />;
    };

    return (
      <div className="flex flex-col gap-8 pb-24">
        {/* Hero Section */}
        <div className="relative h-64 -mx-6 -mt-6 rounded-t-3xl overflow-hidden">
          <img src={pro.coverImage} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 flex items-end gap-4">
            <img src={pro.avatar} alt={pro.firstName} className="w-20 h-20 rounded-2xl border-2 border-white/20 shadow-xl object-cover" />
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-white">{pro.firstName} {pro.lastName}</h2>
                <Badge variant={pro.isAvailable ? "success" : "default"} className="text-[10px] py-0.5">
                  {pro.isAvailable ? "Disponible" : "Indisponible"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {pro.roles.map(role => (
                  <span key={role} className="text-xs font-medium text-white/80 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 px-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold">{pro.rating > 0 ? pro.rating : '-'}</span>
              <StarDisplay rating={pro.rating} size={16} />
            </div>
            <span className="text-xs text-black/50 font-medium">{pro.reviewCount > 0 ? `${pro.reviewCount} avis` : 'Nouveau sur StudioLink'}</span>
          </div>
          <div className="w-px h-8 bg-black/10" />
          <div className="flex flex-col">
            <span className="text-sm font-bold">{pro.basePrice || 'Sur devis'}</span>
            <span className="text-xs text-black/50 font-medium">Tarif indicatif</span>
          </div>
        </div>

        {/* About */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-black/50">À propos</h3>
          <p className="text-sm leading-relaxed text-black/80">{pro.bio}</p>
        </div>

        {/* Specialties */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-black/50">Spécialités</h3>
          <div className="flex flex-wrap gap-2">
            {pro.genres.map(genre => (
              <span key={genre} className="px-3 py-1.5 bg-black/5 rounded-full text-xs font-medium">
                {genre}
              </span>
            ))}
            {pro.instruments?.map(inst => (
              <span key={inst} className="px-3 py-1.5 bg-orange-500/10 text-orange-700 rounded-full text-xs font-medium">
                {inst}
              </span>
            ))}
          </div>
        </div>

        {/* Portfolio */}
        {pro.portfolio.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-black/50">Portfolio & Liens</h3>
            <div className="flex flex-col gap-2">
              {pro.portfolio.map((link, i) => (
                <a 
                  key={i} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-black/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                      {getPlatformIcon(link.platform)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{link.platform}</p>
                      <p className="text-xs text-black/50">{link.displayUrl}</p>
                    </div>
                  </div>
                  <ExternalLink size={16} className="text-black/20 group-hover:text-black/60 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-black/50">Derniers avis</h3>
          {pro.reviews.length > 0 ? (
            <div className="flex flex-col gap-3">
              {pro.reviews.map(review => (
                <div key={review.id}>
                  <GlassCard className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{review.studioName}</p>
                        <p className="text-[10px] text-black/40">{review.date}</p>
                      </div>
                      <StarDisplay rating={review.rating} size={12} />
                    </div>
                    <p className="text-sm text-black/70 italic">"{review.comment}"</p>
                  </GlassCard>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-black/5 text-center">
              <p className="text-sm text-black/50">Ce professionnel n'a pas encore reçu d'avis.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1a1a1a] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10 w-max max-w-[90vw]"
          >
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full blur-3xl opacity-20 mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-gradient-to-tr from-blue-300 to-white rounded-full blur-3xl opacity-30 mix-blend-multiply" />
      </div>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="icon" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">Mixage — Lenzo</h1>
              <Badge variant={selectedApps.length > 0 ? "success" : "warning"}>
                {selectedApps.length > 0 ? "Pourvue" : "En sélection"}
              </Badge>
            </div>
            <p className="text-sm text-black/60 mt-0.5 font-medium">{applications.length} candidat{applications.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-white/40 backdrop-blur-md rounded-full border border-white/50 w-fit">
          <button 
            onClick={() => setActiveTab('new')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              activeTab === 'new' ? "bg-white shadow-sm text-black" : "text-black/60 hover:text-black"
            )}
          >
            Nouvelles ({newApps.length})
          </button>
          <button 
            onClick={() => setActiveTab('selected')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              activeTab === 'selected' ? "bg-white shadow-sm text-black" : "text-black/60 hover:text-black"
            )}
          >
            Sélectionné
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              activeTab === 'past' ? "bg-white shadow-sm text-black" : "text-black/60 hover:text-black"
            )}
          >
            Passées
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-col gap-4">
        {activeTab === 'new' && (
          newApps.length > 0 ? (
            newApps.map((app, index) => {
              const pro = MOCK_PROS[app.proId];
              return (
                <motion.div key={app.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <GlassCard className="p-5 flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      <img src={pro.avatar} alt={pro.firstName} className="w-12 h-12 rounded-full object-cover border border-white/50" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{pro.firstName} {pro.lastName}</h3>
                          {pro.roles.map(role => (
                            <span key={role} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-orange-500/10 text-orange-700 rounded-full">
                              {role}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {pro.rating > 0 ? (
                            <>
                              <StarDisplay rating={pro.rating} size={12} />
                              <span className="text-xs text-black/60 font-medium">{pro.rating} · {pro.reviewCount} avis</span>
                            </>
                          ) : (
                            <span className="text-xs text-black/50 font-medium italic">Nouveau sur StudioLink</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white/30 rounded-xl p-4 border border-white/40">
                      {app.message ? (
                        <p className="text-sm text-black/80 leading-relaxed">"{app.message}"</p>
                      ) : (
                        <p className="text-sm text-black/40 italic">Aucun message laissé.</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <Button variant="ghost" className="flex-1" onClick={() => setSelectedProId(pro.id)}>
                        Voir le profil
                      </Button>
                      <Button variant="primary" className="flex-1" onClick={() => handleSelectPro(app.id, pro.id)}>
                        Sélectionner
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })
          ) : (
            <GlassCard className="p-8 text-center flex flex-col items-center justify-center gap-3">
              <CheckCircle2 size={32} className="text-black/20" />
              <p className="font-medium">Aucune nouvelle candidature.</p>
            </GlassCard>
          )
        )}

        {activeTab === 'selected' && (
          selectedApps.length > 0 ? (
            selectedApps.map((app) => {
              const pro = MOCK_PROS[app.proId];
              return (
                <motion.div key={app.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <GlassCard className="p-6 flex flex-col gap-6 border-emerald-500/30 bg-emerald-50/30">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={pro.avatar} alt={pro.firstName} className="w-16 h-16 rounded-full object-cover border-2 border-white" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white">
                          <CheckCircle2 size={12} />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl">{pro.firstName} {pro.lastName}</h3>
                        <p className="text-sm text-black/60 font-medium">Sélectionné pour cette mission</p>
                      </div>
                    </div>
                    
                    <Button 
                      variant="primary" 
                      size="lg" 
                      className="w-full"
                      onClick={() => navigate(`/chat/mock-session`)}
                    >
                      Accéder au chat
                    </Button>
                  </GlassCard>
                </motion.div>
              );
            })
          ) : (
            <GlassCard className="p-8 text-center flex flex-col items-center justify-center gap-3">
              <Star size={32} className="text-black/20" />
              <p className="font-medium">Aucun professionnel sélectionné pour l'instant.</p>
            </GlassCard>
          )
        )}

        {activeTab === 'past' && (
          pastApps.length > 0 ? (
            pastApps.map((app, index) => {
              const pro = MOCK_PROS[app.proId];
              return (
                <motion.div key={app.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <GlassCard className="p-4 flex items-center justify-between opacity-60 grayscale-[50%]">
                    <div className="flex items-center gap-3">
                      <img src={pro.avatar} alt={pro.firstName} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <h3 className="font-medium text-sm">{pro.firstName} {pro.lastName}</h3>
                        <p className="text-xs text-black/50">Mission pourvue</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedProId(pro.id)}>
                      Profil
                    </Button>
                  </GlassCard>
                </motion.div>
              );
            })
          ) : (
            <GlassCard className="p-8 text-center flex flex-col items-center justify-center gap-3">
              <ArrowLeft size={32} className="text-black/20" />
              <p className="font-medium">Les candidatures que tu as passées apparaîtront ici.</p>
            </GlassCard>
          )
        )}
      </div>

      {/* Pro Profile BottomSheet */}
      <BottomSheet 
        isOpen={!!selectedProId && !isConfirmModalOpen} 
        onClose={() => setSelectedProId(null)}
        fullHeight
      >
        {selectedProId && MOCK_PROS[selectedProId] && renderProProfile(MOCK_PROS[selectedProId])}
        
        {/* Sticky Footer for Profile */}
        {selectedProId && activeTab === 'new' && (
          <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#f4ece4] via-[#f4ece4]/95 to-transparent z-10">
            <Button 
              variant="primary" 
              size="lg" 
              className="w-full shadow-xl"
              onClick={() => handleSelectPro(applications.find(a => a.proId === selectedProId)?.id || '', selectedProId)}
            >
              Sélectionner {MOCK_PROS[selectedProId].firstName}
            </Button>
          </div>
        )}
      </BottomSheet>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && proToConfirm && selectedProId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-[#f4ece4] w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-6"
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold">Confirmer la sélection ?</h2>
                  <button onClick={() => setIsConfirmModalOpen(false)} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="bg-white/40 rounded-2xl p-4 border border-white/50 flex flex-col gap-2">
                  <div className="flex items-center gap-3 mb-2">
                    <img src={MOCK_PROS[selectedProId].avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-sm">{MOCK_PROS[selectedProId].firstName} {MOCK_PROS[selectedProId].lastName}</p>
                      <p className="text-xs text-black/60">Mixage — Lenzo</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-black/5">
                    <span className="text-xs font-medium text-black/50">Rémunération</span>
                    <span className="text-sm font-bold">200 €</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button variant="primary" onClick={confirmSelection} className="w-full">
                    Confirmer la sélection
                  </Button>
                  <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)} className="w-full">
                    Annuler
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
