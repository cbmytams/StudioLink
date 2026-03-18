import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { Button } from '@/components/ui/Button';

const CATEGORIES = [
  'Photographie',
  'Vidéo & Montage',
  'Motion Design',
  'Direction Artistique',
  'Illustration',
  'Musique & Son',
  'Rédaction',
  'Social Media',
  'Autre',
] as const;

type StudioProfile = {
  company_name: string | null
}

type Mission = {
  id: string
  title: string
  description: string
  category: string
  mission_type: 'on_site' | 'remote' | 'hybrid'
  budget_min: number | null
  budget_max: number | null
  deadline: string | null
  required_skills: string[] | null
  created_at: string
  studio_id: string
  profiles: StudioProfile | null
}

type MissionRow = {
  id: string
  title: string | null
  description: string | null
  category: string | null
  mission_type: string | null
  budget_min: number | null
  budget_max: number | null
  deadline: string | null
  required_skills: string[] | null
  created_at: string
  studio_id: string
  profiles: StudioProfile | StudioProfile[] | null
}

type MyApplicationRow = {
  mission_id: string
}

function mapMissionType(value: string | null): Mission['mission_type'] {
  if (value === 'on_site' || value === 'hybrid') return value;
  return 'remote';
}

function missionTypeBadgeClass(type: Mission['mission_type']): string {
  if (type === 'on_site') return 'bg-orange-100 text-orange-700 border border-orange-200';
  if (type === 'hybrid') return 'bg-purple-100 text-purple-700 border border-purple-200';
  return 'bg-cyan-100 text-cyan-700 border border-cyan-200';
}

function missionTypeLabel(type: Mission['mission_type']): string {
  if (type === 'on_site') return 'Sur site';
  if (type === 'hybrid') return 'Hybride';
  return 'Remote';
}

function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

function budgetText(mission: Mission): string {
  if (mission.budget_min !== null && mission.budget_max !== null) {
    return `${mission.budget_min}€ – ${mission.budget_max}€/j`;
  }
  if (mission.budget_min !== null) {
    return `À partir de ${mission.budget_min}€/j`;
  }
  return 'Budget non renseigné';
}

