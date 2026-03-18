import React, { useEffect, useState } from 'react';
import { ArrowRight, Mail, Lock, Facebook } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Text } from "@/components/ui/Typography";
import { useAuth } from "@/auth/AuthProvider";

export default function Login() {
  const navigate = useNavigate();
  const { session, profile, loading, signInPassword, sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingMagic, setIsSendingMagic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session && profile) {
      navigate('/', { replace: true });
    }
  }, [loading, navigate, profile, session]);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    try {
      await signInPassword(email.trim(), password);
      navigate('/', { replace: true });
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Connexion impossible.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setError('Renseigne ton email pour recevoir un magic link.');
      return;
    }
    setError(null);
    setInfo(null);
    setIsSendingMagic(true);

    try {
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('next', '/');
      await sendMagicLink(email.trim(), callbackUrl.toString());
      setInfo('Magic link envoyé. Vérifie ta boîte mail.');
    } catch (magicError) {
      const message =
        magicError instanceof Error ? magicError.message : "Impossible d'envoyer le magic link.";
      setError(message);
    } finally {
      setIsSendingMagic(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
      {/* Decorative 3D-like spheres in background */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-white to-orange-200 rounded-full blur-2xl opacity-60 mix-blend-multiply" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-tl from-blue-200 to-white rounded-full blur-3xl opacity-50 mix-blend-multiply" />

      <div className="max-w-md w-full relative z-10">
        
        {/* Login & Promo */}
        <div className="flex flex-col gap-6">
          {/* Login Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <GlassCard className="p-10 flex flex-col h-full">
              <div className="flex justify-between items-center mb-12">
                <span className="text-sm font-medium tracking-wide text-black/60">StudioLink Paris</span>
                <button className="text-sm font-medium hover:text-black/60 transition-colors">Sign up</button>
              </div>

              <div className="flex justify-between items-end mb-10">
                <h1 className="text-4xl font-light tracking-tight">Log in</h1>
                <Button variant="secondary" size="sm" className="gap-2">
                  <Facebook size={14} />
                  Facebook
                </Button>
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-4 mb-12">
                <TextInput 
                  type="email" 
                  placeholder="e-mail address" 
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  icon={<Mail size={16} />}
                  required
                />
                
                <TextInput 
                  type="password" 
                  placeholder="password" 
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  icon={<Lock size={16} />}
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={handleMagicLink}
                      className="bg-white/80 hover:bg-white shadow-sm border-none"
                      disabled={isSendingMagic}
                    >
                      {isSendingMagic ? 'Envoi...' : 'Magic link'}
                    </Button>
                  }
                  required
                />
                {error && <p className="text-xs text-red-500 px-1">{error}</p>}
                {info && <p className="text-xs text-emerald-600 px-1">{info}</p>}
              </form>

              <div className="flex justify-between items-end mt-auto gap-4">
                <Text variant="secondary" className="text-[10px] leading-relaxed max-w-[200px]">
                  For verified music professionals and studios only. 
                  <br />Access is strictly by invitation.
                  <br /><br />
                  <span className="font-medium text-black/70">Please collaborate responsibly!</span>
                </Text>
                
                <div className="flex flex-col gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleLogin}
                    disabled={isSubmitting}
                    className="hover:scale-105 whitespace-nowrap"
                  >
                    {isSubmitting ? 'Connexion...' : 'Se connecter'} <ArrowRight size={16} className="ml-2" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleMagicLink}
                    className="hover:scale-105 whitespace-nowrap"
                    disabled={isSendingMagic}
                  >
                    {isSendingMagic ? 'Envoi...' : 'Recevoir un magic link'} <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/invitation')}
                className="mt-6 text-xs text-black/50 hover:text-black transition-colors text-left"
              >
                Tu as un code ? → Utiliser un code
              </button>

              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="mt-2 text-xs text-black/40 hover:text-black transition-colors text-left"
              >
                Pas encore de compte ? → Créer un compte
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="mt-2 text-[11px] text-black/35 hover:text-black/60 transition-colors text-left"
              >
                Admin →
              </button>
            </GlassCard>
          </motion.div>

          {/* Dark Promo Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            <GlassCard variant="dark" className="p-10 flex flex-col justify-between h-48 relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-3xl font-light mb-1">New in</h2>
                <p className="text-white/60 font-medium">StudioLink Pro</p>
              </div>
              <button className="self-end text-sm font-medium hover:text-white/70 transition-colors relative z-10">
                Discover
              </button>
              
              {/* Subtle dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            </GlassCard>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
