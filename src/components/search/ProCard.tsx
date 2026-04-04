import { MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SearchProResult } from '@/lib/search/searchService';
import { Avatar } from '@/components/ui/Avatar';

type ProCardProps = {
  profile: SearchProResult;
  to: string;
};

function getDisplayName(profile: SearchProResult): string {
  return profile.display_name ?? 'Profil pro';
}

export function ProCard({ profile, to }: ProCardProps) {
  const displayName = getDisplayName(profile);
  const visibleSkills = profile.skills.slice(0, 3);
  const roundedRating = typeof profile.rating_avg === 'number' ? Math.round(profile.rating_avg) : 0;

  return (
    <Link
      to={to}
      className="pro-card app-card-soft block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
      data-pro-id={profile.id}
    >
      <div className="flex h-full flex-col gap-4 p-5 text-left">
        <div className="flex items-start gap-3">
          <Avatar
            src={profile.avatar_url}
            name={displayName}
            size="lg"
            className="ring-1 ring-white/10"
          />
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
                className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[var(--text-2xs-plus)] font-medium text-white/75"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto text-right text-xs font-semibold text-orange-200">
          Voir le profil →
        </div>
      </div>
    </Link>
  );
}
