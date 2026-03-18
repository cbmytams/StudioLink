import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useMission } from '@/hooks/useMissions';
import { useMissionApplications, useUpdateApplicationStatus } from '@/hooks/useApplications';
import { useUpdateMissionStatus } from '@/hooks/useMissions';
import type { ApplicationStatus } from '@/types/backend';

const FILTERS: Array<{ key: ApplicationStatus | 'all'; label: string }> = [
  { key: 'all', label: 'Toutes' },
  { key: 'pending', label: 'En attente' },
  { key: 'selected', label: 'Retenues' },
  { key: 'rejected', label: 'Refusées' },
];

export default function ManageApplications() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: mission } = useMission(id);
  const { data: applications = [], isLoading } = useMissionApplications(id);
  const updateApplication = useUpdateApplicationStatus();
  const updateMissionStatus = useUpdateMissionStatus();
  const [activeFilter, setActiveFilter] = useState<ApplicationStatus | 'all'>('all');

  const filteredApplications = useMemo(
    () => (activeFilter === 'all'
      ? applications
      : applications.filter((application) => application.status === activeFilter)),
    [activeFilter, applications],
  );

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

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setActiveFilter(filter.key)}
            className={`flex min-h-[44px] flex-shrink-0 items-center rounded-full px-3 text-xs font-medium transition-colors ${
              activeFilter === filter.key
                ? 'bg-orange-500 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      ) : filteredApplications.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-stone-500">Aucune candidature reçue sur cette mission.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filteredApplications.map((application) => (
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
