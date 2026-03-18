import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  ArrowLeft, Mic, Sliders, Disc, Music, PenTool, Piano, ListMusic, Star, 
  UploadCloud, FileAudio, FileText, Trash2, Play, Pause, Calendar, Clock, Plus
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { SectionTitle, Text } from "@/components/ui/Typography";
import { Toggle } from "@/components/ui/Toggle";
import { Stepper } from "@/components/ui/Stepper";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const SERVICES = [
  { id: "enregistrement", label: "Enregistrement voix", icon: Mic },
  { id: "mixage", label: "Mixage", icon: Sliders },
  { id: "mastering", label: "Mastering", icon: Disc },
  { id: "beatmaking", label: "Beatmaking", icon: Music },
  { id: "toplining", label: "Toplining", icon: PenTool },
  { id: "instrumentation", label: "Instrumentation", icon: Piano },
  { id: "arrangement", label: "Arrangement", icon: ListMusic },
  { id: "direction", label: "Direction artistique", icon: Star },
];

const GENRES = [
  "Trap", "Afro", "Drill", "RnB", "Pop", "Rock", "Jazz", 
  "Classique", "Électro", "Gospel", "Reggaeton", "Autres"
];

const LANGUAGES = ["Français", "Anglais", "Espagnol", "Portugais", "Autre"];

const DURATIONS = [
  { value: 2, label: "2h" },
  { value: 6, label: "6h" },
  { value: 12, label: "12h" },
  { value: 24, label: "24h" },
  { value: 48, label: "48h" },
];

