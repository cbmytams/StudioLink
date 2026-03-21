import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { GlassCard } from '@/components/ui/GlassCard';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';

type UserType = 'studio' | 'pro';

type EditableProfile = {
  user_type?: UserType | null
  type?: UserType | null
  full_name?: string | null
  display_name?: string | null
  onboarding_complete?: boolean
};

function resolveType(profileType?: string | null, invitationType?: string | null): UserType | '' {
  if (profileType === 'studio' || profileType === 'pro') return profileType;
  if (invitationType === 'studio' || invitationType === 'pro') return invitationType;
  return '';
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const user = session?.user ?? null;
  const profileData = (profile as EditableProfile | null) ?? null;

  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<UserType | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingType = useMemo(() => resolveType(
    profileData?.user_type ?? profileData?.type ?? null,
    sessionStorage.getItem('invitationType'),
  ), [profileData?.type, profileData?.user_type]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const currentType = resolveType(profileData?.user_type ?? profileData?.type ?? null, sessionStorage.getItem('invitationType'));
    const currentFullName = profileData?.full_name?.trim() ?? profileData?.display_name?.trim() ?? '';
    if (currentType && currentFullName.length > 0) {
      navigate(currentType === 'studio' ? '/studio/dashboard' : '/pro/dashboard', { replace: true });
      return;
    }

    setFullName(profileData?.full_name ?? profileData?.display_name ?? '');
    setUserType(currentType);
  }, [navigate, profileData?.display_name, profileData?.full_name, profileData?.user_type, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setError('Session invalide. Reconnecte-toi.');
      return;
    }

    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) {
      setError('Le nom complet est requis.');
      return;
    }
    if (userType !== 'studio' && userType !== 'pro') {
      setError('Le type de compte est requis.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const modernPayload: Record<string, string | number | boolean | null> = {
        id: user.id,
        email: user.email ?? null,
        full_name: trimmedFullName,
        display_name: trimmedFullName,
        user_type: userType,
        onboarding_complete: true,
        onboarding_step: 1,
        updated_at: now,
      };

      let persistError: Error | null = null;
      const modernPersist = await supabase
        .from('profiles')
        .upsert(modernPayload as never, { onConflict: 'id' });

      if (modernPersist.error) {
        const legacyPayload: Record<string, string | number | boolean | null> = {
          id: user.id,
          email: user.email ?? null,
          display_name: trimmedFullName,
          type: userType,
          onboarding_completed: true,
          onboarding_step: 1,
          updated_at: now,
        };
        const legacyPersist = await supabase
          .from('profiles')
          .upsert(legacyPayload as never, { onConflict: 'id' });

        if (legacyPersist.error) {
          persistError = new Error(legacyPersist.error.message || modernPersist.error.message);
        }
      }

      if (persistError) throw persistError;

      sessionStorage.removeItem('invitationCode');
      sessionStorage.removeItem('invitationType');
      sessionStorage.removeItem('invitationEmail');

      await refreshProfile().catch(() => undefined);
      showToast({ title: 'Profil complété', variant: 'default' });
      navigate(userType === 'studio' ? '/studio/dashboard' : '/pro/dashboard', { replace: true });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Impossible de finaliser le profil.';
      setError(message);
      showToast({ title: 'Onboarding impossible', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen items-center justify-center p-4">
      <Helmet>
        <title>Onboarding — StudioLink</title>
        <meta name="description" content="Complétez votre profil pour accéder à StudioLink." />
      </Helmet>
      <GlassCard className="w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold text-black">Complète ton profil</h1>
        <p className="mt-1 mb-5 text-sm text-stone-500">
          Une dernière étape avant d’accéder à ton dashboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="onboarding-full-name" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Nom complet
            </label>
            <TextInput
              id="onboarding-full-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="text-stone-900 placeholder:text-stone-400"
              placeholder="Prénom Nom"
            />
          </div>

          {existingType === '' ? (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Type de compte
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUserType('studio')}
                  className={`min-h-[44px] rounded-xl border px-3 text-sm transition-colors ${
                    userType === 'studio'
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Studio
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('pro')}
                  className={`min-h-[44px] rounded-xl border px-3 text-sm transition-colors ${
                    userType === 'pro'
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Pro
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/50 bg-white/70 px-3 py-2">
              <p className="text-xs text-stone-500">Type de compte</p>
              <p className="text-sm font-medium text-stone-800">{existingType === 'studio' ? 'Studio' : 'Pro'}</p>
            </div>
          )}

          {error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : null}

          <Button
            type="submit"
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Validation…' : 'Terminer'}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
