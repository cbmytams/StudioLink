import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/auth/AuthProvider';
import { useMyApplications } from '@/hooks/useApplications';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useProProfile } from '@/hooks/useProfile';
import { profileService } from '@/services/profileService';

export default function ProDashboard() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const userId = session?.user?.id;
  const { data: applications = [] } = useMyApplications(userId);
  const { unreadCount } = useUnreadCount(userId);
  const { data: proProfile } = useProProfile(userId);

  const pending = applications.filter((item) => item.status === 'pending').length;
  const selected = applications.filter((item) => item.status === 'selected').length;
  const rejected = applications.filter((item) => item.status === 'rejected').length;
  const completionScore = useMemo(
    () => profileService.calculateProCompletionScore(proProfile ?? {}, profile ?? {}),
    [proProfile, profile],
  );

  return (
    <main className="min-h-screen p-4 pb-24 max-w-4xl mx-auto">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Bonjour {profile?.display_name ?? 'Pro'}</h1>
        <p className="text-sm text-stone-500">{new Date().toLocaleDateString('fr-FR')}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <GlassCard className="p-4">
          <h2 className="text-sm font-semibold mb-2">Mes candidatures</h2>
          <p className="text-xs text-stone-600">En attente: <strong>{pending}</strong></p>
          <p className="text-xs text-emerald-700">Sélectionnées: <strong>{selected}</strong></p>
          <p className="text-xs text-stone-500">Refusées: <strong>{rejected}</strong></p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/pro/applications')}>
            Voir tout
          </Button>
        </GlassCard>

        <GlassCard className="p-4">
          <h2 className="text-sm font-semibold mb-2">Profil</h2>
          <p className="text-xs text-stone-600 mb-2">Complétion: {completionScore}%</p>
          <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
            <div className="h-full bg-orange-500" style={{ width: `${completionScore}%` }} />
          </div>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/pro/settings')}>
            Compléter
          </Button>
        </GlassCard>

        <GlassCard className="p-4">
          <h2 className="text-sm font-semibold mb-2">Missions actives</h2>
          <p className="text-xs text-stone-600">{selected} mission(s) sélectionnée(s).</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/pro/feed')}>
            Ouvrir le feed
          </Button>
        </GlassCard>

        <GlassCard className="p-4">
          <h2 className="text-sm font-semibold mb-2">Activité récente</h2>
          <p className="text-xs text-stone-600">{unreadCount} notification(s) non lue(s).</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/notifications')}>
            Voir les notifications
          </Button>
        </GlassCard>
      </div>
    </main>
  );
}
