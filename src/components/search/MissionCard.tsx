import { CalendarDays, Euro, MapPin } from 'lucide-react';
import type { SearchMissionResult } from '@/lib/search/searchService';

type MissionCardProps = {
  mission: SearchMissionResult;
  hasApplied?: boolean;
  onOpen: (missionId: string) => void;
};

function formatDate(value: string | null): string {
  if (!value) return 'Date à définir';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date à définir';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatBudget(value: number | null): string {
  if (value === null) return 'Budget à définir';
  return `${value.toLocaleString('fr-FR')} €`;
}

export function MissionCard({ mission, hasApplied = false, onOpen }: MissionCardProps) {
  const studioName = mission.studio?.display_name ?? 'Studio';
  const visibleGenres = mission.genres.slice(0, 3);

  return (
    <button
      type="button"
      onClick={() => onOpen(mission.id)}
      className="mission-card app-card-soft flex h-full flex-col gap-4 p-5 text-left"
      data-mission-id={mission.id}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white/65">{studioName}</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{mission.title}</h3>
        </div>
        {mission.genre ? (
          <span className="shrink-0 rounded-full border border-orange-300/40 bg-orange-400/10 px-2.5 py-1 text-[11px] font-semibold text-orange-200">
            {mission.genre}
          </span>
        ) : null}
      </div>

      <div className="space-y-2 text-sm text-white/65">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-orange-300" />
          <span>{mission.city ?? mission.location ?? 'Localisation à définir'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Euro size={14} className="text-orange-300" />
          <span>{formatBudget(mission.budget)}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-orange-300" />
          <span>{formatDate(mission.date)}</span>
        </div>
      </div>

      {visibleGenres.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {visibleGenres.map((genre) => (
            <span
              key={genre}
              className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[11px] font-medium text-white/75"
            >
              {genre}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3 pt-2 text-xs">
        <span className="text-white/45">
          {mission.applications_count} candidature{mission.applications_count > 1 ? 's' : ''}
        </span>
        {hasApplied ? (
          <span className="rounded-full border border-green-300/30 bg-green-400/10 px-2.5 py-1 font-semibold text-green-200">
            Candidature envoyée
          </span>
        ) : (
          <span className="font-semibold text-orange-200">
            Postuler →
          </span>
        )}
      </div>
    </button>
  );
}
