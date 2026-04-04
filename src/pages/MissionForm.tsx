import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { handleAuthError } from '@/lib/auth/handleAuthError';
import { useAuth } from '@/lib/supabase/auth';
import { FileUpload } from '@/components/shared/FileUpload';
import { useToast } from '@/components/ui/Toast';
import { useMobileFixedBottomStyle } from '@/hooks/useVisualViewport';
import type { MissionFileRecord } from '@/types/backend';
import type { Database } from '@/types/supabase';
import { trackMissionCreated } from '@/lib/analytics/events';
import { deleteFile, getMissionFiles, uploadMissionFile } from '@/lib/files/fileService';
import {
  buildMissionWritePayload,
  normalizeMissionStatus,
} from '@/lib/missions/phase1Compat';

const CATEGORIES = [
  'Photo',
  'Vidéo',
  'Son',
  'Lumière',
  'Régie',
  'Maquillage',
  'Costume',
  'Direction artistique',
  'Autre',
] as const;

type FormStatus = 'open' | 'closed' | 'draft';

type MissionRecord = {
  title?: string | null
  description?: string | null
  category?: string | null
  service_type?: string | null
  location?: string | null
  city?: string | null
  date?: string | null
  end_date?: string | null
  daily_rate?: number | null
  price?: string | null
  skills_required?: string[] | null
  skills?: string[] | null
  required_skills?: string[] | null
  genres?: string[] | null
  status?: string | null
};

const MISSION_FORM_SELECT_COLUMNS =
  'id, studio_id, title, description, category, service_type, location, city, date, end_date, daily_rate, price, skills_required, skills, required_skills, genres, status';

type FieldErrors = Partial<Record<
  'title' | 'description' | 'category' | 'location' | 'date' | 'daily_rate' | 'end_date',
  string
>>;

function parseLegacyRate(value: number | string | null | undefined): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'string') {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 0) {
      return String(Number.parseInt(digits, 10));
    }
  }
  return '';
}

function normalizeFormStatus(status: string | null | undefined): FormStatus {
  const normalized = normalizeMissionStatus(status ?? null);
  if (normalized === 'draft') return 'draft';
  if (normalized === 'open') return 'open';
  return 'closed';
}

