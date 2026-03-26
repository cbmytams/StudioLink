import { useEffect, useState } from 'react';
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
    <div id="apply-modal" className="fixed inset-0 z-[120] flex items-center justify-center bg-[#f4ece4]/80 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-white/60 bg-white/85 p-5 shadow-[0_12px_32px_rgba(26,26,26,0.08)]">
        <h3 className="text-lg font-semibold">Postuler à la mission</h3>
        <Textarea
          id="cover-letter-input"
          value={coverLetter}
          onChange={(event) => setCoverLetter(event.target.value)}
          rows={4}
          placeholder="Présente ton approche (optionnel)..."
        />
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button
            id="btn-submit-apply"
            className="flex-1"
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? 'Envoi...' : 'Envoyer ma candidature'}
          </Button>
        </div>
      </div>
    </div>
  );
}