export default function ProFeed() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [myApplicationIds, setMyApplicationIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    let active = true;

    const fetchFeed = async () => {
      const userId = session?.user?.id;
      if (!userId) {
        if (!active) return;
        setMissions([]);
        setMyApplicationIds([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const missionColumns: string = `
          id,
          title,
          description,
          category,
          mission_type,
          budget_min,
          budget_max,
          deadline,
          required_skills,
          created_at,
          studio_id,
          profiles:studio_id (
            company_name
          )
        `;
        const fetchByStatus = async (status: string) =>
          supabase
            .from('missions')
            .select(missionColumns)
            .eq('status', status as never)
            .order('created_at', { ascending: false });

        const [publishedResult, selectingResult] = await Promise.all([
          fetchByStatus('published'),
          fetchByStatus('selecting'),
        ]);

        if (publishedResult.error) throw publishedResult.error;
        if (selectingResult.error) throw selectingResult.error;

        let missionRows: MissionRow[] = [
          ...((publishedResult.data ?? []) as unknown as MissionRow[]),
          ...((selectingResult.data ?? []) as unknown as MissionRow[]),
        ];

        if (missionRows.length === 0) {
          const openResult = await fetchByStatus('open');
          if (!openResult.error) {
            missionRows = (openResult.data ?? []) as unknown as MissionRow[];
          }
        }

        missionRows.sort((a, b) => (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));

        const normalizedMissions: Mission[] = (missionRows as unknown as MissionRow[] | null ?? []).map((mission) => {
          const studioProfile = Array.isArray(mission.profiles)
            ? mission.profiles[0] ?? null
            : mission.profiles;

          return {
            id: mission.id,
            title: mission.title ?? 'Mission sans titre',
            description: mission.description ?? '',
            category: mission.category ?? 'Autre',
            mission_type: mapMissionType(mission.mission_type),
            budget_min: mission.budget_min,
            budget_max: mission.budget_max,
            deadline: mission.deadline,
            required_skills: mission.required_skills ?? [],
            created_at: mission.created_at,
            studio_id: mission.studio_id,
            profiles: studioProfile,
          };
        });

        const { data: myApplications, error: myApplicationsError } = await supabase
          .from('applications')
          .select('mission_id')
          .eq('pro_id', userId);

        if (myApplicationsError) throw myApplicationsError;

        if (!active) return;
        setMissions(normalizedMissions);
        setMyApplicationIds((myApplications as MyApplicationRow[] | null ?? []).map((item) => item.mission_id));
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Impossible de charger le feed');
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchFeed();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const filteredMissions = useMemo(
    () =>
      missions.filter((mission) => {
        if (filterCategory && mission.category !== filterCategory) return false;
        if (filterType && mission.mission_type !== filterType) return false;
        return true;
      }),
    [filterCategory, filterType, missions],
  );

  const profileName = (profile as { full_name?: string | null; username?: string | null; display_name?: string | null } | null);
  const greetingName =
    profileName?.full_name ??
    profileName?.username ??
    profileName?.display_name ??
    'Pro';

  if (loading) {
    return (
      <div className="app-shell">
        <div className="app-container flex min-h-screen items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-container">
        <header className="mb-5">
          <h1 className="app-title">Bonjour, {greetingName} 👋</h1>
          <p className="app-subtitle">{filteredMissions.length} mission(s) disponible(s)</p>
        </header>

        {error ? <p className="text-red-400 text-center mb-4">{error}</p> : null}

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            value={filterCategory}
            onChange={(event) => setFilterCategory(event.target.value)}
            className="w-full glass-input rounded-xl px-4 py-3 text-stone-900"
          >
            <option value="" className="bg-[#f4ece4] text-stone-500">
              Toutes catégories
            </option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category} className="bg-[#f4ece4] text-stone-900">
                {category}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
            className="w-full glass-input rounded-xl px-4 py-3 text-stone-900"
          >
            <option value="" className="bg-[#f4ece4] text-stone-500">
              Tous types
            </option>
            <option value="remote" className="bg-[#f4ece4] text-stone-900">Remote</option>
            <option value="on_site" className="bg-[#f4ece4] text-stone-900">Sur site</option>
            <option value="hybrid" className="bg-[#f4ece4] text-stone-900">Hybride</option>
          </select>
        </div>

        {!error && missions.length === 0 ? (
          <p className="app-empty-state">Aucune mission disponible pour l&apos;instant.</p>
        ) : null}

        {!error && missions.length > 0 && filteredMissions.length === 0 ? (
          <p className="app-empty-state">Aucune mission ne correspond à tes filtres.</p>
        ) : null}

        <div className="flex flex-col gap-4">
          {filteredMissions.map((mission) => {
            const alreadyApplied = myApplicationIds.includes(mission.id);
            const visibleSkills = (mission.required_skills ?? []).slice(0, 3);
            const remainingSkills = Math.max((mission.required_skills ?? []).length - 3, 0);

            return (
              <article
                key={mission.id}
                className="app-card p-5 transition-transform duration-150 hover:-translate-y-0.5"
                onClick={() => navigate(`/mission/${mission.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold text-lg">{mission.title}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${missionTypeBadgeClass(mission.mission_type)}`}>
                    {missionTypeLabel(mission.mission_type)}
                  </span>
                </div>

                <p className="mt-1 text-sm app-muted">{mission.profiles?.company_name ?? 'Studio inconnu'}</p>

                <div className="mt-2">
                  <span className="app-chip">{mission.category}</span>
                </div>

                <p className="text-sm text-black/70 mt-2">{truncate(mission.description || '')}</p>
                <p className="text-sm text-orange-700 mt-2">{budgetText(mission)}</p>
                {mission.deadline ? (
                  <p className="text-xs text-black/45 mt-1">
                    Deadline : {new Date(mission.deadline).toLocaleDateString('fr-FR')}
                  </p>
                ) : null}

                {(mission.required_skills ?? []).length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visibleSkills.map((skill) => (
                      <span key={skill} className="app-chip">
                        {skill}
                      </span>
                    ))}
                    {remainingSkills > 0 ? (
                      <span className="app-chip text-black/55">
                        +{remainingSkills} autres
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-4">
                  {alreadyApplied ? (
                    <span className="text-green-400 text-sm">✓ Candidature envoyée</span>
                  ) : (
                    <Button
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/mission/${mission.id}`);
                      }}
                      className="bg-orange-500 text-white hover:bg-orange-600"
                    >
                      Postuler →
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
