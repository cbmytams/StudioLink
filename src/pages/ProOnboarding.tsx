import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Mic, Music, Settings, Link as LinkIcon, Camera, User, Phone, Euro, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { TextInput } from '@/components/ui/TextInput';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { cn } from '@/lib/utils';

const SERVICES = ['Enregistrement', 'Mixage', 'Mastering', 'Beatmaking', 'Toplining', 'Réalisation'];
const GENRES = ['Rap', 'R&B', 'Pop', 'Afro', 'Électro', 'Rock', 'Jazz', 'Classique'];
const INSTRUMENTS = ['Voix', 'Guitare', 'Basse', 'Batterie', 'Claviers', 'Machines', 'Cuivres', 'Cordes'];

export default function ProOnboarding() {
  const navigate = useNavigate();
  const { proData, setProData, setOnboardingComplete } = useOnboardingStore();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  
  const [avatar, setAvatar] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newLink, setNewLink] = useState({ platform: 'Spotify', url: '' });

  const handleNext = () => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!proData.name) newErrors.name = 'Ton nom ou pseudo est requis';
      if (!proData.bio) newErrors.bio = 'Une courte bio est requise';
    } else if (step === 2) {
      if (proData.services.length === 0) newErrors.services = 'Sélectionne au moins un service';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setDirection(1);
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setDirection(-1);
    setStep(prev => prev - 1);
  };

  const handleComplete = () => {
    setOnboardingComplete(true);
    navigate('/pro/feed');
    alert("Bienvenue sur StudioLink Paris 🚀");
  };

  const handleSkip = () => {
    navigate('/pro/feed');
  };

  const toggleItem = (category: 'services' | 'genres' | 'instruments', item: string) => {
    const currentList = proData[category];
    if (currentList.includes(item)) {
      setProData({ [category]: currentList.filter(i => i !== item) });
    } else {
      setProData({ [category]: [...currentList, item] });
    }
    if (errors[category]) setErrors({ ...errors, [category]: '' });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
    }
  };

  const addLink = () => {
    if (newLink.url) {
      setProData({ links: [...proData.links, newLink] });
      setNewLink({ platform: 'Spotify', url: '' });
    }
  };

  const removeLink = (index: number) => {
    setProData({ links: proData.links.filter((_, i) => i !== index) });
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-[#f4ece4] flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-[#f4ece4]/90 backdrop-blur-md z-30">
        {step > 1 ? (
          <button onClick={handlePrev} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div className="w-9" /> // Spacer
        )}
        
        <button onClick={handleSkip} className="text-sm font-medium text-black/50 hover:text-black transition-colors">
          Passer
        </button>
      </header>

      {/* Progress */}
      <div className="px-6 py-2 flex flex-col gap-2">
        <div className="flex gap-2 h-1.5">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={cn(
                "flex-1 rounded-full transition-colors duration-300",
                i <= step ? "bg-orange-500" : "bg-black/10"
              )} 
            />
          ))}
        </div>
        <span className="text-xs font-medium text-black/50">Étape {step} sur 3</span>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0 overflow-y-auto p-6 pb-32 flex flex-col gap-6"
          >
            {step === 1 && (
              <>
                <div className="flex flex-col gap-2 mb-2 text-center items-center">
                  <h1 className="text-2xl font-bold tracking-tight">Crée ton profil Pro</h1>
                  <p className="text-sm text-black/60">C'est ta carte de visite pour les studios.</p>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-white/60 border-2 border-white/50 shadow-sm overflow-hidden flex items-center justify-center">
                      {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={32} className="text-black/20" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-orange-600 transition-colors">
                      <Camera size={14} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                    </label>
                  </div>

                  <div className="w-full flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <TextInput 
                        label="Nom ou Pseudo *"
                        value={proData.name}
                        onChange={(e) => {
                          setProData({ name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: '' });
                        }}
                        placeholder="Ex: John Doe / DJ Snake"
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && <span className="text-xs text-red-500 px-1">{errors.name}</span>}
                    </div>

                    <div className="flex flex-col gap-1 relative">
                      <Textarea 
                        label="Bio *"
                        value={proData.bio}
                        onChange={(e) => {
                          setProData({ bio: e.target.value.slice(0, 150) });
                          if (errors.bio) setErrors({ ...errors, bio: '' });
                        }}
                        placeholder="Ingénieur du son passionné par les musiques urbaines..."
                        rows={3}
                        className={errors.bio ? "border-red-500" : ""}
                      />
                      <span className="absolute bottom-2 right-3 text-[10px] text-black/40 font-medium">
                        {proData.bio.length}/150
                      </span>
                      {errors.bio && <span className="text-xs text-red-500 px-1">{errors.bio}</span>}
                    </div>

                    <TextInput 
                      label="Téléphone"
                      type="tel"
                      value={proData.phone}
                      onChange={(e) => setProData({ phone: e.target.value })}
                      icon={<Phone size={18} />}
                      placeholder="Ex: 06 12 34 56 78"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex flex-col gap-2 mb-2">
                  <h1 className="text-2xl font-bold tracking-tight">Tes compétences</h1>
                  <p className="text-sm text-black/60">Sélectionne ce que tu sais faire pour matcher avec les bonnes missions.</p>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium text-black/70 px-1 flex items-center gap-2">
                      <Settings size={16} />
                      Services proposés *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SERVICES.map(item => (
                        <button
                          key={item}
                          onClick={() => toggleItem('services', item)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                            proData.services.includes(item)
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-white/40 text-black/60 border-white/50 hover:bg-white/60"
                          )}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    {errors.services && <span className="text-xs text-red-500 px-1">{errors.services}</span>}
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium text-black/70 px-1 flex items-center gap-2">
                      <Music size={16} />
                      Genres de prédilection
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {GENRES.map(item => (
                        <button
                          key={item}
                          onClick={() => toggleItem('genres', item)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                            proData.genres.includes(item)
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-white/40 text-black/60 border-white/50 hover:bg-white/60"
                          )}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium text-black/70 px-1 flex items-center gap-2">
                      <Mic size={16} />
                      Instruments maîtrisés
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {INSTRUMENTS.map(item => (
                        <button
                          key={item}
                          onClick={() => toggleItem('instruments', item)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                            proData.instruments.includes(item)
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-white/40 text-black/60 border-white/50 hover:bg-white/60"
                          )}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="flex flex-col gap-2 mb-2">
                  <h1 className="text-2xl font-bold tracking-tight">Tarifs & Portfolio</h1>
                  <p className="text-sm text-black/60">Dernière étape pour finaliser ton profil.</p>
                </div>

                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-4 bg-white/40 p-4 rounded-2xl border border-white/50">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-black/70 flex items-center gap-2">
                        <Euro size={16} />
                        Tarif journalier minimum
                      </label>
                      <span className="font-bold text-orange-500">{proData.minRate}€</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="1000" 
                      step="50"
                      value={proData.minRate}
                      onChange={(e) => setProData({ minRate: parseInt(e.target.value) })}
                      className="w-full accent-orange-500"
                    />
                    
                    <label className="flex items-center gap-3 cursor-pointer mt-2">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only"
                          checked={proData.showRate}
                          onChange={(e) => setProData({ showRate: e.target.checked })}
                        />
                        <div className={cn(
                          "w-10 h-6 rounded-full transition-colors",
                          proData.showRate ? "bg-orange-500" : "bg-black/20"
                        )} />
                        <div className={cn(
                          "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                          proData.showRate ? "translate-x-4" : "translate-x-0"
                        )} />
                      </div>
                      <span className="text-sm font-medium text-black/70">Afficher ce tarif sur mon profil</span>
                    </label>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium text-black/70 px-1 flex items-center gap-2">
                      <LinkIcon size={16} />
                      Liens Portfolio (Spotify, Soundcloud...)
                    </label>
                    
                    <div className="flex flex-col gap-2">
                      {proData.links.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 bg-white/60 p-2 rounded-xl border border-white/50">
                          <span className="text-xs font-bold bg-black/5 px-2 py-1 rounded-md">{link.platform}</span>
                          <span className="text-sm truncate flex-1 text-black/60">{link.url}</span>
                          <button onClick={() => removeLink(index)} className="p-1 text-red-500 hover:bg-red-50 rounded-md">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <select 
                        value={newLink.platform}
                        onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })}
                        className="bg-white/60 border border-white/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                      >
                        <option value="Spotify">Spotify</option>
                        <option value="Soundcloud">Soundcloud</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Site Web">Site Web</option>
                      </select>
                      <TextInput 
                        value={newLink.url}
                        onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                        placeholder="URL du lien"
                        className="flex-1"
                      />
                      <Button variant="secondary" onClick={addLink} disabled={!newLink.url}>
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-[#f4ece4]/90 backdrop-blur-xl border-t border-white/50 z-40">
        {step < 3 ? (
          <Button variant="primary" className="w-full" onClick={handleNext}>
            Continuer
          </Button>
        ) : (
          <Button variant="primary" className="w-full" onClick={handleComplete}>
            Terminer mon profil
          </Button>
        )}
      </div>
    </div>
  );
}
