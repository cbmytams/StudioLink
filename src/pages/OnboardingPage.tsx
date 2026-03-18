import { type KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { TextInput } from '@/components/ui/TextInput';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import type { UserType } from '@/types/backend';
import { profileService } from '@/services/profileService';

type OnboardingType = 'studio' | 'pro';

interface StudioFormState {
  company_name: string;
  website: string;
  bio: string;
  contact_email: string;
  phone: string;
}

interface ProFormState {
  full_name: string;
  username: string;
  bio: string;
  skills: string[];
  city: string;
  daily_rate: string;
}

interface LegacyProfileShape {
  onboarding_completed?: boolean;
  onboarding_complete?: boolean;
  type?: UserType;
  user_type?: UserType;
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { session, profile, loading: authLoading } = useAuth();

  const user = session?.user ?? null;
  const profileData = profile as LegacyProfileShape | null;

  const [invitationType, setInvitationType] = useState<OnboardingType | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillsInput, setSkillsInput] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [studioData, setStudioData] = useState<StudioFormState>({
    company_name: '',
    website: '',
    bio: '',
    contact_email: '',
    phone: '',
  });

  const [proData, setProData] = useState<ProFormState>({
    full_name: '',
    username: '',
    bio: '',
    skills: [],
    city: '',
    daily_rate: '',
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const onboardingCompleted = Boolean(
      profileData?.onboarding_completed ?? profileData?.onboarding_complete,
    );
    if (onboardingCompleted) {
      const currentType = profileData?.user_type ?? profileData?.type;
      navigate(currentType === 'studio' ? '/studio/dashboard' : '/pro/feed', { replace: true });
      return;
    }

    const storedType = sessionStorage.getItem('invitationType');
    if (storedType === 'studio' || storedType === 'pro') {
      setInvitationType(storedType);
      return;
    }

    const fallbackType = profileData?.user_type ?? profileData?.type;
    if (fallbackType === 'studio' || fallbackType === 'pro') {
      setInvitationType(fallbackType);
      return;
    }

    setInvitationType(null);
  }, [authLoading, navigate, profileData, user]);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const canGoBack = step > 1;
  const isConfirmationStep = step === totalSteps;

  const validationMessage = useMemo(() => {
    if (!invitationType) return "Type d'invitation introuvable.";

    if (invitationType === 'studio' && step === 1) {
      if (!studioData.company_name.trim()) return 'Nom du studio requis';
      if (studioData.website.trim() && !studioData.website.trim().startsWith('https://')) {
        return "L'URL doit commencer par https://";
      }
    }

    if (invitationType === 'studio' && step === 2) {
      if (!studioData.contact_email.trim() || !studioData.contact_email.includes('@')) {
        return 'Email de contact invalide';
      }
    }

    if (invitationType === 'pro' && step === 1) {
      if (!proData.full_name.trim()) return 'Nom complet requis';
      if (!proData.username.trim()) return "Nom d'utilisateur requis";
      if (proData.username.trim().length < 3) return 'Minimum 3 caractères';
      if (!/^[a-zA-Z0-9_]+$/.test(proData.username.trim())) {
        return 'Lettres, chiffres et _ uniquement';
      }
    }

    return null;
  }, [invitationType, proData.full_name, proData.username, step, studioData.company_name, studioData.contact_email, studioData.website]);

  const handleNext = () => {
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setError(null);
    setStep((prev) => Math.min(totalSteps, prev + 1));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const addSkill = () => {
    const next = skillsInput.trim();
    if (!next || invitationType !== 'pro') return;
    if (proData.skills.length >= 10) return;
    if (proData.skills.includes(next)) {
      setSkillsInput('');
      return;
    }
    setProData((prev) => ({ ...prev, skills: [...prev.skills, next] }));
    setSkillsInput('');
  };

  const handleSkillKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addSkill();
  };

  const removeSkill = (skill: string) => {
    setProData((prev) => ({ ...prev, skills: prev.skills.filter((item) => item !== skill) }));
  };

  const handleFinalSubmit = async () => {
    if (!user) {
      setError('Session invalide. Reconnecte-toi.');
      return;
    }

    if (!invitationType) {
      setError("Type d'invitation introuvable.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let avatarUrl: string | null = null;
      if (avatarFile) {
        avatarUrl = await profileService.uploadAvatar(user.id, avatarFile);
      }

      const payload: Record<string, string | number | boolean | null | string[]> = {
        id: user.id,
        type: invitationType,
        onboarding_completed: true,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      if (invitationType === 'studio') {
        payload.company_name = studioData.company_name.trim();
        payload.website = studioData.website.trim() || null;
        payload.bio = studioData.bio.trim() || null;
        payload.contact_email = studioData.contact_email.trim();
        payload.phone = studioData.phone.trim() || null;
      } else {
        payload.full_name = proData.full_name.trim();
        payload.username = proData.username.trim();
        payload.bio = proData.bio.trim() || null;
        payload.skills = proData.skills;
        payload.city = proData.city.trim() || null;
        payload.daily_rate = proData.daily_rate.trim() ? Number(proData.daily_rate) : null;
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(payload as never, { onConflict: 'id' });

      if (upsertError) {
        setError(upsertError.message);
        return;
      }

      const invitationCode = sessionStorage.getItem('invitationCode');
      if (invitationCode) {
        await supabase
          .from('invitations')
          .update({ used: true } as never)
          .eq('code', invitationCode);
      }

      sessionStorage.removeItem('invitationCode');
      sessionStorage.removeItem('invitationType');
      sessionStorage.removeItem('invitationEmail');
      navigate(invitationType === 'studio' ? '/studio/dashboard' : '/pro/feed');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Une erreur est survenue.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const renderStudioStep = () => {
    if (step === 1) {
      return (
        <div className="space-y-4">
          <TextInput
            value={studioData.company_name}
            onChange={(event) => setStudioData((prev) => ({ ...prev, company_name: event.target.value }))}
            placeholder="Nom du studio"
            className="text-white placeholder:text-white/45"
          />
          <TextInput
            value={studioData.website}
            onChange={(event) => setStudioData((prev) => ({ ...prev, website: event.target.value }))}
            placeholder="https://mon-studio.com"
            className="text-white placeholder:text-white/45"
          />
          <Textarea
            value={studioData.bio}
            onChange={(event) => setStudioData((prev) => ({ ...prev, bio: event.target.value.slice(0, 300) }))}
            placeholder="Bio du studio (optionnel)"
            className="text-white placeholder:text-white/45"
          />
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          <TextInput
            value={studioData.contact_email}
            onChange={(event) => setStudioData((prev) => ({ ...prev, contact_email: event.target.value }))}
            placeholder="Email de contact"
            className="text-white placeholder:text-white/45"
          />
          <TextInput
            value={studioData.phone}
            onChange={(event) => setStudioData((prev) => ({ ...prev, phone: event.target.value }))}
            placeholder="Téléphone (optionnel)"
            className="text-white placeholder:text-white/45"
          />
        </div>
      );
    }

    return (
      <div className="space-y-3 text-sm text-white/80">
        <p><span className="text-white/60">Nom du studio :</span> {studioData.company_name || '—'}</p>
        <p><span className="text-white/60">Site web :</span> {studioData.website || '—'}</p>
        <p><span className="text-white/60">Bio :</span> {studioData.bio || '—'}</p>
        <p><span className="text-white/60">Email contact :</span> {studioData.contact_email || '—'}</p>
        <p><span className="text-white/60">Téléphone :</span> {studioData.phone || '—'}</p>
        <div className="pt-2">
          <label htmlFor="onboarding-avatar-studio" className="mb-2 block text-xs text-white/60">
            Avatar (optionnel)
          </label>
          <input
            id="onboarding-avatar-studio"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setAvatarFile(nextFile);
              if (avatarPreview) URL.revokeObjectURL(avatarPreview);
              if (nextFile) setAvatarPreview(URL.createObjectURL(nextFile));
              else setAvatarPreview(null);
            }}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white file:mr-2 file:rounded-md file:border-0 file:bg-white/15 file:px-2 file:py-1 file:text-xs file:text-white"
          />
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Aperçu avatar"
              className="mt-2 h-14 w-14 rounded-full object-cover border border-white/20"
            />
          ) : null}
        </div>
      </div>
    );
  };

  const renderProStep = () => {
    if (step === 1) {
      return (
        <div className="space-y-4">
          <TextInput
            value={proData.full_name}
            onChange={(event) => setProData((prev) => ({ ...prev, full_name: event.target.value }))}
            placeholder="Nom complet"
            className="text-white placeholder:text-white/45"
          />
          <TextInput
            value={proData.username}
            onChange={(event) => setProData((prev) => ({ ...prev, username: event.target.value }))}
            placeholder="Nom d'utilisateur"
            className="text-white placeholder:text-white/45"
          />
          <Textarea
            value={proData.bio}
            onChange={(event) => setProData((prev) => ({ ...prev, bio: event.target.value.slice(0, 300) }))}
            placeholder="Bio (optionnel)"
            className="text-white placeholder:text-white/45"
          />
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          <TextInput
            value={skillsInput}
            onChange={(event) => setSkillsInput(event.target.value)}
            onKeyDown={handleSkillKeyDown}
            placeholder="Ajouter une compétence (Entrée)"
            className="text-white placeholder:text-white/45"
          />

          <div className="flex flex-wrap gap-2">
            {proData.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white"
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

          <p className="text-xs text-white/60">{proData.skills.length}/10 compétences</p>

          <TextInput
            value={proData.city}
            onChange={(event) => setProData((prev) => ({ ...prev, city: event.target.value }))}
            placeholder="Ville (optionnel)"
            className="text-white placeholder:text-white/45"
          />
          <TextInput
            type="number"
            value={proData.daily_rate}
            onChange={(event) => setProData((prev) => ({ ...prev, daily_rate: event.target.value }))}
            placeholder="Tarif journalier (optionnel)"
            className="text-white placeholder:text-white/45"
          />
        </div>
      );
    }

    return (
      <div className="space-y-3 text-sm text-white/80">
        <p><span className="text-white/60">Nom complet :</span> {proData.full_name || '—'}</p>
        <p><span className="text-white/60">Username :</span> {proData.username || '—'}</p>
        <p><span className="text-white/60">Bio :</span> {proData.bio || '—'}</p>
        <p><span className="text-white/60">Compétences :</span> {proData.skills.join(', ') || '—'}</p>
        <p><span className="text-white/60">Ville :</span> {proData.city || '—'}</p>
        <p><span className="text-white/60">Tarif :</span> {proData.daily_rate || '—'}</p>
        <div className="pt-2">
          <label htmlFor="onboarding-avatar-pro" className="mb-2 block text-xs text-white/60">
            Avatar (optionnel)
          </label>
          <input
            id="onboarding-avatar-pro"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setAvatarFile(nextFile);
              if (avatarPreview) URL.revokeObjectURL(avatarPreview);
              if (nextFile) setAvatarPreview(URL.createObjectURL(nextFile));
              else setAvatarPreview(null);
            }}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white file:mr-2 file:rounded-md file:border-0 file:bg-white/15 file:px-2 file:py-1 file:text-xs file:text-white"
          />
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Aperçu avatar"
              className="mt-2 h-14 w-14 rounded-full object-cover border border-white/20"
            />
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0D0D0F] p-4">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-400/30 blur-3xl" />

      <GlassCard className="relative z-10 w-full max-w-xl p-8">
        <div className="w-full h-1 bg-white/10 rounded-full mb-6">
          <div
            className="h-1 bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mb-6 text-center text-xs text-white/70">Étape {step} sur {totalSteps}</p>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-white">Finaliser mon profil</h1>
          <p className="mt-2 text-sm text-white/70">
            {invitationType === 'studio' ? 'Configuration studio' : 'Configuration profil pro'}
          </p>
        </div>

        {invitationType === 'studio' ? renderStudioStep() : renderProStep()}

        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}

        <div className="mt-6 flex items-center justify-between gap-3">
          {canGoBack ? (
            <Button type="button" variant="secondary" onClick={handleBack} className="flex-1">
              ← Retour
            </Button>
          ) : (
            <div className="flex-1" />
          )}

          {isConfirmationStep ? (
            <Button
              type="button"
              onClick={handleFinalSubmit}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:opacity-95"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white inline-block mr-2" />
                  Finalisation...
                </>
              ) : (
                'Finaliser mon profil'
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={Boolean(validationMessage)}
              className="flex-1 bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:opacity-95"
            >
              Suivant →
            </Button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
