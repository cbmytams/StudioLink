import { MapPin, Star } from 'lucide-react';
import type { SearchProResult } from '@/lib/search/searchService';

type ProCardProps = {
  profile: SearchProResult;
  onOpen: (profileId: string) => void;
};

function getDisplayName(profile: SearchProResult): string {
  return profile.display_name ?? 'Profil pro';
}

export function ProCard({ profile, onOpen }: ProCardProps) {
  const displayName = getDisplayName(profile);
  const visibleSkills = profile.skills.slice(0, 3);
  const roundedRating = typeof profile.rating_avg === 'number' ? Math.round(profile.rating_avg) : 0;

  return (
    <button
      type="button"
      onClick={() => onOpen(profile.id)}
      className="pro-card app-card-soft flex h-full flex-col gap-4 p-5 text-left"
      data-pro-id={profile.id}
    >
      <div className="flex items-start gap-3">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="h-14 w-14 rounded-full object-cover ring-1 ring-white/10"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-400/15 text-lg font-bold text-orange-100 ring-1 ring-white/10">
            {displayName.charAt(0).toUpperCase() || '?'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-white">{displayName}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-white/60">
            <MapPin size={14} className="text-orange-300" />
            <span>{profile.location ?? 'Ville non renseignée'}</span>
          </div>
        </div>
      </div>

      {typeof profile.rating_avg === 'number' && (profile.rating_count ?? 0) > 0 ? (
        <div className="flex items-center gap-2 text-sm text-white/75">
          <div className="flex items-center gap-0.5 text-amber-300">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                size={14}
                className={index < roundedRating ? 'fill-current' : ''}
              />
            ))}
          </div>
          <span>{profile.rating_avg.toFixed(1)} ({profile.rating_count} avis)</span>
        </div>
      ) : (
        <p className="text-sm text-white/45">Aucune note pour le moment</p>
      )}

      {profile.bio ? (
        <p className="line-clamp-3 text-sm leading-relaxed text-white/60">{profile.bio}</p>
      ) : (
        <p className="text-sm text-white/40">Bio non renseignée.</p>
      )}

      {visibleSkills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {visibleSkills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[11px] font-medium text-white/75"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto text-right text-xs font-semibold text-orange-200">
        Voir le profil →
      </div>
    </button>
  );
}
