import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { TextInput } from '@/components/ui/TextInput';
import { useCreateApplication } from '@/hooks/useApplications';
import { useAuth } from '@/auth/AuthProvider';

interface ApplyModalProps {
  isOpen: boolean;
  missionId: string;
  onClose: () => void;
}

export function ApplyModal({ isOpen, missionId, onClose }: ApplyModalProps) {
  const { session } = useAuth();
  const [message, setMessage] = useState('');
  const [budget, setBudget] = useState('');
  const createApplication = useCreateApplication(session?.user?.id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Postuler à la mission</h3>
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          placeholder="Présente ton approche..."
        />
        <TextInput
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
          type="number"
          placeholder="Budget proposé (optionnel)"
        />
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button
            className="flex-1"
            disabled={!message.trim() || createApplication.isPending}
            onClick={async () => {
              await createApplication.mutateAsync({
                mission_id: missionId,
                message: message.trim(),
                proposed_budget: budget ? Number(budget) : undefined,
              });
              onClose();
            }}
          >
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
}