export default function CreateMission() {
  const navigate = useNavigate();

  // Form State
  const [serviceType, setServiceType] = useState("");
  const [artistName, setArtistName] = useState("");
  const [isConfidential, setIsConfidential] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [beatType, setBeatType] = useState("");
  const [language, setLanguage] = useState("Français");
  
  const [hours, setHours] = useState(2);
  const [price, setPrice] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [dates, setDates] = useState([{ date: "", start: "", end: "" }]);
  
  const [displayDuration, setDisplayDuration] = useState(24);
  const [maxCandidates, setMaxCandidates] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);
  
  const [description, setDescription] = useState("");
  
  // Mock files state
  const [files, setFiles] = useState([
    { id: 1, name: "Maquette_V1.mp3", size: "4.2 Mo", type: "audio", isPlaying: false },
    { id: 2, name: "Paroles_Refrain.pdf", size: "120 Ko", type: "document" }
  ]);

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const addDateSlot = () => {
    if (dates.length < 3) {
      setDates([...dates, { date: "", start: "", end: "" }]);
    }
  };

  const removeDateSlot = (index: number) => {
    setDates(dates.filter((_, i) => i !== index));
  };

  const updateDateSlot = (index: number, field: string, value: string) => {
    const newDates = [...dates];
    newDates[index] = { ...newDates[index], [field]: value };
    setDates(newDates);
  };

  const togglePlay = (id: number) => {
    setFiles(files.map(f => f.id === id ? { ...f, isPlaying: !f.isPlaying } : f));
  };

  const removeFile = (id: number) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const calculateExpiration = () => {
    const date = new Date();
    date.setHours(date.getHours() + displayDuration);
    return date.toLocaleString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!serviceType) newErrors.serviceType = "Veuillez sélectionner un type de prestation.";
    if (selectedGenres.length === 0) newErrors.genres = "Veuillez sélectionner au moins un genre musical.";
    if (!isNegotiable && !price) newErrors.price = "Veuillez indiquer une rémunération ou cocher 'À négocier'.";
    
    const hasValidDate = dates.some(d => d.date && d.start && d.end);
    if (!hasValidDate) newErrors.dates = "Veuillez proposer au moins un créneau complet (date, début, fin).";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to top to see errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Success - Redirect with state for toast
    navigate("/dashboard", { 
      state: { 
        toast: `Mission publiée — elle expire dans ${displayDuration}h.` 
      } 
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto relative pb-32">
      {/* Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full blur-3xl opacity-20 mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-gradient-to-tr from-blue-300 to-white rounded-full blur-3xl opacity-30 mix-blend-multiply" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <Button variant="icon" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-light tracking-tight">Créer une mission</h1>
          <Text variant="secondary" className="text-sm mt-1">Détaillez votre besoin pour trouver le bon professionnel.</Text>
        </div>
      </motion.header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        
        {/* SECTION 1: La prestation */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="p-6 md:p-8 flex flex-col gap-8">
            <SectionTitle className="text-xl">1. La prestation</SectionTitle>
            
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Type de prestation *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SERVICES.map((service) => {
                  const Icon = service.icon;
                  const isSelected = serviceType === service.id;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        setServiceType(service.id);
                        setErrors(prev => ({ ...prev, serviceType: "" }));
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all",
                        isSelected 
                          ? "bg-orange-500/10 border-orange-500/50 text-orange-700 shadow-sm" 
                          : "bg-white/40 border-white/50 hover:bg-white/60 text-black/70"
                      )}
                    >
                      <Icon size={24} className={isSelected ? "text-orange-500" : "text-black/40"} />
                      <span className="text-xs font-medium text-center">{service.label}</span>
                    </button>
                  );
                })}
              </div>
              {errors.serviceType && <span className="text-xs text-red-500">{errors.serviceType}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Nom de l'artiste</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-black/60">Confidentiel</span>
                    <Toggle checked={isConfidential} onCheckedChange={setIsConfidential} />
                  </div>
                </div>
                <TextInput 
                  placeholder="Ex: Orelsan, Angèle..." 
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  disabled={isConfidential}
                  className={isConfidential ? "opacity-50 cursor-not-allowed" : ""}
                />
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium">Langue de travail</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs font-medium transition-colors border",
                        language === lang 
                          ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" 
                          : "bg-white/40 border-white/50 hover:bg-white/60 text-black/70"
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Genre musical *</label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(genre => {
                  const isSelected = selectedGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => {
                        toggleGenre(genre);
                        setErrors(prev => ({ ...prev, genres: "" }));
                      }}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs font-medium transition-colors border",
                        isSelected 
                          ? "bg-orange-500/10 border-orange-500/50 text-orange-700" 
                          : "bg-white/40 border-white/50 hover:bg-white/60 text-black/70"
                      )}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
              {errors.genres && <span className="text-xs text-red-500">{errors.genres}</span>}
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Type de beat / Ambiance (Optionnel)</label>
              <TextInput 
                placeholder="Ex: Mélodie sombre, 140 BPM, type Travis Scott..." 
                value={beatType}
                onChange={(e) => setBeatType(e.target.value)}
              />
            </div>
          </GlassCard>
        </motion.section>

        {/* SECTION 2: Logistique */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard className="p-6 md:p-8 flex flex-col gap-8">
            <SectionTitle className="text-xl">2. Logistique</SectionTitle>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium">Nombre d'heures estimé</label>
                <Stepper 
                  value={hours} 
                  onChange={setHours} 
                  min={0.5} 
                  max={12} 
                  step={0.5} 
                  formatValue={(v) => `${Math.floor(v)}h${v % 1 !== 0 ? '30' : ''}`}
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Rémunération *</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-black/60">À négocier</span>
                    <Toggle checked={isNegotiable} onCheckedChange={(val) => {
                      setIsNegotiable(val);
                      if (val) setErrors(prev => ({ ...prev, price: "" }));
                    }} />
                  </div>
                </div>
                <div className="relative">
                  <TextInput 
                    type="number"
                    placeholder="Montant" 
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      setErrors(prev => ({ ...prev, price: "" }));
                    }}
                    disabled={isNegotiable}
                    className={isNegotiable ? "opacity-50 cursor-not-allowed" : ""}
                    error={errors.price}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 font-medium">€</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-sm font-medium">Date et heure souhaitées *</label>
              
              <div className="flex flex-col gap-3">
                {dates.map((slot, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-center gap-3 bg-white/30 p-2 rounded-2xl border border-white/40">
                    <div className="relative flex-1 w-full">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
                      <input 
                        type="date" 
                        value={slot.date}
                        onChange={(e) => {
                          updateDateSlot(index, "date", e.target.value);
                          setErrors(prev => ({ ...prev, dates: "" }));
                        }}
                        className="w-full bg-transparent border-none focus:ring-0 py-2 pl-12 pr-4 text-sm outline-none"
                      />
                    </div>
                    <div className="w-px h-8 bg-black/10 hidden sm:block" />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Clock size={16} className="text-black/40 ml-2" />
                      <input 
                        type="time" 
                        value={slot.start}
                        onChange={(e) => {
                          updateDateSlot(index, "start", e.target.value);
                          setErrors(prev => ({ ...prev, dates: "" }));
                        }}
                        className="bg-transparent border-none focus:ring-0 py-2 px-2 text-sm outline-none w-24"
                      />
                      <span className="text-black/40">à</span>
                      <input 
                        type="time" 
                        value={slot.end}
                        onChange={(e) => {
                          updateDateSlot(index, "end", e.target.value);
                          setErrors(prev => ({ ...prev, dates: "" }));
                        }}
                        className="bg-transparent border-none focus:ring-0 py-2 px-2 text-sm outline-none w-24"
                      />
                    </div>
                    {dates.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeDateSlot(index)}
                        className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors ml-auto sm:ml-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {errors.dates && <span className="text-xs text-red-500">{errors.dates}</span>}

              {dates.length < 3 && (
                <button 
                  type="button" 
                  onClick={addDateSlot}
                  className="flex items-center gap-2 text-xs font-medium text-orange-600 hover:text-orange-700 w-fit mt-2"
                >
                  <Plus size={14} />
                  Proposer une autre date
                </button>
              )}
            </div>
          </GlassCard>
        </motion.section>

        {/* SECTION 3: Paramètres de diffusion */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <GlassCard className="p-6 md:p-8 flex flex-col gap-8">
            <SectionTitle className="text-xl">3. Paramètres de diffusion</SectionTitle>
            
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Durée d'affichage de la mission</label>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map(dur => (
                  <button
                    key={dur.value}
                    type="button"
                    onClick={() => setDisplayDuration(dur.value)}
                    className={cn(
                      "px-5 py-2.5 rounded-full text-sm font-medium transition-all border",
                      displayDuration === dur.value 
                        ? "bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-md" 
                        : "bg-white/40 border-white/50 hover:bg-white/60 text-black/70"
                    )}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
              <Text variant="secondary" className="text-xs mt-2 flex items-center gap-1.5">
                <Clock size={12} />
                La mission expirera le {calculateExpiration()}
              </Text>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-black/5">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium">Nombre maximum de candidatures</label>
                <Stepper 
                  value={maxCandidates} 
                  onChange={setMaxCandidates} 
                  min={0} 
                  max={50} 
                  step={5} 
                  formatValue={(v) => v === 0 ? "Illimité" : `${v} max`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Toggle checked={isUrgent} onCheckedChange={setIsUrgent} />
                  <label className="text-sm font-bold text-orange-600 flex items-center gap-1.5">
                    Tag URGENT
                    {isUrgent && <Badge variant="warning" className="ml-2">Actif</Badge>}
                  </label>
                </div>
                <Text variant="secondary" className="text-xs">
                  Ta mission apparaîtra en priorité dans le feed des professionnels.
                </Text>
              </div>
            </div>
          </GlassCard>
        </motion.section>

        {/* SECTION 4: Fichiers de référence */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <GlassCard className="p-6 md:p-8 flex flex-col gap-6">
            <SectionTitle className="text-xl">4. Fichiers de référence</SectionTitle>
            
            <div className="border-2 border-dashed border-black/10 hover:border-orange-500/50 bg-white/20 hover:bg-white/40 transition-all rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center shadow-sm">
                <UploadCloud size={24} className="text-orange-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Glissez-déposez vos fichiers ici</p>
                <p className="text-xs text-black/50 mt-1">ou cliquez pour parcourir</p>
              </div>
              <Badge variant="outline" className="mt-2">MP3, WAV, PDF (Max 100 Mo)</Badge>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="flex flex-col gap-3">
                {files.map(file => (
                  <div key={file.id} className="bg-white/40 border border-white/50 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shadow-sm">
                          {file.type === 'audio' ? <FileAudio size={20} className="text-orange-500" /> : <FileText size={20} className="text-blue-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-black/50">{file.size}</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="p-2 text-black/40 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    {/* Mini Audio Player Mock */}
                    {file.type === 'audio' && (
                      <div className="flex items-center gap-3 pl-14 pr-2">
                        <button 
                          type="button"
                          onClick={() => togglePlay(file.id)}
                          className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center hover:scale-105 transition-transform shrink-0"
                        >
                          {file.isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                        </button>
                        <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden relative">
                          <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-1000"
                            style={{ width: file.isPlaying ? '45%' : '0%' }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-black/40 shrink-0">
                          {file.isPlaying ? '0:42' : '0:00'} / 3:15
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Text variant="tertiary" className="text-xs text-center">
              Ces fichiers sont visibles uniquement par les professionnels qui candidatent.
            </Text>
          </GlassCard>
        </motion.section>

        {/* SECTION 5: Description libre */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <GlassCard className="p-6 md:p-8 flex flex-col gap-4">
            <SectionTitle className="text-xl">5. Informations supplémentaires</SectionTitle>
            
            <div className="relative">
              <Textarea 
                placeholder="Détaillez vos attentes, le matériel disponible au studio, les références sonores..."
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setDescription(e.target.value);
                  }
                }}
              />
              <span className={cn(
                "absolute bottom-4 right-4 text-xs font-medium",
                description.length >= 480 ? "text-orange-500" : "text-black/40"
              )}>
                {description.length} / 500
              </span>
            </div>
          </GlassCard>
        </motion.section>

      </form>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 w-full p-4 md:p-8 bg-gradient-to-t from-[#f4ece4] via-[#f4ece4]/90 to-transparent z-50 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <Button 
            variant="primary" 
            size="lg" 
            className="w-full shadow-2xl shadow-orange-500/20"
            onClick={handleSubmit}
          >
            Publier la mission
          </Button>
        </div>
      </div>
    </div>
  );
}
