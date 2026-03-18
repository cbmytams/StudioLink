import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { MessageCircle, Pencil, Save } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Textarea } from '@/components/ui/Textarea';
import { useProfileData, useProProfile, useUpdateProfile, useUpsertProProfile } from '@/hooks/useProfile';
import { useReviews } from '@/hooks/useReviews';
import { messageService } from '@/services/messageService';
import { profileService } from '@/services/profileService';
import type { ProProfileRecord } from '@/types/backend';

interface CompletionResult {
  score: number;
  missing: number;
  checks: boolean[];
}

function getProfileCompletion(baseAvatar: string | null | undefined, data: ProProfileRecord): CompletionResult {
  const checks: boolean[] = [
    Boolean(baseAvatar && baseAvatar.trim() !== ''),
    Boolean(data.bio && data.bio.trim().length > 20),
    Boolean(data.services.length > 0),
    Boolean(data.min_rate > 0),
    Boolean(data.links.length > 0),
    Boolean(data.is_available === true),
  ];
  const filled = checks.filter(Boolean).length;
  return {
    score: Math.round((filled / checks.length) * 100),
    missing: checks.length - filled,
    checks,
  };
}

function EmptyState({
  emoji,
  text,
  cta,
  onCta,
}: {
  emoji: string;
  text: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="text-4xl">{emoji}</span>
      <p className="text-sm leading-relaxed text-stone-500">{text}</p>
      {cta && onCta ? (
        <button
          type="button"
          onClick={onCta}
          className="mt-1 min-h-[44px] rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white"
        >
          {cta}
        </button>
      ) : null}
    </div>
  );
}

const EMPTY_PRO_PROFILE: ProProfileRecord = {
  profile_id: '',
  name: null,
  bio: null,
  phone: null,
  services: [],
  genres: [],
  instruments: [],
  min_rate: 0,
  show_rate: true,
  links: [],
  is_available: false,
  availability_slots: [],
  updated_at: new Date().toISOString(),
};

