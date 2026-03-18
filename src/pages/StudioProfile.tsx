import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Edit2, MapPin, Globe, Instagram, Plus, X, Check, Star } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Textarea } from '@/components/ui/Textarea';
import { StarDisplay } from '@/components/ui/StarDisplay';
import { cn } from '@/lib/utils';

function EmptyState({
  emoji,
  text,
  cta,
  onCta,
}: {
  emoji: string;
  text: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
      <span className="text-4xl">{emoji}</span>
      <p className="text-sm text-stone-500 leading-relaxed">{text}</p>
      {cta && onCta && (
        <button
          onClick={onCta}
          className="mt-1 rounded-lg bg-orange-500 px-4 min-h-[44px] text-sm font-semibold text-white"
        >
          {cta}
        </button>
      )}
    </div>
  );
}

export default function StudioProfile() {
  const [isEditing, setIsEditing] = useState(false);
  
  const [data, setData] = useState({
    name: 'Studio Grande Armée',
    address: '12 Rue de la Roquette',
    city: '75011 Paris',
    description: 'Studio d\'enregistrement professionnel situé au cœur de Paris. Équipé des dernières technologies analogiques et numériques pour répondre aux exigences des plus grandes productions.',
    equipment: ['Pro Tools', 'Neve 1073', 'Neumann U87', 'SSL G-Bus', 'Yamaha NS10', 'Iso Booth'],
    website: 'https://studiograndearmee.com',
    instagram: '@studiograndearmee'
  });

  const [newEquipment, setNewEquipment] = useState('');

  const handleAddEquipment = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newEquipment.trim()) {
      setData({ ...data, equipment: [...data.equipment, newEquipment.trim()] });
      setNewEquipment('');
    }
  };

  const removeEquipment = (item: string) => {
    setData({ ...data, equipment: data.equipment.filter(e => e !== item) });
  };

  const reviews = [
    { id: 1, author: 'Alexandre M.', rating: 5, comment: 'Studio au top, matériel irréprochable. Je reviens.', date: 'Il y a 3 jours', avatar: 'https://i.pravatar.cc/150?img=3' },
    { id: 2, author: 'Sarah K.', rating: 5, comment: 'Très professionnel, cabine acoustiquement parfaite.', date: 'Il y a 1 semaine', avatar: 'https://i.pravatar.cc/150?img=5' },
    { id: 3, author: 'Jules T.', rating: 4, comment: 'Bonne ambiance, console en parfait état.', date: 'Il y a 2 semaines', avatar: 'https://i.pravatar.cc/150?img=11' },
  ];

  return (
    <div className="min-h-screen bg-[#f4ece4] pb-32">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f4ece4]/80 backdrop-blur-md border-b border-black/5 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mon Profil</h1>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="-mr-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-black/60 transition-colors hover:bg-black/5 hover:text-black"
        >
          {isEditing ? <X size={20} /> : <Edit2 size={20} />}
        </button>
      </header>

      {/* Hero Carousel */}
      <div className="pt-14 relative h-64 w-full overflow-hidden bg-black/5">
        <div className="flex overflow-x-auto snap-x snap-mandatory h-full no-scrollbar">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full h-full shrink-0 snap-center relative">
              <img 
                src={`https://picsum.photos/400/250?random=${i}`} 
                alt={`Studio photo ${i}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {isEditing && (
                <button className="absolute top-4 right-4 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-red-500">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        
        {/* Dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
        </div>

        {isEditing && (
          <button className="absolute bottom-4 right-4 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-colors hover:bg-orange-600">
            <Plus size={20} />
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col gap-4 -mt-6 relative z-10">
        {/* General Info */}
        <GlassCard className="p-6 flex flex-col gap-4">
          {isEditing ? (
            <TextInput 
              value={data.name} 
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="text-2xl font-semibold bg-transparent border-b border-black/10 rounded-none px-0 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          ) : (
            <h2 className="text-2xl font-semibold">{data.name}</h2>
          )}

          <div className="flex items-start gap-2 text-black/60">
            <MapPin size={18} className="shrink-0 mt-0.5" />
            {isEditing ? (
              <div className="flex flex-col gap-2 w-full">
                <TextInput 
                  value={data.address} 
                  onChange={(e) => setData({ ...data, address: e.target.value })}
                  placeholder="Adresse"
                />
                <TextInput 
                  value={data.city} 
                  onChange={(e) => setData({ ...data, city: e.target.value })}
                  placeholder="Ville"
                />
              </div>
            ) : (
              <span className="text-sm">{data.address}, {data.city}</span>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2">
              <StarDisplay rating={4.8} />
              <span className="text-sm font-medium text-black/60">(42 avis)</span>
            </div>
          )}

          {isEditing ? (
            <Textarea 
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder="Description du studio..."
              rows={4}
            />
          ) : (
            <p className="text-sm leading-relaxed text-black/80">{data.description}</p>
          )}
        </GlassCard>

        {/* Equipment */}
        <GlassCard className="p-6 flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Équipements</h3>
          
          <div className="flex flex-wrap gap-2">
            {data.equipment.map((item) => (
              <div 
                key={item} 
                className="px-3 py-1.5 bg-white/40 border border-white/50 rounded-full text-sm font-medium flex items-center gap-2"
              >
                {item}
                {isEditing && (
                  <button 
                    onClick={() => removeEquipment(item)}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/10 transition-colors hover:bg-red-500 hover:text-white"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {isEditing && (
            <TextInput 
              value={newEquipment}
              onChange={(e) => setNewEquipment(e.target.value)}
              onKeyDown={handleAddEquipment}
              placeholder="Ajouter un équipement (Entrée)"
              icon={<Plus size={16} />}
              className="mt-2"
            />
          )}
        </GlassCard>

        {/* Links */}
        <GlassCard className="p-6 flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Liens & Réseaux</h3>
          
          <div className="flex flex-col gap-3">
            {isEditing ? (
              <>
                <TextInput 
                  value={data.website}
                  onChange={(e) => setData({ ...data, website: e.target.value })}
                  icon={<Globe size={16} />}
                  placeholder="Site web"
                />
                <TextInput 
                  value={data.instagram}
                  onChange={(e) => setData({ ...data, instagram: e.target.value })}
                  icon={<Instagram size={16} />}
                  placeholder="Instagram"
                />
              </>
            ) : (
              <>
                <a href={data.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-medium hover:text-orange-600 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/60">
                    <Globe size={16} />
                  </div>
                  {data.website.replace('https://', '')}
                </a>
                <a href={`https://instagram.com/${data.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-medium hover:text-orange-600 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/60">
                    <Instagram size={16} />
                  </div>
                  {data.instagram}
                </a>
              </>
            )}
          </div>
        </GlassCard>

        {/* Reviews (Read Only) */}
        {!isEditing && (
          <GlassCard className="p-6 flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Ce que disent les professionnels</h3>
            
            <div className="flex flex-col gap-4">
              {reviews.length === 0 ? (
                <EmptyState emoji="⭐" text="Aucun avis reçu pour le moment." />
              ) : (
                reviews.map((review) => (
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
                ))
              )}
            </div>
          </GlassCard>
        )}
      </div>

      {/* Edit Footer */}
      {isEditing && (
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 bg-[#f4ece4]/90 backdrop-blur-xl border-t border-white/50 p-4 pb-safe z-50 flex gap-3"
        >
          <Button variant="ghost" className="flex-1" onClick={() => setIsEditing(false)}>
            Annuler
          </Button>
          <motion.div className="flex-1" whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }}>
            <Button variant="primary" className="w-full" onClick={() => setIsEditing(false)}>
              Sauvegarder
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
