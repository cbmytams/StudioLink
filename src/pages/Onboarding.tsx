import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import {
  extractClaimSuccess,
  getInvitationContext,
} from '@/lib/auth/invitationFlow';
import {
  buildOnboardingProfilePayload,
  createInitialOnboardingDraft,
  getCurrentStepErrors,
  normalizeSkills,
  type OnboardingDraft,
} from '@/lib/auth/onboardingWizard';
import {
  getDashboardPath,
  isProfileIncomplete,
  resolveProfileType,
} from '@/lib/auth/profileCompleteness';
import { useToast } from '@/components/ui/Toast';
import { GlassCard } from '@/components/ui/GlassCard';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { AvatarUpload } from '@/components/ui/AvatarUpload';
import { PageMeta } from '@/components/shared/PageMeta';
import { useMobileFixedBottomStyle } from '@/hooks/useVisualViewport';
import type { UserType } from '@/types/backend';
import type { Database } from '@/types/supabase';

type EditableProfile = {
  user_type?: UserType | null;
  type?: UserType | null;
  full_name?: string | null;
  display_name?: string | null;
  city?: string | null;
  avatar_url?: string | null;
  company_name?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  daily_rate?: number | null;
  onboarding_complete?: boolean | null;
  onboarding_completed?: boolean | null;
} | null;

type PersistValue = string | number | boolean | string[] | null;

