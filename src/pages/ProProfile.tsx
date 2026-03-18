import { type KeyboardEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/auth/AuthProvider';
import { Button as GradientButton } from '@/components/ui/Button';
import Navbar from '@/components/layout/Navbar';

type EditableProfile = {
  full_name?: string | null
  username?: string | null
  bio?: string | null
  city?: string | null
  daily_rate?: number | null
  skills?: string[] | null
}

type FieldErrors = {
  fullName?: string
  username?: string
  dailyRate?: string
}

export default function ProProfile() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();

  const user = session?.user ?? null;
  const profileData = (profile ?? null) as EditableProfile | null;

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [dailyRate, setDailyRate] = useState<string>('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (!profileData) return;
    setFullName(profileData.full_name ?? '');
    setUsername(profileData.username ?? '');
    setBio(profileData.bio ?? '');
    setCity(profileData.city ?? '');
    setDailyRate(profileData.daily_rate ? String(profileData.daily_rate) : '');
    setSkills(profileData.skills ?? []);
  }, [profileData]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const validate = (): boolean => {
    const nextFieldErrors: FieldErrors = {};

    if (!fullName.trim()) {
      nextFieldErrors.fullName = 'Le nom complet est requis';
    }

    if (!username.trim()) {
      nextFieldErrors.username = "Le nom d'utilisateur est requis";
    } else if (username.trim().length < 3) {
      nextFieldErrors.username = 'Minimum 3 caractères';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      nextFieldErrors.username = 'Lettres, chiffres et _ uniquement';
    }

    if (dailyRate.trim() !== '') {
      const parsed = Number(dailyRate);
      if (Number.isNaN(parsed) || parsed <= 0) {
        nextFieldErrors.dailyRate = 'Tarif journalier invalide';
      }
    }

    setFieldErrors(nextFieldErrors);
    const firstError = Object.values(nextFieldErrors)[0] ?? null;
    setError(firstError);
    return Object.keys(nextFieldErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user) {
      setError('Session invalide. Reconnecte-toi.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    if (!validate()) return;

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          username: username.trim(),
          bio: bio.trim() || null,
          city: city.trim() || null,
          daily_rate: dailyRate ? Number(dailyRate) : null,
          skills,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccessMessage('Profil mis à jour ✓');
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Impossible de sauvegarder le profil');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    const value = skillInput.trim();
    if (!value) return;
    if (skills.length >= 10) return;
    if (skills.includes(value)) {
      setSkillInput('');
      return;
    }
    setSkills((prev) => [...prev, value]);
    setSkillInput('');
  };

  const handleSkillKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addSkill();
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((item) => item !== skill));
  };

  const baseInputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/45 focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400';

  const hasAnyInfo = Boolean(
    bio.trim() ||
    city.trim() ||
    dailyRate.trim() ||
    skills.length > 0,
  );

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">
        <button
          type="button"
          onClick={() => navigate('/pro/dashboard')}
          className="mb-6 text-sm text-white/70 transition-colors hover:text-white"
        >
          ← Dashboard
        </button>

        <header className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-lg font-semibold">
              {fullName.trim().charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-xl font-semibold">{fullName || profileData?.full_name || 'Profil Pro'}</h1>
              <p className="text-sm text-white/55">@{username || profileData?.username || 'username'}</p>
            </div>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setError(null);
                setSuccessMessage(null);
                setFieldErrors({});
              }}
              className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white/90 transition hover:bg-white/15"
            >
              Modifier le profil
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setError(null);
                  setSuccessMessage(null);
                  setFieldErrors({});
                  if (profileData) {
                    setFullName(profileData.full_name ?? '');
                    setUsername(profileData.username ?? '');
                    setBio(profileData.bio ?? '');
                    setCity(profileData.city ?? '');
                    setDailyRate(profileData.daily_rate ? String(profileData.daily_rate) : '');
                    setSkills(profileData.skills ?? []);
                  }
                }}
                className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
              >
                Annuler
              </button>
              <GradientButton
                disabled={saving}
                onClick={() => void handleSave()}
                className="bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:opacity-95"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white inline-block mr-2" />
                    Sauvegarde...
                  </>
                ) : (
                  'Sauvegarder'
                )}
              </GradientButton>
            </div>
          )}
        </header>

        {successMessage ? (
          <p className="text-green-400 text-sm text-center mb-4">{successMessage}</p>
        ) : null}
        {error && !isEditing ? (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        ) : null}

        <div className="space-y-4">
          {!isEditing ? (
            hasAnyInfo ? (
              <>
                {bio.trim() ? (
                  <section className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h2 className="mb-2 text-sm font-semibold text-white/85">Bio</h2>
                    <p className="text-sm text-white/75">{bio}</p>
                  </section>
                ) : null}

                {city.trim() ? (
                  <section className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h2 className="mb-2 text-sm font-semibold text-white/85">Ville</h2>
                    <p className="text-sm text-white/75">{city}</p>
                  </section>
                ) : null}

                {dailyRate.trim() ? (
                  <section className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h2 className="mb-2 text-sm font-semibold text-white/85">Tarif journalier</h2>
                    <p className="text-sm text-white/75">{dailyRate}€/j</p>
                  </section>
                ) : null}

                {skills.length > 0 ? (
                  <section className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h2 className="mb-2 text-sm font-semibold text-white/85">Compétences</h2>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/85"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                ) : null}
              </>
            ) : (
              <p className="text-white/40 text-sm">
                Profil incomplet. Clique sur &quot;Modifier&quot; pour le compléter.
              </p>
            )
          ) : (
            <section className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
              <div>
                <input
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                    if (error) setError(null);
                  }}
                  placeholder="Nom complet"
                  className={baseInputClass}
                />
                {fieldErrors.fullName ? (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.fullName}</p>
                ) : null}
              </div>

              <div>
                <input
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    if (fieldErrors.username) setFieldErrors((prev) => ({ ...prev, username: undefined }));
                    if (error) setError(null);
                  }}
                  placeholder="Nom d'utilisateur"
                  className={baseInputClass}
                />
                {fieldErrors.username ? (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.username}</p>
                ) : null}
              </div>

              <div>
                <textarea
                  rows={3}
                  value={bio}
                  maxLength={300}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Bio (max 300 caractères)"
                  className={baseInputClass}
                />
              </div>

              <div>
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Ville"
                  className={baseInputClass}
                />
              </div>

              <div>
                <input
                  type="number"
                  value={dailyRate}
                  onChange={(event) => {
                    setDailyRate(event.target.value);
                    if (fieldErrors.dailyRate) setFieldErrors((prev) => ({ ...prev, dailyRate: undefined }));
                    if (error) setError(null);
                  }}
                  placeholder="Tarif journalier (€)"
                  className={baseInputClass}
                />
                {fieldErrors.dailyRate ? (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.dailyRate}</p>
                ) : null}
              </div>

              <div>
                <input
                  value={skillInput}
                  onChange={(event) => setSkillInput(event.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="Ajouter une compétence (Entrée)"
                  className={baseInputClass}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/85"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-white/70 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-white/50">{skills.length}/10 compétences</p>
              </div>

              {error ? <p className="text-red-400 text-sm">{error}</p> : null}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
