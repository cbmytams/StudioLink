import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';

type StudioProfile = {
  id: string
  full_name: string | null
  company_name: string | null
  avatar_url: string | null
  bio: string | null
};

type Mission = {
  id: string
  title: string
  description: string | null
  city: string | null
  daily_rate: number | null
  budget_min: number | null
  budget_max: number | null
  skills: string[]
  start_date: string | null
  end_date: string | null
  status: string
  studio: StudioProfile | null
};

type MissionPrimaryRow = {
  id: string
  title: string
  description: string | null
  city: string | null
  daily_rate: number | null
  skills: string[] | null
  start_date: string | null
  end_date: string | null
  status: string | null
  profiles: StudioProfile | StudioProfile[] | null
};

type MissionFallbackRow = {
  id: string
  title: string
  description: string | null
  location: string | null
  budget_min: number | null
  budget_max: number | null
  required_skills: string[] | null
  start_date: string | null
  deadline: string | null
  status: string | null
  profiles: StudioProfile | StudioProfile[] | null
};

type Application = {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
};

type ApplicationRow = {
  id: string
  status: string | null
  created_at: string
};

function normalizeApplicationStatus(status: string | null): Application['status'] {
  if (status === 'accepted' || status === 'selected') return 'accepted';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

function asSingle<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('fr-FR');
}

