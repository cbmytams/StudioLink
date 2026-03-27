import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/supabase/auth';
import { applicationService } from '@/services/applicationService';
import type { ApplicationRecord } from '@/types/backend';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useAsyncAction } from '@/hooks/useAsyncAction';

interface ApplyModalProps {
  isOpen: boolean;
  missionId: string;
  onClose: () => void;
  onSubmitted: (application: ApplicationRecord) => void;
}

export function ApplyModal({ isOpen, missionId, onClose, onSubmitted }: ApplyModalProps) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const [coverLetter, setCoverLetter] = useState('');
  const throttle = useRateLimit(1500);
  const {
    execute: executeSubmit,
    loading: submitting,
    error,
  } = useAsyncAction<ApplicationRecord, []>(async () => {
    const proId = session?.user?.id;
    if (!proId) {
      throw new Error('Session expirée. Reconnecte-toi pour postuler.');
    }

    return applicationService.createApplication(
      {
        mission_id: missionId,
        cover_letter: coverLetter,
      },
      proId,
    );
  }, { errorMessage: 'Impossible d’envoyer la candidature.' });

  useEffect(() => {
    if (!error) return;
    showToast({ title: 'Envoi impossible', description: error, variant: 'destructive' });
  }, [error, showToast]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const created = await throttle(async () => executeSubmit());
    if (!created) return;

    showToast({ title: 'Candidature envoyée ✓', variant: 'default' });
    onSubmitted(created);
    setCoverLetter('');
    onClose();
  };

  return (
    <div
      id="apply-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-modal-title"
      className="fixed inset-0 z-[120] flex items-end justify-center bg-[#f4ece4]/85 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-3xl border border-white/60 bg-white/95 shadow-[0_18px_42px_rgba(26,26,26,0.12)] sm:max-w-md sm:rounded-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-white/90 px-5 py-4 backdrop-blur-sm">
          <h3 id="apply-modal-title" className="text-lg font-semibold text-stone-900">Postuler à la mission</h3>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <Textarea
            id="cover-letter-input"
            aria-label="Lettre de motivation"
            value={coverLetter}
            onChange={(event) => setCoverLetter(event.target.value.slice(0, 1200))}
            rows={6}
            maxLength={1200}
            placeholder="Présentez votre approche, vos références, et votre disponibilité pour cette mission (optionnel)."
          />
          <p className="text-right text-xs text-stone-500">{coverLetter.length}/1200</p>
          {error ? <p className="text-xs text-red-500">{error}</p> : null}

          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1 border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              id="btn-submit-apply"
              className="flex-1"
              loading={submitting}
              loadingLabel="Envoi..."
              onClick={() => void handleSubmit()}
            >
              Envoyer ma candidature
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
