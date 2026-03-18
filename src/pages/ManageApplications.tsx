import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useMission } from '@/hooks/useMissions';
import { useMissionApplications, useUpdateApplicationStatus } from '@/hooks/useApplications';
import { useUpdateMissionStatus } from '@/hooks/useMissions';

export default function ManageApplications() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: mission } = useMission(id);
  const { data: applications = [], isLoading } = useMissionApplications(id);
  const updateApplication = useUpdateApplicationStatus();
  const updateMissionStatus = useUpdateMissionStatus();

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-4 pb-24">
      <header className="mb-4 flex items-center gap-3">
        <Button variant="icon" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Candidatures mission</h1>
          <p className="text-sm text-stone-500">{mission?.service_type || 'Mission'}</p>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-stone-500">Aucune candidature reçue sur cette mission.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {applications.map((application) => (
            <div key={application.id}>
              <GlassCard className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Pro: {application.pro_id.slice(0, 8)}…</p>
                  <Badge
                    variant={
                      application.status === 'selected'
                        ? 'success'
                        : application.status === 'rejected'
                          ? 'error'
                          : 'warning'
                    }
                  >
                    {application.status}
                  </Badge>
                </div>
                <p className="text-sm text-stone-600">{application.message || 'Sans message'}</p>
                {application.status === 'pending' ? (
                  <div className="mt-3 flex gap-2">
                    <Button
                      className="min-h-[44px]"
                      disabled={updateApplication.isPending}
                      onClick={() => {
                        updateApplication.mutate(
                          { id: application.id, status: 'selected' },
                          {
                            onSuccess: () => {
                              if (id) {
                                updateMissionStatus.mutate({ id, status: 'in_progress' });
                              }
                            },
                          },
                        );
                      }}
                    >
                      Accepter
                    </Button>
                    <Button
                      variant="ghost"
                      className="min-h-[44px]"
                      disabled={updateApplication.isPending}
                      onClick={() => updateApplication.mutate({ id: application.id, status: 'rejected' })}
                    >
                      Refuser
                    </Button>
                  </div>
                ) : null}
              </GlassCard>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
