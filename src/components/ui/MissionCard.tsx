import { useNavigate } from 'react-router-dom';
import { GlassCard } from './GlassCard';
import { Badge } from './Badge';
import { CountdownTimer } from './CountdownTimer';
import { MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Mission {
  id: string;
  isUrgent: boolean;
  serviceType: string;
  artistName: string;
  isConfidential: boolean;
  genres: string[];
  beatType?: string;
  duration: string;
  price: string;
  location: string;
  candidatesCount: number;
  expiresAt: Date | string | number;
  createdAt: Date | string | number;
  status?: string;
}

interface MissionCardProps {
  mission: Mission;
}

const SERVICE_COLORS: Record<string, string> = {
  "Enregistrement voix": "bg-purple-500/10 text-purple-700 border-purple-500/20",
  "Mixage": "bg-cyan-500/10 text-cyan-700 border-cyan-500/20",
  "Mastering": "bg-blue-500/10 text-blue-700 border-blue-500/20",
  "Beatmaking": "bg-amber-500/10 text-amber-700 border-amber-500/20",
  "Toplining": "bg-pink-500/10 text-pink-700 border-pink-500/20",
  "Instrumentation": "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  "Arrangement": "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
  "Direction artistique": "bg-rose-500/10 text-rose-700 border-rose-500/20",
};

export function MissionCard({ mission }: MissionCardProps) {
  const navigate = useNavigate();

  return (
    <GlassCard 
      className="p-5 flex flex-col gap-3 cursor-pointer hover:bg-white/50 transition-colors relative overflow-hidden"
      onClick={() => navigate(`/pro/mission/${mission.id}`)}
    >
      {mission.isUrgent && (
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
      )}
      
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-2 items-start">
          {mission.isUrgent && (
            <Badge variant="error" className="text-[10px] py-0.5 px-2">URGENT</Badge>
          )}
          <span className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full border",
            SERVICE_COLORS[mission.serviceType] || "bg-black/5 text-black border-black/10"
          )}>
            {mission.serviceType}
          </span>
        </div>
        <CountdownTimer expiresAt={mission.expiresAt} />
      </div>

      <div>
        <h3 className="text-lg font-semibold">
          {mission.isConfidential ? "Confidentiel 🔒" : mission.artistName}
        </h3>
        <p className="text-sm text-black/60 mt-0.5">
          {mission.genres.join(', ')} {mission.beatType ? `· ${mission.beatType}` : ''}
        </p>
        <p className="text-sm font-medium mt-1">
          {mission.duration} · <span className="text-black">{mission.price}</span>
        </p>
      </div>

      <div className="flex justify-between items-center mt-2 pt-3 border-t border-black/5">
        <div className="flex items-center gap-1.5 text-xs text-black/50">
          <MapPin size={14} />
          {mission.location}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-black/50">
          <Users size={14} />
          {mission.candidatesCount} candidat{mission.candidatesCount > 1 ? 's' : ''}
        </div>
      </div>
    </GlassCard>
  );
}
