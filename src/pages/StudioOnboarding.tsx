import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MapPin, Phone, Info, Plus, X, Globe, Instagram, Camera } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { TextInput } from '@/components/ui/TextInput';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { cn } from '@/lib/utils';

const PREDEFINED_EQUIPMENT = [
  'Pro Tools', 'Logic Pro', 'Ableton', 'Neve Console', 'SSL Console', 
  'API Console', 'Neumann U87', 'AKG C414', 'Iso Booth', 'Régie séparée', 
  'Grand écran', 'Moniteurs Yamaha NS10'
];

const DISTRICTS = [
  '75001 Paris', '75002 Paris', '75003 Paris', '75004 Paris', '75005 Paris',
  '75006 Paris', '75007 Paris', '75008 Paris', '75009 Paris', '75010 Paris',
  '75011 Paris', '75012 Paris', '75013 Paris', '75014 Paris', '75015 Paris',
  '75016 Paris', '75017 Paris', '75018 Paris', '75019 Paris', '75020 Paris',
  'Hors Paris IDF'
];

export default function StudioOnboarding() {
  const navigate = useNavigate();
  const { studioData, setStudioData, setOnboardingComplete } = useOnboardingStore();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  
  const [newEquipment, setNewEquipment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!studioData.name) newErrors.name = 'Le nom du studio est requis';
      if (!studioData.address) newErrors.address = 'L\'adresse est requise';
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
    navigate('/dashboard');
    // In a real app, we would show a toast here
    alert("Bienvenue sur StudioLink Paris 🎙️");
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const handleAddEquipment = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newEquipment.trim()) {
      if (!studioData.equipment.includes(newEquipment.trim())) {
        setStudioData({ equipment: [...studioData.equipment, newEquipment.trim()] });
      }
      setNewEquipment('');
    }
  };

  const toggleEquipment = (item: string) => {
    if (studioData.equipment.includes(item)) {
      setStudioData({ equipment: studioData.equipment.filter(e => e !== item) });
    } else {
      setStudioData({ equipment: [...studioData.equipment, item] });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && photos.length < 5) {
      const newPhotos = Array.from(files).slice(0, 5 - photos.length).map(file => URL.createObjectURL(file as Blob));
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
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
                <div className="flex flex-col gap-2 mb-2">
                  <h1 className="text-2xl font-bold tracking-tight">Présentez votre studio</h1>
                  <p className="text-sm text-black/60">Ces informations seront visibles par les professionnels.</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <TextInput 
                      label="Nom du studio *"
                      value={studioData.name}
                      onChange={(e) => {
                        setStudioData({ name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      placeholder="Ex: Studio Pigalle"
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && <span className="text-xs text-red-500 px-1">{errors.name}</span>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <TextInput 
                      label="Adresse complète *"
                      value={studioData.address}
                      onChange={(e) => {
                        setStudioData({ address: e.target.value });
                        if (errors.address) setErrors({ ...errors, address: '' });
                      }}
                      icon={<MapPin size={18} />}
                      placeholder="Ex: 12 Rue de la Roquette"
                      className={errors.address ? "border-red-500" : ""}
                    />
                    {errors.address && <span className="text-xs text-red-500 px-1">{errors.address}</span>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-black/70 px-1">Arrondissement *</label>
                    <select 
                      value={studioData.district}
                      onChange={(e) => setStudioData({ district: e.target.value })}
                      className="w-full bg-white/60 backdrop-blur-md border border-white/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                    >
                      {DISTRICTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <TextInput 
                    label="Téléphone de contact"
                    type="tel"
                    value={studioData.phone}
                    onChange={(e) => setStudioData({ phone: e.target.value })}
                    icon={<Phone size={18} />}
                    placeholder="Ex: 01 23 45 67 89"
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex flex-col gap-2 mb-2">
                  <h1 className="text-2xl font-bold tracking-tight">Décrivez votre espace</h1>
                  <p className="text-sm text-black/60">Détaillez l'acoustique et le matériel à disposition.</p>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1 relative">
                    <Textarea 
                      label="Description"
                      value={studioData.description}
                      onChange={(e) => setStudioData({ description: e.target.value.slice(0, 300) })}
                      placeholder="Parlez de l'histoire du studio, de l'acoustique de la cabine, de l'ambiance..."
                      rows={5}
                    />
                    <span className="absolute bottom-2 right-3 text-[10px] text-black/40 font-medium">
                      {studioData.description.length}/300
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium text-black/70 px-1">Équipements</label>
                    
                    <div className="flex flex-wrap gap-2">
                      {PREDEFINED_EQUIPMENT.map(item => (
                        <button
                          key={item}
                          onClick={() => toggleEquipment(item)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                            studioData.equipment.includes(item)
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-white/40 text-black/60 border-white/50 hover:bg-white/60"
                          )}
                        >
                          {item}
                        </button>
                      ))}
                      
                      {studioData.equipment.filter(e => !PREDEFINED_EQUIPMENT.includes(e)).map(item => (
                        <div 
                          key={item} 
                          className="px-3 py-1.5 bg-orange-500 text-white border border-orange-500 rounded-full text-sm font-medium flex items-center gap-2"
                        >
                          {item}
                          <button 
                            onClick={() => toggleEquipment(item)}
                            className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40 transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <TextInput 
                      value={newEquipment}
                      onChange={(e) => setNewEquipment(e.target.value)}
                      onKeyDown={handleAddEquipment}
                      placeholder="Autre équipement (Entrée pour ajouter)"
                      icon={<Plus size={18} />}
                      className="mt-2"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="flex flex-col gap-2 mb-2">
                  <h1 className="text-2xl font-bold tracking-tight">Montrez votre studio</h1>
                  <p className="text-sm text-black/60">Ajoutez des photos et vos liens pour rassurer les pros.</p>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-sm font-medium text-black/70">Photos du studio</label>
                      <span className="text-xs text-black/40 font-medium">{photos.length}/5</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {photos.map((photo, i) => (
                        <div key={i} className={cn("relative rounded-xl overflow-hidden bg-black/5", i === 0 ? "col-span-2 aspect-video" : "aspect-square")}>
                          <img src={photo} alt={`Studio ${i}`} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => removePhoto(i)}
                            className="absolute top-2 right-2 w-6 h-6 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      
                      {photos.length < 5 && (
                        <label className={cn(
                          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/10 bg-white/40 hover:bg-white/60 transition-colors cursor-pointer",
                          photos.length === 0 ? "col-span-2 aspect-video" : "aspect-square"
                        )}>
                          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <Camera size={20} />
                          </div>
                          <span className="text-sm font-medium text-black/50">Ajouter une photo</span>
                          <input type="file" className="hidden" accept="image/*" multiple onChange={handlePhotoUpload} />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <label className="text-sm font-medium text-black/70 px-1">Liens (optionnel)</label>
                    <TextInput 
                      value={studioData.website}
                      onChange={(e) => setStudioData({ website: e.target.value })}
                      icon={<Globe size={18} />}
                      placeholder="Site web (ex: monsite.com)"
                    />
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 flex items-center gap-2">
                        <Instagram size={18} />
                        <span className="font-medium">@</span>
                      </div>
                      <input
                        type="text"
                        value={studioData.instagram}
                        onChange={(e) => setStudioData({ instagram: e.target.value })}
                        placeholder="nom_du_studio"
                        className="w-full bg-white/60 backdrop-blur-md border border-white/50 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder:text-black/30"
                      />
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
            Créer mon profil
          </Button>
        )}
      </div>
    </div>
  );
}
