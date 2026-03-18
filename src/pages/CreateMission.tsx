import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/auth/AuthProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Textarea } from '@/components/ui/Textarea';
import { FileUpload } from '@/components/FileUpload';
import { useCreateMission } from '@/hooks/useMissions';
import type { MissionStatus } from '@/types/backend';

const CATEGORIES = [
  'Musique',
  'Podcast',
  'Voix-off',
  'Jingle',
  'Sound Design',
  'Post-prod',
  'Autre',
];

const DURATIONS = ['1 heure', 'Demi-journée', 'Journée', 'Plusieurs jours'];

function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="text-4xl">{emoji}</span>
      <p className="text-sm leading-relaxed text-stone-500">{text}</p>
    </div>
  );
}

export default function CreateMission() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editingId = id;
  const { profile } = useAuth();
  const createMission = useCreateMission(profile?.id);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [duration, setDuration] = useState(DURATIONS[0]);
  const [deadline, setDeadline] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addSkill = () => {
    const value = skillInput.trim();
    if (!value) return;
    if (skills.includes(value)) return;
    setSkills((prev) => [...prev, value].slice(0, 10));
    setSkillInput('');
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (title.trim().length < 5) nextErrors.title = 'Titre minimum 5 caractères.';
    if (description.trim().length < 20) nextErrors.description = 'Description minimum 20 caractères.';
    if (!budget || Number(budget) < 1) nextErrors.budget = 'Budget requis.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (status: MissionStatus) => {
    if (!validate()) return;
    await createMission.mutateAsync({
      service_type: category,
      artist_name: title,
      is_confidential: false,
      genres: skills,
      beat_type: description,
      duration,
      price: `${Number(budget)} €`,
      location: 'Paris',
      expires_at: deadline ? new Date(deadline).toISOString() : null,
      is_urgent: false,
      status,
    });
    navigate('/studio/dashboard', {
      state: {
        toast: status === 'published' ? 'Mission publiée !' : 'Mission enregistrée en brouillon.',
      },
    });
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-4 pb-24">
      <header className="mb-4 flex items-center gap-3">
        <Button variant="icon" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            {editingId ? 'Modifier la mission' : 'Créer une mission'}
          </h1>
          <p className="text-sm text-stone-500">Brief studio vers publication Supabase.</p>
        </div>
      </header>

      <div className="space-y-4">
        <GlassCard className="p-4">
          <h2 className="mb-3 text-base font-semibold">Informations</h2>
          <div className="space-y-3">
            <div>
              <TextInput
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Titre de la mission"
                className="focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
              {errors.title ? <p className="mt-1 text-xs text-red-500">{errors.title}</p> : null}
            </div>

            <label className="block text-xs font-medium text-stone-600">Type</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-white/80 px-3 py-2.5 text-sm text-stone-800 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <div>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Description"
                className="focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
              {errors.description ? <p className="mt-1 text-xs text-red-500">{errors.description}</p> : null}
            </div>

            <div>
              <TextInput
                type="number"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                placeholder="Budget (€)"
                className="focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
              {errors.budget ? <p className="mt-1 text-xs text-red-500">{errors.budget}</p> : null}
            </div>

            <label className="block text-xs font-medium text-stone-600">Durée estimée</label>
            <select
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-white/80 px-3 py-2.5 text-sm text-stone-800 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            >
              {DURATIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <TextInput
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              placeholder="Date souhaitée"
              className="focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <h2 className="mb-3 text-base font-semibold">Compétences requises</h2>
          <div className="flex gap-2">
            <TextInput
              value={skillInput}
              onChange={(event) => setSkillInput(event.target.value)}
              placeholder="Ajouter une compétence"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addSkill();
                }
              }}
              className="focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
            <button
              type="button"
              onClick={addSkill}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-stone-200 bg-white/80"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                {skill}
              </span>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <h2 className="mb-3 text-base font-semibold">Fichiers de référence</h2>
          <FileUpload
            bucket="mission-files"
            accept="audio/*,application/pdf,image/*"
            maxMB={50}
            onUpload={(url) => setFileUrls((prev) => [...prev, url])}
          />
          {fileUrls.length === 0 ? (
            <EmptyState emoji="📎" text="Aucun fichier joint." />
          ) : (
            <ul className="mt-3 space-y-2">
              {fileUrls.map((url) => (
                <li key={url} className="truncate text-xs text-stone-600">
                  {url}
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-[#f4ece4]/90 p-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Button
            variant="ghost"
            className="min-h-[44px] flex-1"
            disabled={createMission.isPending}
            onClick={() => void submit('draft')}
          >
            Brouillon
          </Button>
          <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }} className="flex-1">
            <Button
              className="min-h-[44px] w-full"
              disabled={createMission.isPending}
              onClick={() => void submit('published')}
            >
              Publier
            </Button>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
