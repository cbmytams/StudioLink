import { type FormEvent, type KeyboardEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { Button as GradientButton } from '@/components/ui/Button';

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

export default function CreateMission() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [missionType, setMissionType] = useState<'on_site' | 'remote' | 'hybrid'>('remote');

  const [budgetMin, setBudgetMin] = useState<string>('');
  const [budgetMax, setBudgetMax] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const baseInputClass =
    'w-full glass-input rounded-xl px-4 py-3 text-stone-900 placeholder:text-stone-400';

  const validateStepOne = () => {
    if (!title.trim()) {
      setError('Le titre est requis');
      return false;
    }
    if (title.trim().length < 5) {
      setError('Titre trop court (5 caractères min)');
      return false;
    }
    if (!description.trim()) {
      setError('La description est requise');
      return false;
    }
    if (description.trim().length < 20) {
      setError('Description trop courte (20 caractères min)');
      return false;
    }
    if (!category) {
      setError('La catégorie est requise');
      return false;
    }
    return true;
  };

  const validateStepTwo = () => {
    if (budgetMin !== '' && Number.isNaN(Number(budgetMin))) {
      setError('Budget min invalide');
      return false;
    }
    if (budgetMax !== '' && Number.isNaN(Number(budgetMax))) {
      setError('Budget max invalide');
      return false;
    }
    if (
      budgetMin !== '' &&
      budgetMax !== '' &&
      Number(budgetMin) > Number(budgetMax)
    ) {
      setError('Le budget min ne peut pas être supérieur au budget max');
      return false;
    }
    if (deadline) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadlineDate = new Date(deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      if (deadlineDate < today) {
        setError('La deadline doit être dans le futur');
        return false;
      }
    }
    return true;
  };

  const handleAddSkill = () => {
    const value = skillInput.trim();
    if (!value) return;
    if (requiredSkills.length >= 10) return;
    if (requiredSkills.includes(value)) {
      setSkillInput('');
      return;
    }
    setRequiredSkills((prev) => [...prev, value]);
    setSkillInput('');
  };

  const handleSkillKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    handleAddSkill();
  };

  const handleNext = () => {
    setError(null);
    if (!validateStepOne()) return;
    setStep(2);
  };

  const handleBack = () => {
    setError(null);
    setStep(1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 1) {
      handleNext();
      return;
    }

    setError(null);
    if (!validateStepTwo()) return;

    const userId = session?.user?.id;
    if (!userId) {
      setError('Session expirée. Reconnecte-toi.');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string | number | null | string[]> = {
        studio_id: userId,
        title: title.trim(),
        description: description.trim(),
        category,
        mission_type: missionType,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        deadline: deadline || null,
        required_skills: requiredSkills,
        status: 'open',
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('missions')
        .insert(payload as never);

      if (insertError) {
        setError(insertError.message);
        return;
      }

      navigate('/studio/dashboard');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Une erreur est survenue';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4ece4] text-[#1a1a1a]">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <button
          type="button"
          onClick={() => navigate('/studio/dashboard')}
          className="mb-6 text-sm text-black/60 transition-colors hover:text-black"
        >
          ← Retour au dashboard
        </button>

        <div className="bg-white/60 border border-white/50 rounded-2xl p-6">
          <div className="w-full h-1 bg-black/10 rounded-full mb-6">
            <div
              className="h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-300"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
          <p className="text-black/45 text-sm mb-4">Étape {step} sur 2</p>

          <h1 className="text-2xl font-semibold mb-1">Créer une mission</h1>
          <p className="text-sm text-black/55 mb-6">
            {step === 1 ? 'Renseigne les informations principales' : 'Ajoute les conditions de mission'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Titre de la mission"
                  className={baseInputClass}
                />

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Description de la mission"
                  rows={4}
                  className={baseInputClass}
                />

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-3 text-stone-900"
                >
                  <option value="" className="bg-[#f4ece4] text-stone-500">
                    Choisir une catégorie
                  </option>
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item} className="bg-[#f4ece4] text-stone-900">
                      {item}
                    </option>
                  ))}
                </select>

                <div>
                  <p className="mb-2 text-sm text-black/60">Type de mission</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'on_site' as const, label: 'Sur place' },
                      { key: 'remote' as const, label: 'Remote' },
                      { key: 'hybrid' as const, label: 'Hybride' },
                    ].map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setMissionType(option.key)}
                        className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                          missionType === option.key
                            ? 'bg-orange-500 text-white'
                            : 'bg-white/70 text-black/70 hover:bg-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    value={budgetMin}
                    onChange={(event) => setBudgetMin(event.target.value)}
                    placeholder="Budget min (€)"
                    className={baseInputClass}
                    inputMode="numeric"
                  />
                  <input
                    value={budgetMax}
                    onChange={(event) => setBudgetMax(event.target.value)}
                    placeholder="Budget max (€)"
                    className={baseInputClass}
                    inputMode="numeric"
                  />
                </div>

                <input
                  type="date"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                  className={baseInputClass}
                />

                <div>
                  <input
                    value={skillInput}
                    onChange={(event) => setSkillInput(event.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    placeholder="Ajouter une compétence (Entrée)"
                    className={baseInputClass}
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    {requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-3 py-1 text-xs text-black/80"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() =>
                            setRequiredSkills((prev) => prev.filter((item) => item !== skill))
                          }
                          className="text-black/60 hover:text-black"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-black/45">{requiredSkills.length}/10 compétences</p>
                </div>
              </>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              {step === 2 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm text-black/80 transition hover:bg-white"
                >
                  ← Retour
                </button>
              )}
              <GradientButton
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-orange-400 to-orange-600 text-white hover:opacity-95"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white inline-block mr-2" />
                    Création...
                  </>
                ) : step === 1 ? (
                  'Suivant →'
                ) : (
                  'Créer la mission →'
                )}
              </GradientButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
