import type React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/supabase/auth';
import LoadingScreen from '@/components/LoadingScreen';
import type { UserType } from '@/types/backend';

interface Props {
  children: React.ReactNode;
  requiredType?: UserType;
  allowedTypes?: UserType[];
}

export default function ProtectedRoute({ children, requiredType, allowedTypes }: Props) {
  const { session, profile, loading } = useAuth();
  const requiredTypes = requiredType ? [requiredType] : allowedTypes;

  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;

  if (profile && !profile.onboarding_complete) {
    const onboardingRoute = profile.user_type === 'studio'
      ? '/onboarding/studio'
      : '/onboarding/pro';
    return <Navigate to={onboardingRoute} replace />;
  }

  if (requiredTypes && profile && !requiredTypes.includes(profile.user_type as UserType)) {
    const defaultRoute = profile.user_type === 'studio'
      ? '/studio/dashboard'
      : '/pro/dashboard';
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
}
