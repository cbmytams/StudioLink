import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { FileUpload } from '@/components/shared/FileUpload';
import { useToast } from '@/components/ui/Toast';
import type { MissionFileRecord } from '@/types/backend';
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
          .select('*')
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
      } catch {
        if (!active) return;
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

  const submitLabel = useMemo(() => {
    if (saving) return isEdit ? 'Enregistrement en cours…' : 'Création en cours…';
    return isEdit ? 'Enregistrer les modifications' : 'Créer la mission';
  }, [isEdit, saving]);
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
        status,
      });

      if (isEdit && id) {
        const { error: updateError } = await supabase
          .from('missions')
          .update(payload as never)
          .eq('id', id)
          .eq('studio_id', userId);

        if (updateError) throw updateError;
        showToast({
          title: 'Mission enregistrée',
          description: 'Les modifications ont été sauvegardées.',
          variant: 'default',
        });
      } else {
        const { data: insertedMission, error: insertError } = await supabase
          .from('missions')
          .insert(payload as never)
          .select('id')
          .single();

        if (insertError) throw insertError;
        const createdMissionId = (insertedMission as { id: string } | null)?.id;
        if (!createdMissionId) {
          throw new Error('Mission créée sans identifiant exploitable.');
        }

        showToast({
          title: 'Mission créée',
          description: 'Ajoute des fichiers de référence si besoin, puis reviens au dashboard.',
          variant: 'default',
        });
        navigate(`/studio/missions/${createdMissionId}/edit`, { replace: true });
      }
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
          onClick={() => navigate('/studio/dashboard')}
          className="mb-4 text-sm app-muted transition-colors hover:text-black"
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
          <form id="mission-form" onSubmit={handleSubmit} className="app-card p-5 space-y-4">
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
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              {fieldErrors.title ? <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p> : null}
            </div>

            <div>
              <label htmlFor="mission-description" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Description *
              </label>
              <textarea
                id="mission-description"
                rows={4}
                maxLength={2000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              {fieldErrors.description ? <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p> : null}
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

            <div>
              <label htmlFor="mission-category" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Catégorie *
              </label>
              <select
                id="mission-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
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
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              {fieldErrors.location ? <p className="text-xs text-red-500 mt-1">{fieldErrors.location}</p> : null}
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
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
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
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
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
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                {fieldErrors.end_date ? <p className="text-xs text-red-500 mt-1">{fieldErrors.end_date}</p> : null}
              </div>
            </div>

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
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              {fieldErrors.daily_rate ? <p className="text-xs text-red-500 mt-1">{fieldErrors.daily_rate}</p> : null}
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
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:bg-stone-100 disabled:text-stone-400"
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
            </div>
          </form>
        )}
      </div>

      <div className="fixed bottom-20 left-0 right-0 z-40 border-t border-black/5 bg-[#f4ece4] p-4 pb-safe md:static md:mt-6 md:border-t-0 md:bg-transparent md:p-0">
        <div className="mx-auto max-w-2xl md:px-0">
          {error ? (
            <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            form="mission-form"
            disabled={saving || loadingMission || !isFormReady}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-2xl transition-colors"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
