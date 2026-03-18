import React, { useState } from 'react';
import { ArrowRight, Mail, Lock, Facebook } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Text } from "@/components/ui/Typography";
import { useAppStore } from "@/store/useAppStore";
import { useOnboardingStore } from "@/store/useOnboardingStore";

export default function Login() {
  const navigate = useNavigate();
  const { userType } = useAppStore();
  const { onboardingComplete } = useOnboardingStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingComplete) {
      navigate(userType === 'studio' ? '/onboarding/studio' : '/onboarding/pro');
    } else {
      navigate(userType === 'studio' ? '/dashboard' : '/pro/feed');
    }
  };

  const handleDemoLogin = (type: 'studio' | 'pro') => {
    if (!onboardingComplete) {
      navigate(type === 'studio' ? '/onboarding/studio' : '/onboarding/pro');
    } else {
      navigate(type === 'studio' ? '/dashboard' : '/pro/feed');
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
                  icon={<Mail size={16} />}
                />
                
                <TextInput 
                  type="password" 
                  placeholder="password" 
                  icon={<Lock size={16} />}
                  action={
                    <Button variant="secondary" size="sm" type="button" className="bg-white/80 hover:bg-white shadow-sm border-none">
                      I forgot
                    </Button>
                  }
                />
              </form>

              <div className="flex justify-between items-end mt-auto gap-4">
                <Text variant="secondary" className="text-[10px] leading-relaxed max-w-[200px]">
                  For verified music professionals and studios only. 
                  <br />Access is strictly by invitation.
                  <br /><br />
                  <span className="font-medium text-black/70">Please collaborate responsibly!</span>
                </Text>
                
                <div className="flex flex-col gap-2">
                  <Button variant="primary" size="sm" onClick={() => handleDemoLogin('studio')} className="hover:scale-105 whitespace-nowrap">
                    Studio <ArrowRight size={16} className="ml-2" />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleDemoLogin('pro')} className="hover:scale-105 whitespace-nowrap">
                    Pro <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </div>
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
