import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Star, MapPin, Clock, Music, Mic, FileAudio, 
  FileText, Play, Pause, Download, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Text } from '@/components/ui/Typography';
import { MOCK_MISSIONS } from '@/lib/mockData';
import { cn } from '@/lib/utils';

export default function MissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mission = MOCK_MISSIONS.find(m => m.id === id);

  const [message, setMessage] = useState('');
  const [isStudioProfileOpen, setIsStudioProfileOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [applicationState, setApplicationState] = useState<'open' | 'applied' | 'closed'>('open');

  useEffect(() => {
    if (mission) {
      if (mission.status === 'applied') {
        setApplicationState('applied');
      } else if (new Date(mission.expiresAt).getTime() < new Date().getTime()) {
        setApplicationState('closed');
      } else {
        setApplicationState('open');
      }
    }
  }, [mission]);

  if (!mission) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Mission introuvable</h2>
          <Button onClick={() => navigate('/pro/feed')}>Retour au feed</Button>
        </GlassCard>
      </div>
    );
  }

  const handleApply = () => {
    if (message.trim().length > 0) {
      setApplicationState('applied');
      // In a real app, we would send the application to the backend here
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto relative pb-40">
      {/* Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full blur-3xl opacity-20 mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-gradient-to-tr from-blue-300 to-white rounded-full blur-3xl opacity-30 mix-blend-multiply" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between mb-8 sticky top-0 z-30 pt-4 pb-2 bg-[#f4ece4]/80 backdrop-blur-md -mx-4 px-4 md:-mx-8 md:px-8">
        <div className="flex items-center gap-4">
          <Button variant="icon" size="icon" onClick={() => navigate('/pro/feed')}>
            <ArrowLeft size={20} />
          </Button>
          <Badge variant={applicationState === 'open' ? 'success' : 'default'}>
            {applicationState === 'open' ? 'Ouverte' : applicationState === 'applied' ? 'Candidature envoyée' : 'Expirée'}
          </Badge>
        </div>
        <CountdownTimer expiresAt={mission.expiresAt} className="text-sm" />
      </header>

      <div className="flex flex-col gap-8">
        
        {/* Studio Block */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <img 
              src="https://picsum.photos/seed/studio1/200/200" 
              alt="Studio" 
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white/50 shadow-sm"
            />
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Studio Grande Armée</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-black/60">
                <span className="flex items-center gap-1.5"><MapPin size={14} /> {mission.location}</span>
                <span className="flex items-center gap-1.5"><Star size={14} className="text-amber-500 fill-amber-500" /> 4.8 · 12 avis</span>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setIsStudioProfileOpen(true)} className="w-full sm:w-auto mt-4 sm:mt-0">
              Voir le profil complet
            </Button>
          </GlassCard>
        </motion.section>

        {/* Mission Details */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="p-6 md:p-8 flex flex-col gap-6">
            <h3 className="text-lg font-semibold mb-2">Détails de la mission</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Mic size={16} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-black/50 font-medium uppercase tracking-wider">Prestation</p>
                  <p className="font-medium mt-0.5">{mission.serviceType}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Star size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-black/50 font-medium uppercase tracking-wider">Artiste</p>
                  <p className="font-medium mt-0.5">{mission.isConfidential ? "Confidentiel 🔒" : mission.artistName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Music size={16} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-black/50 font-medium uppercase tracking-wider">Genre & Ambiance</p>
                  <p className="font-medium mt-0.5">{mission.genres.join(', ')} {mission.beatType ? `· ${mission.beatType}` : ''}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-black/50 font-medium uppercase tracking-wider">Durée estimée</p>
                  <p className="font-medium mt-0.5">{mission.duration}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-amber-600 font-bold text-sm">€</span>
                </div>
                <div>
                  <p className="text-xs text-black/50 font-medium uppercase tracking-wider">Rémunération</p>
                  <p className="font-medium mt-0.5">{mission.price}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-black/5">
              <p className="text-xs text-black/50 font-medium uppercase tracking-wider mb-3">Dates proposées</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-white/40 border border-white/50 rounded-full text-sm font-medium">
                  Jeu. 24 Oct · 14h - 18h
                </span>
                <span className="px-3 py-1.5 bg-white/40 border border-white/50 rounded-full text-sm font-medium">
                  Ven. 25 Oct · 10h - 14h
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-black/5">
              <p className="text-xs text-black/50 font-medium uppercase tracking-wider mb-2">Description du studio</p>
              <p className="text-sm leading-relaxed text-black/80">
                Nous recherchons un ingénieur son expérimenté pour enregistrer les voix lead et les backs d'un artiste urbain émergent. Le studio est équipé d'un micro Neumann U87 et d'un préampli Neve 1073. Une première maquette est disponible en pièce jointe pour vous donner une idée de la vibe.
              </p>
            </div>
          </GlassCard>
        </motion.section>

        {/* Reference Files */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard className="p-6 md:p-8 flex flex-col gap-4">
            <h3 className="text-lg font-semibold mb-2">Fichiers de référence</h3>
            
            <div className="bg-white/40 border border-white/50 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shadow-sm">
                    <FileAudio size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Maquette_V1.mp3</p>
                    <p className="text-xs text-black/50">4.2 Mo</p>
                  </div>
                </div>
                <button className="p-2 text-black/40 hover:text-black transition-colors">
                  <Download size={16} />
                </button>
              </div>
              
              <div className="flex items-center gap-3 pl-14 pr-2">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center hover:scale-105 transition-transform shrink-0"
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                </button>
                <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-1000"
                    style={{ width: isPlaying ? '45%' : '0%' }}
                  />
                </div>
                <span className="text-[10px] font-medium text-black/40 shrink-0">
                  {isPlaying ? '0:42' : '0:00'} / 3:15
                </span>
              </div>
            </div>

            <div className="bg-white/40 border border-white/50 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shadow-sm">
                  <FileText size={20} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Paroles_Refrain.pdf</p>
                  <p className="text-xs text-black/50">120 Ko</p>
                </div>
              </div>
              <button className="p-2 text-black/40 hover:text-black transition-colors">
                <Download size={16} />
              </button>
            </div>
          </GlassCard>
        </motion.section>

      </div>

      {/* Application Zone (Sticky Bottom) */}
      <div className="fixed bottom-0 left-0 w-full p-4 md:p-8 bg-gradient-to-t from-[#f4ece4] via-[#f4ece4]/95 to-transparent z-40 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <GlassCard className="p-4 md:p-6 shadow-2xl shadow-orange-500/10 border-white/60">
            
            {applicationState === 'open' && (
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Textarea 
                    placeholder="Ton message au studio (ex: dispo, matériel, références...)"
                    value={message}
                    onChange={(e) => {
                      if (e.target.value.length <= 280) setMessage(e.target.value);
                    }}
                    className="min-h-[100px] bg-white/60"
                  />
                  <span className={cn(
                    "absolute bottom-3 right-4 text-xs font-medium",
                    message.length >= 260 ? "text-orange-500" : "text-black/40"
                  )}>
                    {message.length} / 280
                  </span>
                </div>
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-full"
                  onClick={handleApply}
                  disabled={message.trim().length === 0}
                >
                  Postuler à cette mission
                </Button>
              </div>
            )}

            {applicationState === 'applied' && (
              <div className="flex flex-col items-center justify-center text-center gap-3 py-2">
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-500/10 px-4 py-2 rounded-full font-medium">
                  <CheckCircle2 size={18} />
                  <span>Candidature envoyée le 24 Oct.</span>
                </div>
                <Text variant="secondary" className="text-sm">Le studio te contactera s'il sélectionne ton profil.</Text>
                <Button variant="primary" size="lg" className="w-full mt-2 opacity-50 cursor-not-allowed" disabled>
                  Postuler à cette mission
                </Button>
              </div>
            )}

            {applicationState === 'closed' && (
              <div className="flex flex-col items-center justify-center text-center gap-3 py-2">
                <div className="flex items-center gap-2 text-black/60 bg-black/5 px-4 py-2 rounded-full font-medium">
                  <AlertCircle size={18} />
                  <span>Cette mission n'accepte plus de candidatures.</span>
                </div>
                <Button variant="primary" size="lg" className="w-full mt-2 opacity-50 cursor-not-allowed" disabled>
                  Postuler à cette mission
                </Button>
              </div>
            )}

          </GlassCard>
        </div>
      </div>

      {/* Studio Profile Bottom Sheet */}
      <BottomSheet isOpen={isStudioProfileOpen} onClose={() => setIsStudioProfileOpen(false)} title="Profil du Studio">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <img src="https://picsum.photos/seed/studio1/200/200" alt="Studio" className="w-16 h-16 rounded-2xl object-cover" />
            <div>
              <h3 className="text-lg font-semibold">Studio Grande Armée</h3>
              <p className="text-sm text-black/60">75011 Paris</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-2">À propos</h4>
            <p className="text-sm text-black/80 leading-relaxed">
              Studio d'enregistrement professionnel situé en plein cœur de Paris. Spécialisé dans les musiques urbaines, nous accompagnons les artistes de la maquette au master final.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Photos</h4>
            <div className="grid grid-cols-2 gap-2">
              <img src="https://picsum.photos/seed/s1/300/200" alt="Studio 1" className="rounded-xl object-cover w-full h-24" />
              <img src="https://picsum.photos/seed/s2/300/200" alt="Studio 2" className="rounded-xl object-cover w-full h-24" />
            </div>
          </div>
        </div>
      </BottomSheet>

    </div>
  );
}
