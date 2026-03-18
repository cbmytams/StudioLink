import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { GlassCard } from '@/components/ui/GlassCard';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { validateInvitationCode } from '@/services/invitationService';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export default function InvitationPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const upperCode = code.trim().toUpperCase();
    if (!upperCode) {
      setError(true);
      showToast({
        title: "Code d'invitation requis.",
        variant: 'destructive',
      });
      setTimeout(() => setError(false), 500);
      return;
    }

    setSubmitting(true);
    const result = await validateInvitationCode(upperCode);
    setSubmitting(false);

    if (result.is_valid) {
      navigate(`/signup?code=${encodeURIComponent(upperCode)}`);
      return;
    }

    setError(true);
    showToast({
      title: result.message || 'Code invalide ou expiré.',
      variant: 'destructive',
    });
    setTimeout(() => setError(false), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4ece4] to-[#e3d5c8] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-orange-400/20 rounded-full blur-3xl mix-blend-multiply" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-blue-400/20 rounded-full blur-3xl mix-blend-multiply" />

      <div className="w-full max-w-md flex flex-col gap-6 relative z-10">
        <GlassCard className="p-8 flex flex-col gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">StudioLink Paris</h1>
            <div className="h-1 w-12 bg-orange-500 rounded-full" />
          </div>

          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-xl font-semibold">Accès sur invitation</h2>
            <p className="text-sm text-black/60">Entre ton code d'invitation pour accéder à la plateforme.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <motion.div
                animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <TextInput
                  icon={<span className="text-base leading-none">🔑</span>}
                  placeholder="Code d'invitation"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(false);
                  }}
                  className={cn("uppercase", error && "border-red-500 focus:border-red-500")}
                />
              </motion.div>
              {error && (
                <span className="text-xs text-red-500 font-medium px-1">
                  Code invalide ou expiré.
                </span>
              )}
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2" disabled={submitting}>
              {submitting ? 'Vérification...' : 'Accéder'}
            </Button>
          </form>
        </GlassCard>

        <div className="bg-[#1a1a1a] rounded-2xl p-4 text-white shadow-xl">
          <p className="text-sm font-medium text-center">
            Réservé aux studios et professionnels · Paris / Île-de-France · 🎙️
          </p>
        </div>
      </div>
    </div>
  );
}
