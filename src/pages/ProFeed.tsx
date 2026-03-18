import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/auth/AuthProvider';
import { Button as GradientButton } from '@/components/ui/Button';
import Navbar from '@/components/layout/Navbar';

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
  if (type === 'on_site') return 'bg-orange-500/20 text-orange-300 border border-orange-400/30';
  if (type === 'hybrid') return 'bg-violet-500/20 text-violet-300 border border-violet-400/30';
  return 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30';
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

  const [applyingTo, setApplyingTo] = useState<Mission | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

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
        const { data: missionRows, error: missionError } = await supabase
          .from('missions')
          .select(missionColumns)
          .eq('status', 'open' as never)
          .order('created_at', { ascending: false });

        if (missionError) throw missionError;

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

  const openApplyModal = (mission: Mission) => {
    setApplyingTo(mission);
    setApplyError(null);
    setCoverLetter('');
    setProposedRate('');
  };

  const closeApplyModal = () => {
    setApplyingTo(null);
    setApplyError(null);
    setCoverLetter('');
    setProposedRate('');
  };

  const handleApply = async () => {
    const userId = session?.user?.id;
    if (!applyingTo || !userId) return;

    setApplyLoading(true);
    setApplyError(null);

    try {
      const { error: insertError } = await supabase
        .from('applications')
        .insert({
          mission_id: applyingTo.id,
          pro_id: userId,
          status: 'pending',
          cover_letter: coverLetter.trim() || null,
          proposed_rate: proposedRate ? Number(proposedRate) : null,
          created_at: new Date().toISOString(),
        } as never);

      if (insertError) {
        setApplyError(insertError.message);
        return;
      }

      setMyApplicationIds((prev) => (prev.includes(applyingTo.id) ? prev : [...prev, applyingTo.id]));
      closeApplyModal();
    } catch (submitError) {
      setApplyError(submitError instanceof Error ? submitError.message : "Impossible d'envoyer la candidature");
    } finally {
      setApplyLoading(false);
    }
  };

  const profileName = (profile as { full_name?: string | null; username?: string | null; display_name?: string | null } | null);
  const greetingName =
    profileName?.full_name ??
    profileName?.username ??
    profileName?.display_name ??
    'Pro';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] text-white">
        <Navbar />
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 pt-4 pb-8">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-8">
        <header className="mb-5">
          <h1 className="text-2xl font-semibold">Bonjour, {greetingName} 👋</h1>
          <p className="text-sm text-white/60">{filteredMissions.length} mission(s) disponible(s)</p>
        </header>

        {error ? <p className="text-red-400 text-center mb-4">{error}</p> : null}

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            value={filterCategory}
            onChange={(event) => setFilterCategory(event.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
          >
            <option value="" className="bg-[#0D0D0F]">
              Toutes catégories
            </option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category} className="bg-[#0D0D0F]">
                {category}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
          >
            <option value="" className="bg-[#0D0D0F]">
              Tous types
            </option>
            <option value="remote" className="bg-[#0D0D0F]">Remote</option>
            <option value="on_site" className="bg-[#0D0D0F]">Sur site</option>
            <option value="hybrid" className="bg-[#0D0D0F]">Hybride</option>
          </select>
        </div>

        {!error && missions.length === 0 ? (
          <p className="text-center text-white/40 py-10">Aucune mission disponible pour l&apos;instant.</p>
        ) : null}

        {!error && missions.length > 0 && filteredMissions.length === 0 ? (
          <p className="text-center text-white/40 py-10">Aucune mission ne correspond à tes filtres.</p>
        ) : null}

        <div className="flex flex-col gap-4">
          {filteredMissions.map((mission) => {
            const alreadyApplied = myApplicationIds.includes(mission.id);
            const visibleSkills = (mission.required_skills ?? []).slice(0, 3);
            const remainingSkills = Math.max((mission.required_skills ?? []).length - 3, 0);

            return (
              <article
                key={mission.id}
                className="bg-white/5 border border-white/10 rounded-xl p-5"
                onClick={() => navigate(`/pro/missions/${mission.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold text-lg">{mission.title}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${missionTypeBadgeClass(mission.mission_type)}`}>
                    {missionTypeLabel(mission.mission_type)}
                  </span>
                </div>

                <p className="mt-1 text-sm text-white/50">{mission.profiles?.company_name ?? 'Studio inconnu'}</p>

                <div className="mt-2">
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{mission.category}</span>
                </div>

                <p className="text-sm text-white/70 mt-2">{truncate(mission.description || '')}</p>
                <p className="text-sm text-violet-300 mt-2">{budgetText(mission)}</p>
                {mission.deadline ? (
                  <p className="text-xs text-white/40 mt-1">
                    Deadline : {new Date(mission.deadline).toLocaleDateString('fr-FR')}
                  </p>
                ) : null}

                {(mission.required_skills ?? []).length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visibleSkills.map((skill) => (
                      <span key={skill} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/85">
                        {skill}
                      </span>
                    ))}
                    {remainingSkills > 0 ? (
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/60">
                        +{remainingSkills} autres
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-4">
                  {alreadyApplied ? (
                    <span className="text-green-400 text-sm">✓ Candidature envoyée</span>
                  ) : (
                    <GradientButton
                      className="bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:opacity-95"
                      onClick={(event) => {
                        event.stopPropagation();
                        openApplyModal(mission);
                      }}
                    >
                      Postuler →
                    </GradientButton>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {applyingTo ? (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm px-4">
          <div className="mx-auto mt-24 w-full max-w-lg rounded-2xl border border-white/10 bg-[#1a1a2e] p-6">
            <h3 className="text-xl font-semibold">{applyingTo.title}</h3>
            <p className="mt-1 text-sm text-white/60">Envoie ta candidature au studio</p>

            <textarea
              rows={4}
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
              placeholder="Décris pourquoi tu es le bon profil..."
              className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-violet-400"
            />

            <input
              type="number"
              value={proposedRate}
              onChange={(event) => setProposedRate(event.target.value)}
              placeholder="Ton tarif journalier (€)"
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-violet-400"
            />

            {applyError ? <p className="text-red-400 text-sm mt-3">{applyError}</p> : null}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeApplyModal}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
              >
                Annuler
              </button>
              <GradientButton
                disabled={applyLoading}
                onClick={() => void handleApply()}
                className="bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:opacity-95"
              >
                {applyLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white inline-block mr-2" />
                    Envoi...
                  </>
                ) : (
                  'Envoyer ma candidature'
                )}
              </GradientButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
