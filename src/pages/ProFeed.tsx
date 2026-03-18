import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { SlidersHorizontal, X, SearchX } from 'lucide-react';
import { Toggle } from '@/components/ui/Toggle';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { MissionCard } from '@/components/ui/MissionCard';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Text } from '@/components/ui/Typography';
import { MOCK_MISSIONS } from '@/lib/mockData';
import { cn } from '@/lib/utils';

const SERVICES = [
  "Enregistrement voix", "Mixage", "Mastering", "Beatmaking", 
  "Toplining", "Instrumentation", "Arrangement", "Direction artistique"
];

const GENRES = [
  "Trap", "Afro", "Drill", "RnB", "Pop", "Rock", "Jazz", 
  "Classique", "Électro", "Gospel", "Reggaeton", "Autres"
];

export default function ProFeed() {
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filters State
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(0);

  // Active filters for the top bar
  const activeFiltersCount = selectedServices.length + selectedGenres.length + (minPrice > 0 ? 1 : 0);

  const toggleService = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const resetFilters = () => {
    setSelectedServices([]);
    setSelectedGenres([]);
    setMinPrice(0);
    setIsFilterOpen(false);
  };

  const removeFilter = (type: 'service' | 'genre' | 'price', value?: string) => {
    if (type === 'service' && value) {
      setSelectedServices(prev => prev.filter(s => s !== value));
    } else if (type === 'genre' && value) {
      setSelectedGenres(prev => prev.filter(g => g !== value));
    } else if (type === 'price') {
      setMinPrice(0);
    }
  };

  // Filter and sort missions
  const filteredMissions = useMemo(() => {
    let filtered = [...MOCK_MISSIONS];

    if (selectedServices.length > 0) {
      filtered = filtered.filter(m => selectedServices.includes(m.serviceType));
    }

    if (selectedGenres.length > 0) {
      filtered = filtered.filter(m => m.genres.some(g => selectedGenres.includes(g)));
    }

    if (minPrice > 0) {
      filtered = filtered.filter(m => {
        if (m.price === "À négocier") return true; // Keep negotiable ones or maybe not? Let's keep them for now.
        const priceNum = parseInt(m.price.replace(/[^0-9]/g, ''));
        return !isNaN(priceNum) && priceNum >= minPrice;
      });
    }

    // Sort: Urgent first, then by creation date (newest first)
    return filtered.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [selectedServices, selectedGenres, minPrice]);

  // Dynamic greeting
  const hour = new Date().getHours();
  const greeting = hour < 18 ? "Bonjour" : "Bonsoir";
  const proName = "Alexandre";

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto relative pb-24">
      {/* Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full blur-3xl opacity-20 mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-gradient-to-tr from-blue-300 to-white rounded-full blur-3xl opacity-30 mix-blend-multiply" />
      </div>

      {/* Header */}
      <header className="mb-6 sticky top-0 z-30 pt-4 pb-2 bg-[#f4ece4]/80 backdrop-blur-md -mx-4 px-4 md:-mx-8 md:px-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{greeting} {proName}</h1>
            <p className="text-sm text-black/60 mt-0.5 font-medium">Ingénieur son · Mixage</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-black/40">
                {isAvailable ? "Disponible" : "Indisponible"}
              </span>
              <Toggle checked={isAvailable} onCheckedChange={setIsAvailable} />
            </div>
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="w-10 h-10 rounded-full bg-white/50 border border-white flex items-center justify-center hover:bg-white/80 transition-colors relative"
            >
              <SlidersHorizontal size={18} />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Unavailable Banner */}
        {!isAvailable && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 bg-orange-500/10 border border-orange-500/20 text-orange-700 text-xs font-medium p-3 rounded-xl"
          >
            Tu es en mode indisponible — tu ne recevras aucune notification de mission.
          </motion.div>
        )}

        {/* Active Filters Bar */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {selectedServices.map(service => (
              <span key={service} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 rounded-full text-xs font-medium whitespace-nowrap">
                {service}
                <button onClick={() => removeFilter('service', service)} className="hover:text-red-500"><X size={12} /></button>
              </span>
            ))}
            {selectedGenres.map(genre => (
              <span key={genre} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 rounded-full text-xs font-medium whitespace-nowrap">
                {genre}
                <button onClick={() => removeFilter('genre', genre)} className="hover:text-red-500"><X size={12} /></button>
              </span>
            ))}
            {minPrice > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 rounded-full text-xs font-medium whitespace-nowrap">
                Min. {minPrice} €
                <button onClick={() => removeFilter('price')} className="hover:text-red-500"><X size={12} /></button>
              </span>
            )}
          </div>
        )}
      </header>

      {/* Feed */}
      <div className="flex flex-col gap-4">
        {filteredMissions.length > 0 ? (
          filteredMissions.map((mission, index) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <MissionCard mission={mission} />
            </motion.div>
          ))
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <GlassCard className="p-8 flex flex-col items-center justify-center text-center gap-4 mt-8">
              <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center mb-2">
                <SearchX size={24} className="text-black/40" />
              </div>
              <h3 className="font-medium text-lg">Aucune mission disponible pour tes critères.</h3>
              <Text variant="secondary" className="text-sm">On te notifie dès qu'une nouvelle mission correspond à ton profil.</Text>
              <Button variant="secondary" size="sm" onClick={resetFilters} className="mt-2">
                Réinitialiser les filtres
              </Button>
            </GlassCard>
          </motion.div>
        )}
      </div>

      {/* Filters Bottom Sheet */}
      <BottomSheet isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filtres">
        <div className="flex flex-col gap-8">
          
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Type de prestation</h3>
            <div className="grid grid-cols-2 gap-2">
              {SERVICES.map(service => (
                <label key={service} className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedServices.includes(service)}
                    onChange={() => toggleService(service)}
                    className="rounded border-black/20 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm">{service}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Genre musical</h3>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
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
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold">Rémunération minimum</h3>
              <span className="text-sm font-medium text-orange-600">Min. {minPrice} €</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="500" 
              step="25"
              value={minPrice}
              onChange={(e) => setMinPrice(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-xs text-black/40">
              <span>0 €</span>
              <span>500 € +</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <Button variant="primary" onClick={() => setIsFilterOpen(false)}>
              Appliquer les filtres
            </Button>
            <Button variant="ghost" onClick={resetFilters}>
              Réinitialiser
            </Button>
          </div>

        </div>
      </BottomSheet>
    </div>
  );
}