export default function MissionForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { session } = useAuth();
  const { showToast } = useToast();
  const mobileFooterStyle = useMobileFixedBottomStyle(64);
  const isEdit = Boolean(id);
  const userId = session?.user?.id ?? null;
  const activeMissionId = id ?? null;

  const [loadingMission, setLoadingMission] = useState(isEdit);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [referenceFiles, setReferenceFiles] = useState<MissionFileRecord[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [missionDate, setMissionDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [status, setStatus] = useState<FormStatus>('open');
  const [skillInput, setSkillInput] = useState('');
  const [skillsRequired, setSkillsRequired] = useState<string[]>([]);
  const submitIntentRef = useRef<FormStatus | null>(null);

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
        const { data, error: fetchError } = await supabase
          .from('missions')
          .select(MISSION_FORM_SELECT_COLUMNS)
          .eq('id', id)
          .eq('studio_id', userId)
          .maybeSingle();

        if (!active) return;
        if (fetchError) throw fetchError;
        if (!data) {
          setError('Mission introuvable ou accès non autorisé.');
          return;
        }

        const mission = data as MissionRecord;
        setTitle(mission.title ?? '');
        setDescription(mission.description ?? '');
        setCategory(mission.category ?? mission.service_type ?? '');
        setLocation(mission.location ?? mission.city ?? '');
        setCity(mission.city ?? '');
        setMissionDate(mission.date ?? '');
        setEndDate(mission.end_date ?? '');
        setDailyRate(parseLegacyRate(mission.daily_rate ?? mission.price));
        setSkillsRequired(
          mission.skills_required
          ?? mission.skills
          ?? mission.required_skills
          ?? mission.genres
          ?? [],
        );
        setStatus(normalizeFormStatus(mission.status));
      } catch (fetchMissionError) {
        if (!active) return;
        setError(
          fetchMissionError instanceof Error
            ? fetchMissionError.message
            : 'Impossible de charger la mission.',
        );
      } finally {
        if (active) setLoadingMission(false);
      }
    };

    void fetchMission();

    return () => {
      active = false;
    };
  }, [id, isEdit, userId]);

  useEffect(() => {
    let active = true;

    const loadFiles = async () => {
      if (!activeMissionId) {
        if (!active) return;
        setReferenceFiles([]);
        setLoadingFiles(false);
        return;
      }

      setLoadingFiles(true);
      try {
        const files = await getMissionFiles(activeMissionId);
        if (!active) return;
        setReferenceFiles(files);
      } catch (loadFilesError) {
        if (!active) return;
        console.error('[MissionForm] loadFiles failed:', loadFilesError);
        setReferenceFiles([]);
      } finally {
        if (active) setLoadingFiles(false);
      }
    };

    void loadFiles();

    return () => {
      active = false;
    };
  }, [activeMissionId]);

  const addSkill = () => {
    const nextSkill = skillInput.trim().replace(/,$/, '');
    if (!nextSkill || skillsRequired.length >= 10) return;
    if (skillsRequired.some((existing) => existing.toLowerCase() === nextSkill.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setSkillsRequired((prev) => [...prev, nextSkill]);
    setSkillInput('');
  };

  const removeSkill = (skillToRemove: string) => {
    setSkillsRequired((prev) => prev.filter((skill) => skill !== skillToRemove));
  };

  const onSkillInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' && event.key !== ',') return;
    event.preventDefault();
    addSkill();
  };

  const validateForm = (): boolean => {
    const nextErrors: FieldErrors = {};

    if (!title.trim()) nextErrors.title = 'Le titre est requis.';
    if (!description.trim()) nextErrors.description = 'La description est requise.';
    if (!category.trim()) nextErrors.category = 'La catégorie est requise.';
    if (!location.trim()) nextErrors.location = 'Le lieu est requis.';
    if (!missionDate) nextErrors.date = 'La date est requise.';
    if (missionDate) {
      const selectedDate = new Date(`${missionDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!Number.isNaN(selectedDate.getTime()) && selectedDate < today) {
        nextErrors.date = 'La date ne peut pas être passée.';
      }
    }

    if (!dailyRate.trim()) {
      nextErrors.daily_rate = 'Le tarif journalier est requis.';
    } else {
      const parsedRate = Number(dailyRate);
      if (Number.isNaN(parsedRate) || parsedRate <= 0) {
        nextErrors.daily_rate = 'Tarif invalide.';
      }
    }

    if (missionDate && endDate && new Date(endDate) < new Date(missionDate)) {
      nextErrors.end_date = 'La date de fin doit être postérieure à la date de mission.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const publishLabel = useMemo(() => {
    if (saving) return 'Publication…';
    return isEdit ? 'Mettre à jour et publier' : 'Publier la mission';
  }, [isEdit, saving]);
  const draftLabel = useMemo(() => {
    if (saving) return 'Sauvegarde…';
    return isEdit ? 'Enregistrer en brouillon' : 'Sauvegarder en brouillon';
  }, [isEdit, saving]);
  const statusLabel = useMemo(() => {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'closed':
        return 'Fermée';
      default:
        return 'Publiée';
    }
  }, [status]);
  const isFormReady = Boolean(
    title.trim()
    && description.trim()
    && category.trim()
    && location.trim()
    && missionDate
    && dailyRate.trim()
    && !fieldErrors.end_date,
  );

  const handleReferenceUpload = async (file: File) => {
    if (!activeMissionId) {
      throw new Error('Crée d’abord la mission avant d’ajouter des fichiers.');
    }

    const uploaded = await uploadMissionFile(activeMissionId, file);
    setReferenceFiles((previous) => [uploaded, ...previous.filter((entry) => entry.id !== uploaded.id)]);
  };

  const handleReferenceDelete = async (file: MissionFileRecord) => {
    await deleteFile(file.id, 'mission-files', file.file_url);
    setReferenceFiles((previous) => previous.filter((entry) => entry.id !== file.id));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!userId) {
      setError('Session expirée. Reconnecte-toi pour continuer.');
      return;
    }

    if (!validateForm()) return;

    const nextStatus = submitIntentRef.current ?? status;
    submitIntentRef.current = null;
    setSaving(true);

    try {
      const payload = buildMissionWritePayload({
        studioId: userId,
        title,
        description,
        category,
        location,
        city,
        date: missionDate,
        endDate,
        dailyRate,
        skillsRequired,
        status: nextStatus,
      });
      setStatus(nextStatus);

      if (isEdit && id) {
        const updatePayload: Database['public']['Tables']['missions']['Update'] = payload;
        const { error: updateError } = await supabase
          .from('missions')
          .update(updatePayload)
          .eq('id', id)
          .eq('studio_id', userId);

        if (updateError) throw updateError;
        showToast({
          title: 'Mission enregistrée',
          description: 'Les modifications ont été sauvegardées.',
          variant: 'default',
        });
      } else {
        const insertPayload: Database['public']['Tables']['missions']['Insert'] = payload;
        const { data: insertedMission, error: insertError } = await supabase
          .from('missions')
          .insert(insertPayload)
          .select('id')
          .single();

        if (insertError) throw insertError;
        const createdMissionId = (insertedMission as { id: string } | null)?.id;
        if (!createdMissionId) {
          throw new Error('Mission créée sans identifiant exploitable.');
        }

        const parsedDailyRate = Number.parseInt(dailyRate, 10);
        trackMissionCreated({
          hasDeadline: Boolean(missionDate || endDate),
          skillsCount: skillsRequired.length,
          budgetType: Number.isFinite(parsedDailyRate) && parsedDailyRate > 0 ? 'fixed' : 'negotiable',
        });

        showToast({
          title: 'Mission créée',
          description: 'Ajoute des fichiers de référence si besoin, puis reviens au dashboard.',
          variant: 'default',
        });
        void navigate(`/studio/missions/${createdMissionId}/edit`, { replace: true });
      }
    } catch (submitError) {
      if (await handleAuthError(submitError, navigate)) return;
      setError(submitError instanceof Error ? submitError.message : 'Impossible d’enregistrer la mission.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell min-h-[var(--size-full-dvh)] pb-28">
      <Helmet>
        <title>{isEdit ? 'Modifier la mission — StudioLink' : 'Nouvelle mission — StudioLink'}</title>
        <meta
          name="description"
          content={isEdit
            ? 'Mettez à jour une mission existante.'
            : 'Créez une nouvelle mission pour trouver le bon profil.'}
        />
      </Helmet>
      <div className="app-container-wide">
        <button
          type="button"
          onClick={() => navigate('/studio/dashboard')}
          className="mb-4 inline-flex min-h-[var(--size-touch)] items-center px-1 text-sm app-muted transition-colors hover:text-white"
        >
          ← {isEdit ? 'Retour aux missions' : 'Retour au dashboard'}
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
          <div className="grid gap-6 xl:grid-cols-[var(--layout-side-panel)]">
            <form id="mission-form" onSubmit={handleSubmit} className="app-card p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h1 className="text-2xl font-semibold text-white">
                    {isEdit ? 'Modifier la mission' : 'Créer une nouvelle mission'}
                  </h1>
                  <p className="mt-2 text-sm text-white/60">
                    Prépare un brief dense et publiable, avec les références utiles pour déclencher des candidatures qualifiées.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  <p className="text-[var(--text-2xs-plus)] uppercase tracking-[var(--tracking-caps)] text-white/40">Statut</p>
                  <p className="mt-1 text-base font-semibold text-white">{statusLabel}</p>
                </div>
              </div>

              <div>
                <label htmlFor="mission-title" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Titre *
                </label>
                <input
                  id="mission-title"
                  type="text"
                  maxLength={100}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex: Mixage EP rap 5 titres"
                  className="min-h-[var(--size-touch)] bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-base md:text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                {fieldErrors.title ? <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p> : null}
              </div>

              <div>
                <label htmlFor="mission-description" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Description *
                </label>
                <textarea
                  id="mission-description"
                  rows={5}
                  maxLength={2000}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Décrivez le projet, le contexte, les livrables attendus et votre timeline."
                  className="min-h-[var(--size-touch)] bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-base md:text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                {fieldErrors.description ? <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p> : null}
                <p className="mt-1 text-right text-[var(--text-2xs-plus)] text-gray-400">{description.length}/2000</p>
              </div>

              <FileUpload
                label="Fichiers de référence"
                accept="audio/*,.pdf,.zip"
                maxSizeMb={500}
                onUpload={handleReferenceUpload}
                existingFiles={referenceFiles}
                onDelete={handleReferenceDelete}
                disabled={!activeMissionId}
                helperText={activeMissionId
                  ? 'Références privées visibles uniquement par les candidats et le studio.'
                  : 'Crée la mission une première fois pour activer l’upload des références.'}
              />
              {loadingFiles ? <p className="text-xs text-gray-400">Chargement des fichiers…</p> : null}

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label htmlFor="mission-category" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Catégorie *
                  </label>
                  <select
                    id="mission-category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="min-h-[var(--size-touch)] bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-base md:text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="">Choisir une catégorie</option>
                    {CATEGORIES.map((entry) => (
                      <option key={entry} value={entry}>{entry}</option>
                    ))}
                  </select>
                  {fieldErrors.category ? <p className="text-xs text-red-500 mt-1">{fieldErrors.category}</p> : null}
                </div>

                <div>
                  <label htmlFor="mission-location" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Lieu *
                  </label>
                  <input
                    id="mission-location"
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="min-h-[var(--size-touch)] bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-base md:text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  {fieldErrors.location ? <p className="text-xs text-red-500 mt-1">{fieldErrors.location}</p> : null}
                </div>
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
                  placeholder="Optionnel, sinon la ville reprend le lieu"
                  className="min-h-[var(--size-touch)] bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-base md:text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="mission-date" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Date *
                  </label>
                  <input
                    id="mission-date"
                    type="date"
                    value={missionDate}
                    onChange={(event) => setMissionDate(event.target.value)}
                    className="min-h-[var(--size-touch)] bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-base md:text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  {fieldErrors.date ? <p className="text-xs text-red-500 mt-1">{fieldErrors.date}</p> : null}
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
                    className="min-h-[var(--size-touch)] bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-base md:text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  {fieldErrors.end_date ? <p className="text-xs text-red-500 mt-1">{fieldErrors.end_date}</p> : null}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[var(--layout-form-split)]">
                <div>
                  <label htmlFor="mission-rate" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Tarif journalier (€) *
                  </label>
                  <input
                    id="mission-rate"
                    type="number"
                    min={0}
                    value={dailyRate}
                    onChange={(event) => setDailyRate(event.target.value)}
                    placeholder="ex: 500"
                    className="min-h-[var(--size-touch)] bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-base md:text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  {fieldErrors.daily_rate ? <p className="text-xs text-red-500 mt-1">{fieldErrors.daily_rate}</p> : null}
                </div>

                <div>
                  <label htmlFor="mission-status" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Visibilité
                  </label>
                  <select
                    id="mission-status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as FormStatus)}
                    className="min-h-[var(--size-touch)] bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-base md:text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="open">Ouverte</option>
                    <option value="closed">Fermée</option>
                    <option value="draft">Brouillon</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="mission-skills-input" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Compétences requises
                </label>
                <input
                  id="mission-skills-input"
                  type="text"
                  value={skillInput}
                  disabled={skillsRequired.length >= 10}
                  onChange={(event) => setSkillInput(event.target.value)}
                  onKeyDown={onSkillInputKeyDown}
                  onBlur={addSkill}
                  placeholder={skillsRequired.length >= 10 ? 'Maximum 10 compétences atteint' : 'Ajouter une compétence (Entrée ou ,)'}
                  className="min-h-[var(--size-touch)] bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-base md:text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:bg-stone-100 disabled:text-stone-400"
                />
                {skillsRequired.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skillsRequired.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="inline-flex min-h-[var(--size-touch)] min-w-[var(--size-touch)] items-center justify-center text-orange-500 hover:text-orange-700"
                          aria-label={`Retirer ${skill}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </form>

            <aside className="hidden xl:block">
              <div className="sticky top-8 space-y-4">
                <section className="app-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-[var(--tracking-caps)] text-white/40">Checklist mission</p>
                  <div className="mt-4 space-y-3 text-sm text-white/70">
                    <div className="flex items-center justify-between gap-3">
                      <span>Titre et brief</span>
                      <span className={title.trim() && description.trim() ? 'text-green-300' : 'text-white/35'}>
                        {title.trim() && description.trim() ? 'Prêt' : 'À compléter'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Dates et budget</span>
                      <span className={missionDate && dailyRate.trim() ? 'text-green-300' : 'text-white/35'}>
                        {missionDate && dailyRate.trim() ? 'Prêt' : 'À compléter'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Références</span>
                      <span className="text-white/45">
                        {referenceFiles.length > 0 ? `${referenceFiles.length} fichier${referenceFiles.length > 1 ? 's' : ''}` : 'Optionnel'}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="app-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-[var(--tracking-caps)] text-white/40">Actions</p>
                  {error ? (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                      {error}
                    </div>
                  ) : null}
                  <div className="mt-4 space-y-3">
                    <button
                      type="submit"
                      form="mission-form"
                      onClick={() => {
                        submitIntentRef.current = 'open';
                      }}
                      disabled={saving || loadingMission || !isFormReady}
                      className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
                    >
                      {publishLabel}
                    </button>
                    <button
                      type="submit"
                      form="mission-form"
                      onClick={() => {
                        submitIntentRef.current = 'draft';
                      }}
                      disabled={saving || loadingMission}
                      className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white/75 transition hover:bg-white/10 disabled:opacity-50"
                    >
                      {draftLabel}
                    </button>
                    <p className="text-xs leading-5 text-white/45">
                      Le brouillon garde la mission privée. La publication la rend visible dans le feed pro sans étape supplémentaire.
                    </p>
                  </div>
                </section>
              </div>
            </aside>
          </div>
        )}
      </div>

      <div
        className="fixed bottom-[var(--safe-offset-nav)] left-0 right-0 z-40 border-t border-black/5 bg-[var(--color-surface-soft)] p-4 pb-safe xl:hidden"
        style={mobileFooterStyle}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3 md:px-0">
          {error ? (
            <div className="flex-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            form="mission-form"
            onClick={() => {
              submitIntentRef.current = 'draft';
            }}
            disabled={saving || loadingMission}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
          >
            {draftLabel}
          </button>
          <button
            type="submit"
            form="mission-form"
            onClick={() => {
              submitIntentRef.current = 'open';
            }}
            disabled={saving || loadingMission || !isFormReady}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-2xl transition-colors"
          >
            {publishLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
