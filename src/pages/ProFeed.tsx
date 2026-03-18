import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { usePublishedMissions } from '@/hooks/useMissions';
import { useAuth } from '@/auth/AuthProvider';
import { useToggleSave } from '@/hooks/useSaved';

const CATEGORIES = [
  'Enregistrement voix',
  'Mixage',
  'Mastering',
  'Beatmaking',
  'Arrangement',
  'Podcast',
];

function getBudgetValue(value: string | null) {
  if (!value) return 0;
  const parsed = Number.parseInt(value.replace(/[^\d]/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function ProFeed() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const toggleSave = useToggleSave();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minBudget, setMinBudget] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const { data: missions = [], isLoading, error, refetch } = usePublishedMissions();

  const visibleMissions = useMemo(() => missions.filter((mission) => {
    const text = `${mission.service_type} ${mission.artist_name ?? ''}`.toLowerCase();
    if (query && !text.includes(query.toLowerCase())) return false;
    if (selectedCategory !== 'all' && mission.service_type !== selectedCategory) return false;
    if ((mission.location ?? 'Paris').toLowerCase().includes('paris') === false) return false;
    if (minBudget > 0 && getBudgetValue(mission.price) < minBudget) return false;
    return mission.status === 'published';
  }), [minBudget, missions, query, selectedCategory]);

  return (
    <main className="mx-auto min-h-screen max-w-4xl p-4 pb-24">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold">Missions disponibles</h1>
        <p className="text-sm text-stone-500">Découvre les demandes studios publiées en temps réel.</p>
      </header>

      <div className="mb-3 flex items-center gap-2">
        <label className="flex min-h-[44px] flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white/80 px-3">
          <Search size={16} className="text-stone-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une mission..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-stone-200 bg-white/80"
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {showFilters ? (
        <GlassCard className="mb-3 p-4">
          <p className="mb-2 text-xs font-semibold text-stone-600">Catégorie</p>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`flex min-h-[44px] items-center rounded-full px-3 text-xs font-medium ${
                selectedCategory === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              Toutes
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`flex min-h-[44px] items-center rounded-full px-3 text-xs font-medium ${
                  selectedCategory === category
                    ? 'bg-orange-500 text-white'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-stone-600">
              <span>Budget minimum</span>
              <span>{minBudget} €</span>
            </div>
            <input
              type="range"
              min={0}
              max={500}
              step={25}
              value={minBudget}
              onChange={(event) => setMinBudget(Number(event.target.value))}
              className="w-full accent-orange-500"
            />
          </div>
        </GlassCard>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      ) : error ? (
        <GlassCard className="p-6 text-center">
          <p className="text-sm text-stone-600">Impossible de charger le feed.</p>
          <Button variant="ghost" className="mt-3" onClick={() => void refetch()}>
            Réessayer
          </Button>
        </GlassCard>
      ) : visibleMissions.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-base font-medium">Aucune mission disponible pour le moment.</p>
          <p className="mt-1 text-sm text-stone-500">Ajuste tes filtres ou reviens plus tard.</p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => {
              setQuery('');
              setSelectedCategory('all');
              setMinBudget(0);
            }}
          >
            Réinitialiser les filtres
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {visibleMissions.map((mission) => (
            <div key={mission.id}>
              <GlassCard
                className="cursor-pointer p-4 transition-colors hover:bg-white/75"
                onClick={() => navigate(`/pro/missions/${mission.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{mission.service_type}</p>
                    <p className="truncate text-xs text-stone-500">
                      {mission.artist_name || 'Confidentiel'} · {mission.location || 'Paris'}
                    </p>
                    <p className="mt-1 text-sm font-medium">{mission.price || 'À négocier'}</p>
                  </div>
                  <button
                    type="button"
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-stone-500 hover:text-orange-500"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!session?.user?.id) return;
                      toggleSave.mutate({
                        userId: session.user.id,
                        itemId: mission.id,
                        itemType: 'mission',
                      });
                    }}
                  >
                    <Heart size={18} />
                  </button>
                </div>
                <div className="mt-2 text-xs text-stone-500">
                  {mission.genres.join(', ') || 'Genre non renseigné'}
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
