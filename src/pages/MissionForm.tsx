import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';

type FormStatus = 'open' | 'closed' | 'draft';

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
};

type MissionFallbackRow = {
  id: string
  title: string
  description: string | null
  location: string | null
  budget_min: number | null
  required_skills: string[] | null
  start_date: string | null
  deadline: string | null
  status: string | null
};

type FieldErrors = Partial<Record<
  'title' | 'description' | 'daily_rate' | 'end_date' | 'status',
  string
>>;

function normalizeFormStatus(status: string | null): FormStatus {
  if (status === 'draft') return 'draft';
  if (status === 'open' || status === 'published' || status === 'selecting') return 'open';
  return 'closed';
}

function mapLegacyStatus(status: FormStatus): string {
  if (status === 'open') return 'published';
  if (status === 'closed') return 'cancelled';
  return 'draft';
}

export default function MissionForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { session } = useAuth();
  const isEdit = Boolean(id);
  const userId = session?.user?.id ?? null;

  const [loadingMission, setLoadingMission] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<FormStatus>('open');

  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    const fetchMission = async () => {
      if (!isEdit || !id) {
        setLoadingMission(false);
        return;
      }
      if (!userId) {
        if (!active) return;
        setError('Session expirée. Reconnecte-toi pour modifier une mission.');
        setLoadingMission(false);
        return;
      }

      setLoadingMission(true);
      setError(null);

      try {
        const primarySelect = 'id, title, description, city, daily_rate, skills, start_date, end_date, status';
        const primaryResult = await supabase
          .from('missions')
          .select(primarySelect)
          .eq('id', id)
          .eq('studio_id', userId)
          .maybeSingle();

        if (!active) return;

        if (!primaryResult.error && primaryResult.data) {
          const mission = primaryResult.data as unknown as MissionPrimaryRow;
          setTitle(mission.title ?? '');
          setDescription(mission.description ?? '');
          setCity(mission.city ?? '');
          setDailyRate(mission.daily_rate !== null ? String(mission.daily_rate) : '');
          setStartDate(mission.start_date ?? '');
          setEndDate(mission.end_date ?? '');
          setSkills(mission.skills ?? []);
          setStatus(normalizeFormStatus(mission.status));
          return;
        }

        const fallbackSelect = 'id, title, description, location, budget_min, required_skills, start_date, deadline, status';
        const fallbackResult = await supabase
          .from('missions')
          .select(fallbackSelect)
          .eq('id', id)
          .eq('studio_id', userId)
          .maybeSingle();

        if (!active) return;
        if (fallbackResult.error) throw fallbackResult.error;
        if (!fallbackResult.data) {
          setError('Mission introuvable ou accès non autorisé.');
          return;
        }

        const mission = fallbackResult.data as unknown as MissionFallbackRow;
        setTitle(mission.title ?? '');
        setDescription(mission.description ?? '');
        setCity(mission.location ?? '');
        setDailyRate(mission.budget_min !== null ? String(mission.budget_min) : '');
        setStartDate(mission.start_date ?? '');
        setEndDate(mission.deadline ?? '');
        setSkills(mission.required_skills ?? []);
        setStatus(normalizeFormStatus(mission.status));
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Impossible de charger la mission.');
      } finally {
        if (active) setLoadingMission(false);
      }
    };

    void fetchMission();

    return () => {
      active = false;
    };
  }, [id, isEdit, userId]);

  const addSkill = () => {
    const nextSkill = skillInput.trim().replace(/,$/, '');
    if (!nextSkill || skills.length >= 10) return;
    if (skills.some((existing) => existing.toLowerCase() === nextSkill.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setSkills((prev) => [...prev, nextSkill]);
    setSkillInput('');
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((skill) => skill !== skillToRemove));
  };

  const onSkillInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' && event.key !== ',') return;
    event.preventDefault();
    addSkill();
  };

  const validateForm = (): boolean => {
    const nextErrors: FieldErrors = {};
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      nextErrors.title = 'Le titre est requis.';
    } else if (trimmedTitle.length > 100) {
      nextErrors.title = 'Maximum 100 caractères.';
    }

    if (trimmedDescription.length > 2000) {
      nextErrors.description = 'Maximum 2000 caractères.';
    }

    if (dailyRate.trim()) {
      const parsedRate = Number(dailyRate);
      if (Number.isNaN(parsedRate) || parsedRate < 0) {
        nextErrors.daily_rate = 'Tarif invalide.';
      }
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      nextErrors.end_date = 'La date de fin doit être après la date de début.';
    }

    if (!status) {
      nextErrors.status = 'Le statut est requis.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitLabel = useMemo(() => {
    if (saving) return isEdit ? 'Enregistrement en cours…' : 'Publication en cours…';
    return isEdit ? 'Enregistrer les modifications' : 'Publier la mission';
  }, [isEdit, saving]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!userId) {
      setError('Session expirée. Reconnecte-toi pour continuer.');
      return;
    }
    if (!validateForm()) return;

    setSaving(true);

    const preferredPayload = {
      title: title.trim(),
      description: description.trim() || null,
      city: city.trim() || null,
      daily_rate: dailyRate.trim() ? Number(dailyRate) : null,
      skills,
      start_date: startDate || null,
      end_date: endDate || null,
      status,
    } as const;

    const fallbackPayload = {
      title: title.trim(),
      description: description.trim() || null,
      location: city.trim() || null,
      budget_min: dailyRate.trim() ? Number(dailyRate) : null,
      required_skills: skills,
      start_date: startDate || null,
      deadline: endDate || null,
      status: mapLegacyStatus(status),
    } as const;

    try {
      if (isEdit && id) {
        const preferredUpdate = await supabase
          .from('missions')
          .update(preferredPayload as never)
          .eq('id', id)
          .eq('studio_id', userId);

        if (preferredUpdate.error) {
          const fallbackUpdate = await supabase
            .from('missions')
            .update(fallbackPayload as never)
            .eq('id', id)
            .eq('studio_id', userId);
          if (fallbackUpdate.error) throw fallbackUpdate.error;
        }
      } else {
        const preferredInsert = await supabase
          .from('missions')
          .insert({ ...preferredPayload, studio_id: userId } as never);

        if (preferredInsert.error) {
          const fallbackInsert = await supabase
            .from('missions')
            .insert({ ...fallbackPayload, studio_id: userId } as never);
          if (fallbackInsert.error) throw fallbackInsert.error;
        }
      }

      navigate('/studio/missions');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Impossible d’enregistrer la mission.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell min-h-screen pb-28">
      <Helmet>
        <title>{isEdit ? 'Modifier la mission — StudioLink' : 'Nouvelle mission — StudioLink'}</title>
        <meta
          name="description"
          content={isEdit
            ? 'Mettez à jour une mission existante.'
            : 'Créez une nouvelle mission pour trouver le bon profil.'}
        />
      </Helmet>
      <div className="app-container-compact">
        <button
          type="button"
          onClick={() => navigate('/studio/missions')}
          className="mb-4 text-sm app-muted transition-colors hover:text-black"
        >
          ← {isEdit ? 'Modifier la mission' : 'Nouvelle mission'}
        </button>

        {loadingMission ? (
          <div className="app-card p-5 animate-pulse space-y-4">
            <div className="h-4 w-1/3 rounded bg-stone-200" />
            <div className="h-10 rounded-xl bg-stone-200" />
            <div className="h-4 w-1/4 rounded bg-stone-200" />
            <div className="h-28 rounded-xl bg-stone-200" />
            <div className="h-10 rounded-xl bg-stone-200" />
          </div>
        ) : (
          <form id="mission-form" onSubmit={handleSubmit} className="app-card p-5 space-y-4">
            <div>
              <label htmlFor="mission-title" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Titre
              </label>
              <input
                id="mission-title"
                type="text"
                maxLength={100}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              {fieldErrors.title ? (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="mission-description" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Description
              </label>
              <textarea
                id="mission-description"
                rows={4}
                maxLength={2000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              {fieldErrors.description ? (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="mission-city" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Ville
              </label>
              <input
                id="mission-city"
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            <div>
              <label htmlFor="mission-rate" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Tarif €/j
              </label>
              <input
                id="mission-rate"
                type="number"
                min={0}
                value={dailyRate}
                onChange={(event) => setDailyRate(event.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              {fieldErrors.daily_rate ? (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.daily_rate}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="mission-start" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Date début
                </label>
                <input
                  id="mission-start"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div>
                <label htmlFor="mission-end" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Date fin
                </label>
                <input
                  id="mission-end"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                {fieldErrors.end_date ? (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.end_date}</p>
                ) : null}
              </div>
            </div>

            <div>
              <label htmlFor="mission-skills-input" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Compétences
              </label>
              <input
                id="mission-skills-input"
                type="text"
                value={skillInput}
                disabled={skills.length >= 10}
                onChange={(event) => setSkillInput(event.target.value)}
                onKeyDown={onSkillInputKeyDown}
                onBlur={addSkill}
                placeholder={skills.length >= 10 ? 'Maximum 10 compétences atteint' : 'Ajouter une compétence (Entrée ou ,)'}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:bg-stone-100 disabled:text-stone-400"
              />
              {skills.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-orange-500 hover:text-orange-700"
                        aria-label={`Retirer ${skill}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <label htmlFor="mission-status" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Statut
              </label>
              <select
                id="mission-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as FormStatus)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="open">Ouverte</option>
                <option value="closed">Fermée</option>
                <option value="draft">Brouillon</option>
              </select>
              {fieldErrors.status ? (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.status}</p>
              ) : null}
            </div>
          </form>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#f4ece4] border-t border-black/5">
        <div className="mx-auto max-w-2xl">
          {error ? (
            <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            form="mission-form"
            disabled={saving || title.trim().length === 0 || loadingMission}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-2xl transition-colors"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
