import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { Button as GradientButton } from '@/components/ui/Button';
import Navbar from '@/components/layout/Navbar';

type EditableStudioProfile = {
  company_name?: string | null
  website?: string | null
  bio?: string | null
  contact_email?: string | null
  phone?: string | null
}

type FieldErrors = {
  companyName?: string
  website?: string
  contactEmail?: string
}

export default function StudioProfile() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();

  const user = session?.user ?? null;
  const profileData = (profile ?? null) as EditableStudioProfile | null;

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [bio, setBio] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!profileData) return;
    setCompanyName(profileData.company_name ?? '');
    setWebsite(profileData.website ?? '');
    setBio(profileData.bio ?? '');
    setContactEmail(profileData.contact_email ?? '');
    setPhone(profileData.phone ?? '');
  }, [profileData]);

  useEffect(() => {
    if (!successMessage) return;
    const timeout = window.setTimeout(() => setSuccessMessage(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const validate = (): boolean => {
    const nextFieldErrors: FieldErrors = {};

    if (!companyName.trim()) {
      nextFieldErrors.companyName = 'Le nom du studio est requis';
    }

    if (website.trim() && !website.trim().startsWith('https://')) {
      nextFieldErrors.website = "L'URL doit commencer par https://";
    }

    if (!contactEmail.trim()) {
      nextFieldErrors.contactEmail = "L'email de contact est requis";
    } else if (!contactEmail.includes('@')) {
      nextFieldErrors.contactEmail = 'Email de contact invalide';
    }

    setFieldErrors(nextFieldErrors);
    const firstError = Object.values(nextFieldErrors)[0] ?? null;
    setError(firstError);
    return Object.keys(nextFieldErrors).length === 0;
  };

  const resetToProfile = () => {
    setCompanyName(profileData?.company_name ?? '');
    setWebsite(profileData?.website ?? '');
    setBio(profileData?.bio ?? '');
    setContactEmail(profileData?.contact_email ?? '');
    setPhone(profileData?.phone ?? '');
    setFieldErrors({});
    setError(null);
    setSuccessMessage(null);
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
          company_name: companyName.trim(),
          website: website.trim() || null,
          bio: bio.trim() || null,
          contact_email: contactEmail.trim(),
          phone: phone.trim() || null,
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

  const baseInputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/45 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400';

  const hasAnyInfo = Boolean(
    bio.trim() ||
    website.trim() ||
    contactEmail.trim() ||
    phone.trim(),
  );

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">
        <button
          type="button"
          onClick={() => navigate('/studio/dashboard')}
          className="mb-6 text-sm text-white/70 transition-colors hover:text-white"
        >
          ← Dashboard
        </button>

        <header className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-600 text-lg font-semibold">
              {companyName.trim().charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-xl font-semibold">{companyName || profileData?.company_name || 'Studio'}</h1>
              <p className="text-sm text-white/55">Studio</p>
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
                  resetToProfile();
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

        {!isEditing ? (
          hasAnyInfo ? (
            <div className="space-y-4">
              {bio.trim() ? (
                <section className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h2 className="mb-2 text-sm font-semibold text-white/85">Bio</h2>
                  <p className="text-sm text-white/75">{bio}</p>
                </section>
              ) : null}

              {website.trim() ? (
                <section className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h2 className="mb-2 text-sm font-semibold text-white/85">Site web</h2>
                  <a
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-cyan-300 underline"
                  >
                    {website}
                  </a>
                </section>
              ) : null}

              {contactEmail.trim() ? (
                <section className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h2 className="mb-2 text-sm font-semibold text-white/85">Email de contact</h2>
                  <p className="text-sm text-white/75">{contactEmail}</p>
                </section>
              ) : null}

              {phone.trim() ? (
                <section className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h2 className="mb-2 text-sm font-semibold text-white/85">Téléphone</h2>
                  <p className="text-sm text-white/75">{phone}</p>
                </section>
              ) : null}
            </div>
          ) : (
            <p className="text-white/40 text-sm">
              Profil incomplet. Clique sur &quot;Modifier&quot; pour le compléter.
            </p>
          )
        ) : (
          <section className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
            <div>
              <input
                value={companyName}
                onChange={(event) => {
                  setCompanyName(event.target.value);
                  if (fieldErrors.companyName) {
                    setFieldErrors((prev) => ({ ...prev, companyName: undefined }));
                  }
                  if (error) setError(null);
                }}
                placeholder="Nom du studio"
                className={baseInputClass}
              />
              {fieldErrors.companyName ? (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.companyName}</p>
              ) : null}
            </div>

            <div>
              <input
                value={website}
                onChange={(event) => {
                  setWebsite(event.target.value);
                  if (fieldErrors.website) {
                    setFieldErrors((prev) => ({ ...prev, website: undefined }));
                  }
                  if (error) setError(null);
                }}
                placeholder="https://..."
                className={baseInputClass}
              />
              {fieldErrors.website ? (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.website}</p>
              ) : null}
            </div>

            <div>
              <textarea
                rows={3}
                maxLength={300}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Bio (max 300 caractères)"
                className={baseInputClass}
              />
            </div>

            <div>
              <input
                type="email"
                value={contactEmail}
                onChange={(event) => {
                  setContactEmail(event.target.value);
                  if (fieldErrors.contactEmail) {
                    setFieldErrors((prev) => ({ ...prev, contactEmail: undefined }));
                  }
                  if (error) setError(null);
                }}
                placeholder="Email de contact"
                className={baseInputClass}
              />
              {fieldErrors.contactEmail ? (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.contactEmail}</p>
              ) : null}
            </div>

            <div>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Téléphone"
                className={baseInputClass}
              />
            </div>

            {error ? <p className="text-red-400 text-sm">{error}</p> : null}
          </section>
        )}
      </div>
    </div>
  );
}
