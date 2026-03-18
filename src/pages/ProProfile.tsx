import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Edit2, MapPin, Globe, Instagram, Plus, X, Check, Star, Music, Youtube, Link as LinkIcon } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Textarea } from '@/components/ui/Textarea';
import { StarDisplay } from '@/components/ui/StarDisplay';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function ProProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [data, setData] = useState({
    name: 'Alexandre M.',
    bio: 'Ingénieur du son spécialisé en mixage et mastering. Plus de 10 ans d\'expérience dans les musiques urbaines et électroniques.',
    rate: 200,
    showRate: true,
    services: ['Mixage', 'Mastering'],
    genres: ['Rap', 'R&B', 'Afro'],
    instruments: ['Clavier', 'Basse'],
    links: [
      { id: 1, platform: 'SoundCloud', url: 'soundcloud.com/alexandre-mix' },
      { id: 2, platform: 'Instagram', url: '@alexandre.son' }
    ],
    alerts: {
      services: ['Mixage', 'Mastering', 'Enregistrement'],
      genres: ['Rap', 'R&B', 'Afro', 'Pop'],
      minRate: 150,
      enabled: true
    },
    isAvailable: true
  });

  const [newGenre, setNewGenre] = useState('');
  const [newInstrument, setNewInstrument] = useState('');

  const handleAddGenre = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newGenre.trim()) {
      setData({ ...data, genres: [...data.genres, newGenre.trim()] });
      setNewGenre('');
    }
  };

  const handleAddInstrument = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newInstrument.trim()) {
      setData({ ...data, instruments: [...data.instruments, newInstrument.trim()] });
      setNewInstrument('');
    }
  };

  const removeGenre = (item: string) => {
    setData({ ...data, genres: data.genres.filter(g => g !== item) });
  };

  const removeInstrument = (item: string) => {
    setData({ ...data, instruments: data.instruments.filter(i => i !== item) });
  };

  const removeLink = (id: number) => {
    setData({ ...data, links: data.links.filter(l => l.id !== id) });
  };

  const toggleService = (service: string) => {
    if (data.services.includes(service)) {
      setData({ ...data, services: data.services.filter(s => s !== service) });
    } else {
      setData({ ...data, services: [...data.services, service] });
    }
  };

  const toggleAlertService = (service: string) => {
    if (data.alerts.services.includes(service)) {
      setData({
        ...data,
        alerts: { ...data.alerts, services: data.alerts.services.filter(s => s !== service) }
      });
    } else {
      setData({
        ...data,
        alerts: { ...data.alerts, services: [...data.alerts.services, service] }
      });
    }
  };

  const toggleAlertGenre = (genre: string) => {
    if (data.alerts.genres.includes(genre)) {
      setData({
        ...data,
        alerts: { ...data.alerts, genres: data.alerts.genres.filter(g => g !== genre) }
      });
    } else {
      setData({
        ...data,
        alerts: { ...data.alerts, genres: [...data.alerts.genres, genre] }
      });
    }
  };

  const reviews = [
    { id: 1, author: 'Studio Grande Armée', rating: 5, comment: 'Alexandre est arrivé préparé, mix propre dès la première passe.', date: 'Il y a 5 jours', avatar: 'https://picsum.photos/seed/studio1/100/100' },
    { id: 2, author: 'Studio Pigalle Records', rating: 5, comment: 'Très à l\'écoute, résultat impeccable.', date: 'Il y a 2 semaines', avatar: 'https://picsum.photos/seed/studio2/100/100' },
  ];

  const allServices = ['Enregistrement', 'Mixage', 'Mastering', 'Beatmaking', 'Composition', 'Arrangement'];
  const allGenres = ['Rap', 'R&B', 'Afro', 'Pop', 'Rock', 'Electro', 'Jazz', 'Classique'];

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'soundcloud': return <Music size={16} />;
      case 'youtube': return <Youtube size={16} />;
      case 'instagram': return <Instagram size={16} />;
      case 'spotify': return <Music size={16} />;
      default: return <Globe size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f4ece4] pb-32">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f4ece4]/80 backdrop-blur-md border-b border-black/5 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mon Profil</h1>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 -mr-2 hover:bg-black/5 rounded-full transition-colors text-black/60 hover:text-black"
        >
          {isEditing ? <X size={20} /> : <Edit2 size={20} />}
        </button>
      </header>

      {/* Hero */}
      <div className="pt-14 relative h-80 w-full overflow-hidden bg-black/5">
        <img 
          src="https://i.pravatar.cc/1000?img=3" 
          alt="Profile"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        
        {isEditing && (
          <div 
            className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <Edit2 size={24} />
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
              {isEditing ? (
                <input 
                  type="text"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="text-3xl font-bold text-white bg-transparent border-b border-white/30 focus:border-white outline-none w-full"
                />
              ) : (
                <h2 className="text-3xl font-bold text-white">{data.name}</h2>
              )}
              <div className="flex flex-wrap gap-2 mt-1">
                {data.services.map(service => (
                  <div key={service}>
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md">
                      {service}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-2">
            <button 
              onClick={() => setData({ ...data, isAvailable: !data.isAvailable })}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 w-fit",
                data.isAvailable 
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md" 
                  : "bg-black/40 text-white/70 border border-white/20 backdrop-blur-md"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", data.isAvailable ? "bg-emerald-400" : "bg-white/50")} />
              {data.isAvailable ? "Disponible" : "Indisponible"}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 -mt-2 relative z-10">
        {/* About */}
        <GlassCard className="p-6 flex flex-col gap-4">
          <h3 className="text-lg font-semibold">À propos</h3>
          
          {isEditing ? (
            <Textarea 
              value={data.bio}
              onChange={(e) => setData({ ...data, bio: e.target.value })}
              placeholder="Votre bio..."
              rows={4}
            />
          ) : (
            <p className="text-sm leading-relaxed text-black/80">{data.bio}</p>
          )}

          <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-black/5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tarif indicatif</span>
              {isEditing && (
                <label className="flex items-center gap-2 text-xs text-black/60 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={data.showRate}
                    onChange={(e) => setData({ ...data, showRate: e.target.checked })}
                    className="rounded text-orange-500 focus:ring-orange-500"
                  />
                  Afficher mon tarif
                </label>
              )}
            </div>
            
            {isEditing ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-black/50">À partir de</span>
                <input 
                  type="number" 
                  value={data.rate}
                  onChange={(e) => setData({ ...data, rate: parseInt(e.target.value) || 0 })}
                  className="w-20 px-3 py-1.5 bg-white/50 border border-black/10 rounded-lg text-sm focus:border-orange-500 outline-none"
                />
                <span className="text-sm text-black/50">€ / session</span>
              </div>
            ) : (
              data.showRate && (
                <span className="text-sm font-medium text-orange-600">À partir de {data.rate} € / session</span>
              )
            )}
          </div>
        </GlassCard>

        {/* Skills */}
        <GlassCard className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">Mes métiers</h3>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2">
                {allServices.map(service => (
                  <label key={service} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={data.services.includes(service)}
                      onChange={() => toggleService(service)}
                      className="rounded text-orange-500 focus:ring-orange-500"
                    />
                    {service}
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.services.map(service => (
                  <div key={service}>
                    <Badge variant="default">{service}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">Genres musicaux</h3>
            <div className="flex flex-wrap gap-2">
              {data.genres.map((item) => (
                <div 
                  key={item} 
                  className="px-3 py-1.5 bg-white/40 border border-white/50 rounded-full text-sm font-medium flex items-center gap-2"
                >
                  {item}
                  {isEditing && (
                    <button 
                      onClick={() => removeGenre(item)}
                      className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {isEditing && (
              <TextInput 
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                onKeyDown={handleAddGenre}
                placeholder="Ajouter un genre (Entrée)"
                icon={<Plus size={16} />}
              />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">Instruments</h3>
            <div className="flex flex-wrap gap-2">
              {data.instruments.map((item) => (
                <div 
                  key={item} 
                  className="px-3 py-1.5 bg-white/40 border border-white/50 rounded-full text-sm font-medium flex items-center gap-2"
                >
                  {item}
                  {isEditing && (
                    <button 
                      onClick={() => removeInstrument(item)}
                      className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {isEditing && (
              <TextInput 
                value={newInstrument}
                onChange={(e) => setNewInstrument(e.target.value)}
                onKeyDown={handleAddInstrument}
                placeholder="Ajouter un instrument (Entrée)"
                icon={<Plus size={16} />}
              />
            )}
          </div>
        </GlassCard>

        {/* Portfolio */}
        <GlassCard className="p-6 flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Portfolio</h3>
          
          <div className="flex flex-col gap-3">
            {data.links.map(link => (
              <div key={link.id} className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/60 shrink-0">
                      {getPlatformIcon(link.platform)}
                    </div>
                    <TextInput 
                      value={link.url}
                      onChange={(e) => {
                        const newLinks = data.links.map(l => l.id === link.id ? { ...l, url: e.target.value } : l);
                        setData({ ...data, links: newLinks });
                      }}
                      className="flex-1"
                    />
                    <button 
                      onClick={() => removeLink(link.id)}
                      className="p-2 text-black/40 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <a href={`https://${link.url}`} target="_blank" rel="noreferrer" className="flex items-center justify-between w-full p-3 bg-white/40 border border-white/50 rounded-xl hover:bg-white/60 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/60 shrink-0">
                        {getPlatformIcon(link.platform)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium">{link.platform}</span>
                        <span className="text-xs text-black/50 truncate max-w-[200px]">{link.url}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      Ouvrir
                    </Button>
                  </a>
                )}
              </div>
            ))}
            
            {isEditing && (
              <Button variant="secondary" className="w-full mt-2 gap-2">
                <Plus size={16} />
                Ajouter un lien
              </Button>
            )}
          </div>
        </GlassCard>

        {/* Notification Preferences (Always Editable, Private) */}
        <GlassCard className="p-6 flex flex-col gap-6 border-orange-500/20 bg-orange-50/30">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-orange-900">Mes alertes missions</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={data.alerts.enabled}
                onChange={(e) => setData({ ...data, alerts: { ...data.alerts, enabled: e.target.checked } })}
              />
              <div className="w-11 h-6 bg-black/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          <div className={cn("flex flex-col gap-6 transition-opacity duration-300", !data.alerts.enabled && "opacity-50 pointer-events-none")}>
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-black/70">Je veux recevoir les missions de :</span>
              <div className="grid grid-cols-2 gap-2">
                {allServices.map(service => (
                  <label key={`alert-${service}`} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={data.alerts.services.includes(service)}
                      onChange={() => toggleAlertService(service)}
                      className="rounded text-orange-500 focus:ring-orange-500"
                    />
                    {service}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-black/70">Genres qui m'intéressent :</span>
              <div className="flex flex-wrap gap-2">
                {allGenres.map(genre => (
                  <button
                    key={`alert-${genre}`}
                    onClick={() => toggleAlertGenre(genre)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                      data.alerts.genres.includes(genre)
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white/40 text-black/60 border-white/50 hover:bg-white/60"
                    )}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-black/70">Ne pas me notifier en dessous de :</span>
                <span className="text-sm font-bold text-orange-600">{data.alerts.minRate} €</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="500" 
                step="25"
                value={data.alerts.minRate}
                onChange={(e) => setData({ ...data, alerts: { ...data.alerts, minRate: parseInt(e.target.value) } })}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-xs text-black/40">
                <span>0 €</span>
                <span>500 €+</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Reviews (Read Only) */}
        {!isEditing && (
          <GlassCard className="p-6 flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Ce que disent les studios</h3>
            
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="flex flex-col gap-2 pb-4 border-b border-black/5 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={review.avatar} alt={review.author} className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-sm font-medium">{review.author}</span>
                    </div>
                    <span className="text-xs text-black/40">{review.date}</span>
                  </div>
                  <StarDisplay rating={review.rating} />
                  <p className="text-sm text-black/70 italic">"{review.comment}"</p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>

      {/* Edit Footer */}
      {isEditing && (
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-[#f4ece4]/90 backdrop-blur-xl border-t border-white/50 p-4 pb-safe z-50 flex gap-3"
        >
          <Button variant="ghost" className="flex-1" onClick={() => setIsEditing(false)}>
            Annuler
          </Button>
          <Button variant="primary" className="flex-1" onClick={() => setIsEditing(false)}>
            Sauvegarder
          </Button>
        </motion.div>
      )}
    </div>
  );
}