export default function MissionDetail() {
  const { id, missionId } = useParams<{ id?: string; missionId?: string }>();
  const targetMissionId = id ?? missionId ?? '';
  const navigate = useNavigate();
  const { session } = useAuth();

  const [mission, setMission] = useState<Mission | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchMissionAndApplication = async () => {
      if (!targetMissionId) {
        if (!active) return;
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setNotFound(false);
      setError(null);
      setApplyError(null);

      try {
        let normalizedMission: Mission | null = null;

        const primarySelect = `
          id, title, description, city, daily_rate, skills, start_date, end_date, status,
          profiles:studio_id (id, full_name, company_name, avatar_url, bio)
        `;
        const primaryResult = await supabase
          .from('missions')
          .select(primarySelect)
          .eq('id', targetMissionId)
          .maybeSingle();

        if (!primaryResult.error && primaryResult.data) {
          const row = primaryResult.data as unknown as MissionPrimaryRow;
          normalizedMission = {
            id: row.id,
            title: row.title,
            description: row.description,
            city: row.city,
            daily_rate: row.daily_rate,
            budget_min: null,
            budget_max: null,
            skills: row.skills ?? [],
            start_date: row.start_date,
            end_date: row.end_date,
            status: row.status ?? 'open',
            studio: asSingle(row.profiles),
          };
        } else {
          const fallbackSelect = `
            id, title, description, location, budget_min, budget_max, required_skills, start_date, deadline, status,
            profiles:studio_id (id, full_name, company_name, avatar_url, bio)
          `;
          const fallbackResult = await supabase
            .from('missions')
            .select(fallbackSelect)
            .eq('id', targetMissionId)
            .maybeSingle();

          if (fallbackResult.error) throw fallbackResult.error;
          if (fallbackResult.data) {
            const row = fallbackResult.data as unknown as MissionFallbackRow;
            normalizedMission = {
              id: row.id,
              title: row.title,
              description: row.description,
              city: row.location,
              daily_rate: row.budget_min,
              budget_min: row.budget_min,
              budget_max: row.budget_max,
              skills: row.required_skills ?? [],
              start_date: row.start_date,
              end_date: row.deadline,
              status: row.status ?? 'open',
              studio: asSingle(row.profiles),
            };
          }
        }

        if (!active) return;

        if (!normalizedMission) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setMission(normalizedMission);

        const userId = session?.user?.id;
        if (userId) {
          const { data: existingApplication, error: applicationError } = await supabase
            .from('applications')
            .select('id, status, created_at')
            .eq('mission_id', targetMissionId)
            .eq('pro_id', userId)
            .maybeSingle();

          if (!active) return;
          if (applicationError) throw applicationError;

          const existing = existingApplication as ApplicationRow | null;
          if (existing) {
            setApplication({
              id: existing.id,
              status: normalizeApplicationStatus(existing.status),
              created_at: existing.created_at,
            });
          } else {
            setApplication(null);
          }
        } else {
          setApplication(null);
        }
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Impossible de charger la mission.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchMissionAndApplication();

    return () => {
      active = false;
    };
  }, [session?.user?.id, targetMissionId]);

  const handleApply = async () => {
    if (!targetMissionId) return;
    if (!session?.user?.id) {
      navigate('/login');
      return;
    }

    setApplying(true);
    setApplyError(null);

    const { data, error: insertError } = await supabase
      .from('applications')
      .insert({
        mission_id: targetMissionId,
        pro_id: session.user.id,
        status: 'pending',
      } as never)
      .select('id, status, created_at')
      .single();

    if (insertError) {
      setApplyError(insertError.message);
    } else {
      const inserted = data as unknown as ApplicationRow;
      setApplication({
        id: inserted.id,
        status: normalizeApplicationStatus(inserted.status),
        created_at: inserted.created_at,
      });
    }

    setApplying(false);
  };

  const missionMeta = useMemo(() => {
    if (!mission) return null;
    const tokens: string[] = [];
    if (mission.city) tokens.push(`📍 ${mission.city}`);

    if (mission.daily_rate !== null) {
      tokens.push(`💰 ${mission.daily_rate} €/j`);
    } else if (mission.budget_min !== null && mission.budget_max !== null) {
      tokens.push(`💰 ${mission.budget_min}€ – ${mission.budget_max}€/j`);
    } else if (mission.budget_min !== null) {
      tokens.push(`💰 À partir de ${mission.budget_min} €/j`);
    }

    const startDate = formatDate(mission.start_date);
    const endDate = formatDate(mission.end_date);
    if (startDate) tokens.push(`📅 ${startDate}`);
    if (endDate) tokens.push(`→ ${endDate}`);

    return tokens;
  }, [mission]);

  if (loading) {
    return (
      <div className="app-shell min-h-screen pb-28">
        <div className="animate-pulse space-y-4 pt-6 px-4 max-w-2xl mx-auto">
          <div className="h-7 bg-gray-200 rounded w-3/4" />
          <div className="flex items-center gap-3 mt-2">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-full mt-6" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
          <div className="h-3 bg-gray-200 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (notFound || !mission) {
    return (
      <div className="app-shell min-h-screen pb-28">
        <div className="app-container-compact">
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 text-sm">Cette mission n&apos;existe pas ou n&apos;est plus disponible.</p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-orange-500 text-sm hover:underline mt-2 block mx-auto"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen pb-28">
      <Helmet>
        <title>{`${mission.title} — StudioLink`}</title>
        <meta
          name="description"
          content={mission.description ? mission.description.slice(0, 160) : 'Détail mission StudioLink'}
        />
        <meta property="og:title" content={`${mission.title} — StudioLink`} />
        <meta
          property="og:description"
          content={mission.description ? mission.description.slice(0, 160) : 'Découvrez cette mission sur StudioLink.'}
        />
      </Helmet>
      <div className="app-container-compact">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <span>←</span> Retour
        </button>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}

        <section className="app-card p-5">
          <h1 className="text-2xl font-bold text-gray-900">{mission.title}</h1>

          <div className="flex items-center gap-2 mt-2">
            {mission.studio?.avatar_url ? (
              <img
                src={mission.studio.avatar_url}
                alt={mission.studio.full_name ?? mission.studio.company_name ?? 'Studio'}
                className="h-8 w-8 rounded-full object-cover border border-white/50"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                <span className="text-xs font-bold text-orange-600">
                  {(mission.studio?.company_name ?? mission.studio?.full_name ?? 'S').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm text-gray-600 font-medium">
              {mission.studio?.company_name ?? mission.studio?.full_name ?? 'Studio'}
            </span>
          </div>

          {missionMeta && missionMeta.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500">
              {missionMeta.map((token) => (
                <span key={token} className={token.includes('💰') ? 'text-orange-500 font-medium' : ''}>
                  {token}
                </span>
              ))}
            </div>
          ) : null}

          <section className="mt-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</h2>
            {mission.description ? (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {mission.description}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">Aucune description.</p>
            )}
          </section>

          {mission.skills.length > 0 ? (
            <section className="mt-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Compétences recherchées
              </h2>
              <div className="flex flex-wrap gap-2">
                {mission.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-orange-50 text-orange-600 text-xs px-2 py-0.5 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">À propos du studio</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {mission.studio?.bio ?? '—'}
            </p>
          </section>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-[#f4ece4] border-t border-black/5">
        <div className="mx-auto max-w-2xl">
          {!application ? (
            <>
              <button
                type="button"
                onClick={() => void handleApply()}
                disabled={applying}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-2xl transition-colors"
              >
                {applying ? 'Envoi en cours…' : 'Postuler à cette mission'}
              </button>
              {applyError ? (
                <p className="mt-2 text-xs text-red-500 text-center">{applyError}</p>
              ) : null}
            </>
          ) : null}

          {application?.status === 'pending' ? (
            <div className="w-full bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm font-medium py-3 rounded-2xl text-center">
              ⏳ Candidature envoyée · En attente
            </div>
          ) : null}

          {application?.status === 'accepted' ? (
            <div className="w-full bg-green-50 border border-green-200 text-green-700 text-sm font-medium py-3 rounded-2xl text-center">
              ✓ Candidature acceptée
            </div>
          ) : null}

          {application?.status === 'rejected' ? (
            <div className="w-full bg-red-50 border border-red-200 text-red-500 text-sm font-medium py-3 rounded-2xl text-center">
              ✗ Candidature refusée
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