async function tryProfileUpsert(payload: Database['public']['Tables']['profiles']['Insert']) {
  const { error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' });
  return error;
}

function getStepFromDraft(draft: OnboardingDraft): number {
  if (!draft.role) return 1;
  if (!draft.displayName.trim()) return 2;
  return 3;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const user = session?.user ?? null;
  const profileData = (profile as EditableProfile) ?? null;
  const invitationContext = useMemo(
    () => getInvitationContext({
      storageCode: sessionStorage.getItem('invitationCode'),
      storageType: sessionStorage.getItem('invitationType'),
      storageEmail: sessionStorage.getItem('invitationEmail'),
      userMetadata: session?.user?.user_metadata as Record<string, unknown> | null | undefined,
    }),
    [session?.user?.id, session?.user?.user_metadata],
  );

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<OnboardingDraft>(() => createInitialOnboardingDraft(null, null));
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const mobileFooterStyle = useMobileFixedBottomStyle();

  const lockedRole = useMemo(
    () => resolveProfileType(profileData) ?? invitationContext?.type ?? null,
    [invitationContext?.type, profileData],
  );
  const progressPercent = Math.round((step / 4) * 100);
  const currentStepErrors = useMemo(() => getCurrentStepErrors(step, draft), [draft, step]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (!user) return;

    if (profileData && !isProfileIncomplete(profileData)) {
      navigate(getDashboardPath(resolveProfileType(profileData)), { replace: true });
      return;
    }

    if (hydratedUserId === user.id) return;

    const nextDraft = createInitialOnboardingDraft(profileData, invitationContext?.type ?? null);
    setDraft(nextDraft);
    setStep(getStepFromDraft(nextDraft));
    setFieldErrors({});
    setHydratedUserId(user.id);
  }, [hydratedUserId, invitationContext?.type, navigate, profileData, user]);

  const setDraftField = <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => {
    setDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
    setFieldErrors((currentErrors) => {
      if (!(key in currentErrors)) return currentErrors;
      const nextErrors = { ...currentErrors };
      delete nextErrors[key];
      return nextErrors;
    });
    setError(null);
  };

  const addSkill = () => {
    const nextSkill = draft.skillInput.trim();
    if (!nextSkill) {
      setDraftField('skillInput', '');
      return;
    }

    const nextSkills = normalizeSkills([...draft.skills, nextSkill]);
    setDraft((currentDraft) => ({
      ...currentDraft,
      skills: nextSkills,
      skillInput: '',
    }));
    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors.skills;
      return nextErrors;
    });
  };

  const removeSkill = (skill: string) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      skills: currentDraft.skills.filter((currentSkill) => currentSkill !== skill),
    }));
  };

  const goToNextStep = () => {
    const nextErrors = getCurrentStepErrors(step, draft);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setStep((currentStep) => Math.min(4, currentStep + 1));
  };

  const goToPreviousStep = () => {
    setFieldErrors({});
    setError(null);
    setStep((currentStep) => Math.max(1, currentStep - 1));
  };

  const handleCompleteOnboarding = async () => {
    if (!user) {
      setError('Session invalide. Reconnecte-toi.');
      return;
    }

    const stepOneErrors = getCurrentStepErrors(1, draft);
    const stepTwoErrors = getCurrentStepErrors(2, draft);
    const stepThreeErrors = getCurrentStepErrors(3, draft);
    const nextErrors = {
      ...stepOneErrors,
      ...stepTwoErrors,
      ...stepThreeErrors,
    };

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (Object.keys(stepOneErrors).length > 0) setStep(1);
      else if (Object.keys(stepTwoErrors).length > 0) setStep(2);
      else setStep(3);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = buildOnboardingProfilePayload(user.id, draft);
      const payloadVariants: Array<Database['public']['Tables']['profiles']['Insert']> = [
        {
          ...payload,
          email: user.email ?? null,
        },
        {
          id: payload.id,
          email: user.email ?? null,
          display_name: payload.display_name,
          full_name: payload.full_name,
          city: payload.city,
          avatar_url: payload.avatar_url,
          company_name: payload.company_name,
          bio: payload.bio,
          skills: payload.skills,
          daily_rate: payload.daily_rate,
          type: payload.type,
          user_type: payload.user_type,
          onboarding_complete: true,
          onboarding_step: 4,
          updated_at: payload.updated_at,
        },
      ];

      let persisted = false;
      let lastPersistError: string | null = null;

      for (const candidatePayload of payloadVariants) {
        const persistError = await tryProfileUpsert(candidatePayload);
        if (!persistError) {
          persisted = true;
          break;
        }
        lastPersistError = persistError.message;
      }

      if (!persisted) {
        throw new Error(lastPersistError ?? 'Impossible de sauvegarder le profil.');
      }

      if (invitationContext?.code) {
        const { data: claimData, error: claimError } = await supabase.rpc('claim_invitation', {
          p_code: invitationContext.code,
          p_user_id: user.id,
        });
        const claimPayload = Array.isArray(claimData) ? claimData[0] : claimData;
        if (claimError || !extractClaimSuccess(claimPayload)) {
          throw new Error(claimError?.message ?? "Impossible de valider l'invitation.");
        }
      }

      sessionStorage.removeItem('invitationCode');
      sessionStorage.removeItem('invitationType');
      sessionStorage.removeItem('invitationEmail');

      await refreshProfile().catch(() => undefined);
      showToast({ title: 'Profil complété', variant: 'default' });
      navigate(getDashboardPath(draft.role as UserType), { replace: true });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Impossible de finaliser le profil.';
      setError(message);
      showToast({ title: 'Onboarding impossible', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const nextButtonDisabled = Object.keys(currentStepErrors).length > 0;
  const summaryItems = [
    { label: 'Type de compte', value: draft.role === 'studio' ? 'Studio' : 'Pro' },
    { label: 'Nom affiché', value: draft.displayName || 'Non renseigné' },
    { label: 'Ville', value: draft.city || 'Non renseignée' },
    { label: 'Bio', value: draft.bio || 'Non renseignée' },
  ];

  return (
    <div className="app-shell min-h-[100dvh] px-4 pb-32 pt-6 md:py-12">
      <PageMeta
        title="Créer mon profil"
        description="Configurez votre profil StudioLink en quelques étapes."
        canonicalPath="/onboarding"
      />

      <div className="mx-auto max-w-3xl">
        <GlassCard className="p-6 md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/45">
                Configuration du profil
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Bienvenue sur StudioLink</h1>
              <p className="mt-2 max-w-xl text-sm text-white/65">
                Complète ton profil pour accéder au bon dashboard et apparaître correctement dans l&apos;app.
              </p>
            </div>
            <div className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70">
              Étape {step}/4
            </div>
          </div>

          <div id="onboarding-progress" className="mt-6">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {step === 1 ? (
              <section id="onboarding-step-1" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Choisis ton espace</h2>
                  <p className="mt-1 text-sm text-white/60">
                    Le rôle détermine les pages visibles, les champs du profil et tes actions principales.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <button
                    id="btn-role-studio"
                    type="button"
                    disabled={Boolean(lockedRole && lockedRole !== 'studio')}
                    onClick={() => setDraftField('role', 'studio')}
                    className={`rounded-[2rem] border p-5 text-left transition-all ${
                      draft.role === 'studio'
                        ? 'border-orange-400 bg-orange-500/15 shadow-[0_0_0_1px_rgba(251,146,60,0.35)]'
                        : 'border-white/15 bg-white/5 hover:bg-white/10'
                    } ${
                      lockedRole && lockedRole !== 'studio' ? 'cursor-not-allowed opacity-45' : ''
                    }`}
                  >
                    <p className="text-3xl">🎬</p>
                    <h3 className="mt-4 text-lg font-semibold text-white">Je suis un Studio</h3>
                    <p className="mt-2 text-sm text-white/60">
                      Publie des missions, gère les candidatures et collabore avec les meilleurs profils audio.
                    </p>
                  </button>

                  <button
                    id="btn-role-pro"
                    type="button"
                    disabled={Boolean(lockedRole && lockedRole !== 'pro')}
                    onClick={() => setDraftField('role', 'pro')}
                    className={`rounded-[2rem] border p-5 text-left transition-all ${
                      draft.role === 'pro'
                        ? 'border-orange-400 bg-orange-500/15 shadow-[0_0_0_1px_rgba(251,146,60,0.35)]'
                        : 'border-white/15 bg-white/5 hover:bg-white/10'
                    } ${
                      lockedRole && lockedRole !== 'pro' ? 'cursor-not-allowed opacity-45' : ''
                    }`}
                  >
                    <p className="text-3xl">🎤</p>
                    <h3 className="mt-4 text-lg font-semibold text-white">Je suis un Pro</h3>
                    <p className="mt-2 text-sm text-white/60">
                      Candidate aux missions, livre tes fichiers et développe ta réputation auprès des studios.
                    </p>
                  </button>
                </div>

                {fieldErrors.role ? <p className="text-xs text-red-400">{fieldErrors.role}</p> : null}
                {lockedRole ? (
                  <p className="text-xs text-white/50">
                    Ce rôle est verrouillé par ton invitation ou ton profil existant.
                  </p>
                ) : null}
              </section>
            ) : null}

            {step === 2 ? (
              <section id="onboarding-step-2" className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Les bases de ton profil</h2>
                  <p className="mt-1 text-sm text-white/60">
                    Choisis le nom qui sera affiché partout dans l&apos;app et ajoute un avatar si tu veux.
                  </p>
                </div>

                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  <div className="flex justify-center md:justify-start">
                    <AvatarUpload
                      inputId="input-avatar"
                      currentUrl={draft.avatarUrl}
                      fallbackLetter={draft.displayName.trim().charAt(0) || '?'}
                      userId={user?.id ?? ''}
                      onUploadSuccess={(newUrl) => setDraftField('avatarUrl', newUrl)}
                    />
                  </div>

                  <div className="grid flex-1 gap-4">
                    <TextInput
                      id="input-display-name"
                      label="Nom affiché"
                      value={draft.displayName}
                      placeholder={draft.role === 'studio' ? 'Ex: Studio Nova' : 'Ex: Lina Dubois'}
                      onChange={(event) => setDraftField('displayName', event.target.value)}
                      error={fieldErrors.displayName}
                    />

                    <TextInput
                      id="input-location"
                      label="Ville"
                      value={draft.city}
                      placeholder="Paris, Lyon, Marseille..."
                      onChange={(event) => setDraftField('city', event.target.value)}
                    />
                  </div>
                </div>
              </section>
            ) : null}

            {step === 3 && draft.role === 'studio' ? (
              <section id="onboarding-step-3-studio" className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-white">Présente ton studio</h2>
                  <p className="mt-1 text-sm text-white/60">
                    Ajoute le nom commercial du studio et une courte description pour rassurer les candidats.
                  </p>
                </div>

                <TextInput
                  id="input-company-name"
                  label="Nom du studio"
                  value={draft.companyName}
                  placeholder="Studio Nova"
                  onChange={(event) => setDraftField('companyName', event.target.value)}
                  error={fieldErrors.companyName}
                />

                <div>
                  <label htmlFor="input-studio-bio" className="mb-2 block px-1 text-sm font-medium text-white/70">
                    Description du studio
                  </label>
                  <textarea
                    id="input-studio-bio"
                    rows={5}
                    value={draft.bio}
                    onChange={(event) => setDraftField('bio', event.target.value)}
                    placeholder="Décris votre univers, vos spécialités et le type de projets que vous aimez accompagner."
                    className="w-full rounded-[1.75rem] border border-white/15 bg-white/5 px-5 py-4 text-base md:text-sm text-white placeholder:text-white/35 focus:border-orange-400 focus:outline-none"
                  />
                </div>
              </section>
            ) : null}

            {step === 3 && draft.role === 'pro' ? (
              <section id="onboarding-step-3-pro" className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-white">Décris ton expertise</h2>
                  <p className="mt-1 text-sm text-white/60">
                    Les studios doivent comprendre rapidement qui tu es, ce que tu sais faire et à quel tarif.
                  </p>
                </div>

                <div>
                  <label htmlFor="input-pro-bio" className="mb-2 block px-1 text-sm font-medium text-white/70">
                    Présentation
                  </label>
                  <textarea
                    id="input-pro-bio"
                    rows={6}
                    value={draft.bio}
                    onChange={(event) => setDraftField('bio', event.target.value)}
                    placeholder="Parle de ton parcours, tes spécialités, tes références et du type de missions qui te correspondent."
                    className="w-full rounded-[1.75rem] border border-white/15 bg-white/5 px-5 py-4 text-base md:text-sm text-white placeholder:text-white/35 focus:border-orange-400 focus:outline-none"
                  />
                  {fieldErrors.bio ? <p className="mt-2 px-1 text-xs text-red-400">{fieldErrors.bio}</p> : null}
                </div>

                <div>
                  <label htmlFor="input-skills" className="mb-2 block px-1 text-sm font-medium text-white/70">
                    Compétences
                  </label>
                  <TextInput
                    id="input-skills"
                    value={draft.skillInput}
                    placeholder={draft.skills.length >= 5 ? 'Maximum 5 compétences atteint' : 'Ex: Mixage, Mastering, Podcast'}
                    disabled={draft.skills.length >= 5}
                    onChange={(event) => setDraftField('skillInput', event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ',') {
                        event.preventDefault();
                        addSkill();
                      }
                    }}
                    action={(
                      <button
                        type="button"
                        onClick={addSkill}
                        className="min-h-[44px] rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-400"
                      >
                        Ajouter
                      </button>
                    )}
                  />
                  {draft.skills.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {draft.skills.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="min-h-[44px] rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-100"
                        >
                          {skill} ×
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {fieldErrors.skills ? <p className="mt-2 px-1 text-xs text-red-400">{fieldErrors.skills}</p> : null}
                </div>

                <TextInput
                  id="input-daily-rate"
                  type="number"
                  label="Tarif journalier"
                  value={draft.dailyRate}
                  placeholder="450 €/jour"
                  inputMode="numeric"
                  onChange={(event) => setDraftField('dailyRate', event.target.value)}
                  error={fieldErrors.dailyRate}
                />
              </section>
            ) : null}

            {step === 4 ? (
              <section id="onboarding-step-4" className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-white">Récapitulatif</h2>
                  <p className="mt-1 text-sm text-white/60">
                    Vérifie les informations qui seront enregistrées sur ton profil avant d&apos;accéder à l&apos;app.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {summaryItems.map((item) => (
                    <div key={item.label} className="rounded-[1.5rem] border border-white/15 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/40">{item.label}</p>
                      <p className="mt-2 text-sm text-white">{item.value}</p>
                    </div>
                  ))}
                  {draft.role === 'studio' ? (
                    <div className="rounded-[1.5rem] border border-white/15 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/40">Nom du studio</p>
                      <p className="mt-2 text-sm text-white">{draft.companyName || draft.displayName}</p>
                    </div>
                  ) : null}
                  {draft.role === 'pro' ? (
                    <>
                      <div className="rounded-[1.5rem] border border-white/15 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-white/40">Compétences</p>
                        <p className="mt-2 text-sm text-white">{draft.skills.join(', ') || 'Aucune'}</p>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/15 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-white/40">Tarif journalier</p>
                        <p className="mt-2 text-sm text-white">{draft.dailyRate ? `${draft.dailyRate} €/j` : 'Non renseigné'}</p>
                      </div>
                    </>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-8 hidden flex-col gap-3 sm:flex sm:flex-row sm:items-center sm:justify-between">
            <Button
              id="btn-onboarding-prev"
              type="button"
              variant="secondary"
              onClick={goToPreviousStep}
              disabled={step === 1 || saving}
              className={`w-full sm:w-auto ${step === 1 ? 'pointer-events-none opacity-40' : ''}`}
            >
              Précédent
            </Button>

            {step < 4 ? (
              <Button
                id="btn-onboarding-next"
                type="button"
                onClick={goToNextStep}
                disabled={saving || nextButtonDisabled}
                className="w-full sm:w-auto"
              >
                Suivant
              </Button>
            ) : (
              <Button
                id="btn-complete-onboarding"
                type="button"
                onClick={() => {
                  void handleCompleteOnboarding();
                }}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? 'Validation…' : 'Commencer à utiliser StudioLink'}
              </Button>
            )}
          </div>
        </GlassCard>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#0A0B10]/92 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur-xl sm:hidden"
        style={mobileFooterStyle}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Button
            id="btn-onboarding-prev-mobile"
            type="button"
            variant="secondary"
            onClick={goToPreviousStep}
            disabled={step === 1 || saving}
            className={`flex-1 ${step === 1 ? 'pointer-events-none opacity-40' : ''}`}
          >
            Précédent
          </Button>

          {step < 4 ? (
            <Button
              id="btn-onboarding-next-mobile"
              type="button"
              onClick={goToNextStep}
              disabled={saving || nextButtonDisabled}
              className="flex-[1.3]"
            >
              Suivant
            </Button>
          ) : (
            <Button
              id="btn-complete-onboarding-mobile"
              type="button"
              onClick={() => {
                void handleCompleteOnboarding();
              }}
              disabled={saving}
              className="flex-[1.3]"
            >
              {saving ? 'Validation…' : 'Accéder à mon dashboard'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