export default function ProProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const ownId = session?.user?.id;
  const targetId = id ?? ownId;
  const isOwn = Boolean(ownId && targetId && ownId === targetId);

  const { data: baseProfile } = useProfileData(targetId);
  const { data: proProfile } = useProProfile(targetId);
  const { data: reviews = [] } = useReviews(targetId);
  const updateBase = useUpdateProfile(ownId);
  const upsertPro = useUpsertProProfile(ownId);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ProProfileRecord>(EMPTY_PRO_PROFILE);
  const [linksInput, setLinksInput] = useState('');
  const [servicesInput, setServicesInput] = useState('');

  useEffect(() => {
    if (!proProfile) return;
    setDraft(proProfile);
    setLinksInput(proProfile.links.map((link) => link.url).join('\n'));
    setServicesInput(proProfile.services.join(', '));
  }, [proProfile]);

  const completion = useMemo(
    () => getProfileCompletion(baseProfile?.avatar_url, draft),
    [baseProfile?.avatar_url, draft],
  );

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }, [reviews]);

  const save = async () => {
    if (!isOwn || !ownId) return;
    const services = servicesInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 10);

    const links = linksInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((url) => ({ platform: 'link', url }));

    await Promise.all([
      updateBase.mutateAsync({
        display_name: draft.name || baseProfile?.display_name || null,
      }),
      upsertPro.mutateAsync({
        ...draft,
        profile_id: ownId,
        services,
        links,
      }),
    ]);
    setIsEditing(false);
  };

  const focusField = (fieldId: string) => {
    const element = document.getElementById(fieldId);
    element?.focus();
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!targetId) {
    return null;
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-4 pb-32">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{isOwn ? 'Mon profil Pro' : 'Profil Pro'}</h1>
          <p className="text-sm text-stone-500">{baseProfile?.display_name || 'Professionnel'}</p>
        </div>
        {isOwn ? (
          <button
            type="button"
            onClick={() => setIsEditing((value) => !value)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full"
          >
            <Pencil size={18} />
          </button>
        ) : (
          <Button
            className="gap-2"
            onClick={async () => {
              if (!ownId) return;
              const conversation = await messageService.getOrCreateConversation(ownId, targetId);
              navigate(`/chat/${conversation.id}`);
            }}
          >
            <MessageCircle size={16} />
            Contacter
          </Button>
        )}
      </header>

      <GlassCard className="mb-4 p-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-700">Profil complété à {completion.score}%</span>
          {completion.missing > 0 ? (
            <span className="text-xs font-medium text-orange-500">
              {completion.missing} champ{completion.missing > 1 ? 's' : ''} manquant{completion.missing > 1 ? 's' : ''}
            </span>
          ) : null}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
          <motion.div
            className="h-full rounded-full bg-orange-500"
            initial={{ width: '0%' }}
            animate={{ width: `${completion.score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
          />
        </div>
      </GlassCard>

      <div className="space-y-4">
        <GlassCard className="p-4">
          <h2 className="mb-3 text-base font-semibold">Présentation</h2>
          {isEditing && isOwn ? (
            <div className="space-y-3">
              <TextInput
                value={draft.name || ''}
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Nom"
              />
              <Textarea
                id="bio-field"
                value={draft.bio || ''}
                onChange={(event) => setDraft((prev) => ({ ...prev, bio: event.target.value }))}
                placeholder="Bio"
                className="focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
              {!completion.checks[1] ? (
                <button
                  type="button"
                  onClick={() => focusField('bio-field')}
                  className="mt-1 text-xs font-medium text-orange-500 transition-colors hover:text-orange-600"
                >
                  Compléter →
                </button>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-stone-700">{draft.bio || 'Bio non renseignée.'}</p>
          )}
        </GlassCard>

        <GlassCard className="p-4">
          <h2 className="mb-3 text-base font-semibold">Compétences & tarif</h2>
          {isEditing && isOwn ? (
            <div className="space-y-3">
              <TextInput
                id="metier-field"
                value={servicesInput}
                onChange={(event) => setServicesInput(event.target.value)}
                placeholder="Services (séparés par virgule)"
                className="focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
              {!completion.checks[2] ? (
                <button
                  type="button"
                  onClick={() => focusField('metier-field')}
                  className="mt-1 text-xs font-medium text-orange-500 transition-colors hover:text-orange-600"
                >
                  Compléter →
                </button>
              ) : null}
              <TextInput
                id="tarif-field"
                type="number"
                value={draft.min_rate.toString()}
                onChange={(event) => setDraft((prev) => ({ ...prev, min_rate: Number(event.target.value) }))}
                placeholder="Tarif journalier"
                className="focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
              {!completion.checks[3] ? (
                <button
                  type="button"
                  onClick={() => focusField('tarif-field')}
                  className="mt-1 text-xs font-medium text-orange-500 transition-colors hover:text-orange-600"
                >
                  Compléter →
                </button>
              ) : null}
              <label
                id="disponibilite-field"
                className="flex min-h-[44px] items-center gap-2 rounded-lg border border-stone-200 bg-white/80 px-3"
              >
                <input
                  type="checkbox"
                  checked={draft.is_available}
                  onChange={(event) => setDraft((prev) => ({ ...prev, is_available: event.target.checked }))}
                  className="accent-orange-500"
                />
                <span className="text-sm text-stone-700">Disponible</span>
              </label>
            </div>
          ) : (
            <>
              <p className="text-sm text-stone-700">
                Services: {draft.services.join(', ') || 'Non renseigné'}
              </p>
              <p className="mt-1 text-sm text-stone-700">
                Tarif: {draft.min_rate > 0 ? `${draft.min_rate} € / jour` : 'Non renseigné'}
              </p>
            </>
          )}
        </GlassCard>

        <GlassCard className="p-4">
          <h2 className="mb-3 text-base font-semibold">Portfolio</h2>
          {isEditing && isOwn ? (
            <div className="space-y-2">
              <Textarea
                id="portfolio-field"
                value={linksInput}
                onChange={(event) => setLinksInput(event.target.value)}
                placeholder="Un lien par ligne"
                className="focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
              {!completion.checks[4] ? (
                <button
                  type="button"
                  onClick={() => focusField('portfolio-field')}
                  className="mt-1 text-xs font-medium text-orange-500 transition-colors hover:text-orange-600"
                >
                  Compléter →
                </button>
              ) : null}
            </div>
          ) : draft.links.length === 0 ? (
            <EmptyState
              emoji="🎵"
              text="Ajoute des liens vers tes travaux pour te démarquer."
              cta={isOwn ? 'Modifier le profil' : undefined}
              onCta={isOwn ? () => setIsEditing(true) : undefined}
            />
          ) : (
            <ul className="space-y-2">
              {draft.links.map((link, index) => (
                <li key={`${link.url}-${index}`}>
                  <a href={link.url} target="_blank" rel="noreferrer" className="text-sm text-orange-600 underline">
                    {link.url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="p-4">
          <h2 className="mb-3 text-base font-semibold">Avis ({reviews.length})</h2>
          <p className="mb-3 text-sm text-stone-600">
            Note moyenne: {averageRating > 0 ? `${averageRating}/5` : 'Aucune note'}
          </p>
          {reviews.length === 0 ? (
            <p className="text-sm text-stone-500">Aucun avis pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-stone-200 bg-white/80 p-3">
                  <p className="text-sm font-medium">Note {review.rating}/5</p>
                  <p className="mt-1 text-sm text-stone-600">{review.comment || 'Sans commentaire'}</p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {isOwn && isEditing ? (
        <div className="fixed bottom-16 left-0 right-0 bg-[#f4ece4]/90 p-4 backdrop-blur-md">
          <div className="mx-auto max-w-3xl">
            <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }}>
              <Button className="w-full min-h-[44px] gap-2" onClick={() => void save()}>
                <Save size={16} />
                Sauvegarder
              </Button>
            </motion.div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
