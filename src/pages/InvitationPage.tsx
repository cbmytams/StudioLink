import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Key, Mic } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const validCodes: Record<string, 'studio' | 'pro'> = {
  "STUDIO2024": "studio",
  "STUDIOADMIN": "studio",
  "PRO2024": "pro",
  "PROADMIN": "pro"
};

export default function InvitationPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const { setUserType } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const upperCode = code.toUpperCase();
    
    if (validCodes[upperCode]) {
      setUserType(validCodes[upperCode]);
      navigate('/login');
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
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
                  icon={<Key size={18} />}
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
                  Code invalide ou expiré. Vérifie auprès de l'équipe StudioLink.
                </span>
              )}
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2">
              Accéder
            </Button>
          </form>
        </GlassCard>

        <div className="bg-[#1a1a1a] rounded-2xl p-4 flex items-center gap-4 text-white shadow-xl">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Mic size={20} className="text-orange-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">Réservé aux studios et professionnels</span>
            <span className="text-xs text-white/50">Paris / Île-de-France</span>
          </div>
        </div>
      </div>
    </div>
  );
}
