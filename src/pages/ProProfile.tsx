import { type KeyboardEvent, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { Button } from '@/components/ui/Button';
import { AvatarUpload } from '@/components/ui/AvatarUpload';
import { portfolioService } from '@/services/portfolioService';
import { useToast } from '@/components/ui/Toast';
import type { PortfolioItem } from '@/types/backend';
import { toUserFacingErrorMessage } from '@/lib/errors/userFacing';

type EditableProfile = {
  full_name?: string | null
  username?: string | null
  bio?: string | null
  city?: string | null
  daily_rate?: number | null
  skills?: string[] | null
  avatar_url?: string | null
  rating_avg?: number | null
  rating_count?: number | null
}

type FieldErrors = {
  fullName?: string
  username?: string
  dailyRate?: string
}

export default function ProProfile() {
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [portfolioTitle, setPortfolioTitle] = useState('');
  const [portfolioDescription, setPortfolioDescription] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [deletingPortfolioId, setDeletingPortfolioId] = useState<string | null>(null);

  useEffect(() => {
    if (!profileData) return;
    setFullName(profileData.full_name ?? '');
    setUsername(profileData.username ?? '');
    setBio(profileData.bio ?? '');
    setCity(profileData.city ?? '');
    setDailyRate(profileData.daily_rate ? String(profileData.daily_rate) : '');
    setSkills(profileData.skills ?? []);
    setAvatarUrl(profileData.avatar_url ?? null);
  }, [profileData]);

  useEffect(() => {
    let active = true;
    const loadPortfolio = async () => {
      if (!user?.id) return;
      try {
        const data = await portfolioService.getPortfolioItems(user.id);
        if (!active) return;
        setPortfolioItems(data);
      } catch {
        // Ignoré: la section portfolio reste facultative.
      }
    };
    void loadPortfolio();
    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

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
      showToast({
        title: 'Session invalide',
        description: 'Reconnecte-toi pour sauvegarder ton profil.',
        variant: 'destructive',
      });
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
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', user.id);

      if (updateError) {
        const message = toUserFacingErrorMessage(updateError, 'Impossible de sauvegarder le profil');
        setError(message);
        showToast({
          title: 'Sauvegarde impossible',
          description: message,
          variant: 'destructive',
        });
        return;
      }

      setSuccessMessage('Profil mis à jour ✓');
      showToast({ title: 'Profil mis à jour', variant: 'default' });
      setIsEditing(false);
      await refreshProfile();
    } catch (saveError) {
      const message = toUserFacingErrorMessage(saveError, 'Impossible de sauvegarder le profil');
      setError(message);
      showToast({
        title: 'Sauvegarde impossible',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddPortfolioItem = async () => {
    if (!user?.id) return;
    if (!portfolioTitle.trim()) {
      setError('Titre du projet requis');
      showToast({
        title: 'Validation',
        description: 'Titre du projet requis',
        variant: 'destructive',
      });
      return;
    }
    if (portfolioDescription.length > 200) {
      setError('Description trop longue (200 caractères max)');
      showToast({
        title: 'Validation',
        description: 'Description trop longue (200 caractères max)',
        variant: 'destructive',
      });
      return;
    }
    if (portfolioUrl.trim() && !/^https?:\/\//i.test(portfolioUrl.trim())) {
      setError("L'URL du portfolio doit commencer par http:// ou https://");
      showToast({
        title: 'Validation',
        description: "L'URL du portfolio doit commencer par http:// ou https://",
        variant: 'destructive',
      });
      return;
    }
    if (portfolioItems.length >= 6) {
      setError('Maximum 6 items portfolio');
      showToast({
        title: 'Limite atteinte',
        description: 'Maximum 6 items portfolio',
        variant: 'destructive',
      });
      return;
    }

    setPortfolioLoading(true);
    setError(null);
    try {
      const data = await portfolioService.addPortfolioItem(
        user.id,
        portfolioTitle.trim(),
        portfolioDescription,
        portfolioUrl,
      );

      setPortfolioItems((prev) => [data, ...prev]);
      setPortfolioTitle('');
      setPortfolioDescription('');
      setPortfolioUrl('');
      showToast({ title: 'Projet ajouté au portfolio', variant: 'default' });
    } catch (portfolioError) {
      const message = toUserFacingErrorMessage(portfolioError, "Impossible d'ajouter cet élément portfolio");
      setError(message);
      showToast({
        title: 'Ajout impossible',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setPortfolioLoading(false);
    }
  };

  const handleDeletePortfolioItem = async (itemId: string) => {
    const item = portfolioItems.find((portfolioItem) => portfolioItem.id === itemId);
    if (!window.confirm(`Retirer "${item?.title ?? 'ce projet'}" du portfolio ?`)) {
      return;
    }

    setDeletingPortfolioId(itemId);
    try {
      await portfolioService.deletePortfolioItem(itemId);
      setPortfolioItems((prev) => prev.filter((item) => item.id !== itemId));
      showToast({ title: 'Projet retiré du portfolio', variant: 'default' });
    } catch (portfolioError) {
      const message = toUserFacingErrorMessage(portfolioError, "Impossible de supprimer cet élément portfolio");
      setError(message);
      showToast({
        title: 'Suppression impossible',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeletingPortfolioId(null);
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
    'w-full glass-input rounded-xl px-4 py-3 text-stone-900 placeholder:text-stone-400';

  const hasAnyInfo = Boolean(
    bio.trim() ||
    city.trim() ||
    dailyRate.trim() ||
    skills.length > 0,
  );

  return (
    <div className="app-shell">
      <Helmet>
        <title>Mon profil — StudioLink</title>
        <meta name="description" content="Gérez votre profil professionnel sur StudioLink." />
      </Helmet>
      <div className="app-container-compact">
        <button
          type="button"
          onClick={() => navigate('/pro/dashboard')}
          className="mb-6 text-sm app-muted transition-colors hover:text-black"
        >
          ← Dashboard
        </button>

        <header className="app-header items-start mb-5">
          <div className="flex items-center gap-3">
            <AvatarUpload
              currentUrl={avatarUrl}
              fallbackLetter={fullName.trim().charAt(0) || profileData?.full_name?.charAt(0) || '?'}
              userId={user?.id ?? ''}
              onUploadSuccess={(newUrl) => {
                setAvatarUrl(newUrl);
                void refreshProfile();
              }}
            />
            <div>
              <h1 className="text-xl font-semibold">{fullName || profileData?.full_name || 'Profil Pro'}</h1>
              <p className="text-sm text-black/50">@{username || profileData?.username || 'username'}</p>
              {typeof profileData?.rating_avg === 'number' && (profileData.rating_count ?? 0) > 0 ? (
                <div id="profile-rating" className="mt-1 flex items-center gap-2 text-sm text-orange-600">
                  <span>
                    {'★'.repeat(Math.max(1, Math.round(profileData.rating_avg)))}
                    {'☆'.repeat(Math.max(0, 5 - Math.round(profileData.rating_avg)))}
                  </span>
                  <span className="text-black/60">
                    {profileData.rating_avg.toFixed(1)} ({profileData.rating_count ?? 0} avis)
                  </span>
                </div>
              ) : null}
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
              className="rounded-xl bg-white/70 px-3 py-2 text-sm text-black/80 transition hover:bg-white"
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
                    setAvatarUrl(profileData.avatar_url ?? null);
                  }
                }}
                className="rounded-xl bg-white/70 px-3 py-2 text-sm text-black/70 transition hover:bg-white"
              >
                Annuler
              </button>
              <Button
                disabled={saving}
                onClick={() => void handleSave()}
                className="bg-orange-500 text-white hover:bg-orange-600"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white inline-block mr-2" />
                    Sauvegarde...
                  </>
                ) : (
                  'Sauvegarder'
                )}
              </Button>
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
                  <section className="app-card-soft p-4">
                    <h2 className="mb-2 text-sm font-semibold text-black/80">Bio</h2>
                    <p className="text-sm text-black/70">{bio}</p>
                  </section>
                ) : null}

                {city.trim() ? (
                  <section className="app-card-soft p-4">
                    <h2 className="mb-2 text-sm font-semibold text-black/80">Ville</h2>
                    <p className="text-sm text-black/70">{city}</p>
                  </section>
                ) : null}

                {dailyRate.trim() ? (
                  <section className="app-card-soft p-4">
                    <h2 className="mb-2 text-sm font-semibold text-black/80">Tarif journalier</h2>
                    <p className="text-sm text-black/70">{dailyRate}€/j</p>
                  </section>
                ) : null}

                {skills.length > 0 ? (
                  <section className="app-card-soft p-4">
                    <h2 className="mb-2 text-sm font-semibold text-black/80">Compétences</h2>
                    <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                        <span key={skill} className="app-chip">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                ) : null}
              </>
            ) : (
              <p className="text-black/45 text-sm">
                Profil incomplet. Clique sur &quot;Modifier&quot; pour le compléter.
              </p>
            )
          ) : (
            <section className="app-card-soft p-4 space-y-4">
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
                      <span key={skill} className="inline-flex items-center gap-2 app-chip">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="text-black/60 hover:text-black"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
                <p className="mt-2 text-xs text-black/45">{skills.length}/10 compétences</p>
              </div>

              {error ? <p className="text-red-400 text-sm">{error}</p> : null}
            </section>
          )}

          <section className="app-card-soft p-4">
            <h2 className="mb-2 text-sm font-semibold text-black/80">Mon portfolio</h2>
            <p className="text-xs app-muted mb-3">{portfolioItems.length}/6 éléments</p>

            {portfolioItems.length < 6 ? (
              <div className="space-y-2">
                <input
                  value={portfolioTitle}
                  onChange={(event) => setPortfolioTitle(event.target.value)}
                  placeholder="Titre du projet"
                  className={baseInputClass}
                />
                <textarea
                  rows={3}
                  maxLength={200}
                  value={portfolioDescription}
                  onChange={(event) => setPortfolioDescription(event.target.value)}
                  placeholder="Description (optionnel, 200 caractères max)"
                  className={baseInputClass}
                />
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(event) => setPortfolioUrl(event.target.value)}
                  placeholder="https://..."
                  className={baseInputClass}
                />
                <Button
                  className="bg-orange-500 text-white hover:bg-orange-600"
                  disabled={portfolioLoading}
                  onClick={() => void handleAddPortfolioItem()}
                >
                  {portfolioLoading ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center">Maximum 6 projets atteint</p>
            )}

            <div className="mt-4 space-y-2">
              {portfolioItems.length === 0 ? (
                <p className="text-sm app-muted">Aucun élément portfolio.</p>
              ) : (
                portfolioItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-white/50 p-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      {item.description ? (
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      ) : null}
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-500 text-xs mt-1 block hover:underline"
                        >
                          Voir le projet →
                        </a>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      disabled={deletingPortfolioId === item.id}
                      onClick={() => void handleDeletePortfolioItem(item.id)}
                      className="text-gray-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Retirer du portfolio"
                    >
                      {deletingPortfolioId === item.id ? '…' : '×'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
