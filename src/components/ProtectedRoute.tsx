import type React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import LoadingScreen from '@/components/LoadingScreen';
import type { UserType } from '@/types/backend';

interface Props {
  children: React.ReactNode;
  allowedTypes?: UserType[];
}

export default function ProtectedRoute({ children, allowedTypes }: Props) {
  const { session, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;

  if (profile && !profile.onboarding_complete) {
    const onboardingRoute = profile.user_type === 'studio'
      ? '/onboarding/studio'
      : '/onboarding/pro';
    return <Navigate to={onboardingRoute} replace />;
  }

  if (allowedTypes && profile && !allowedTypes.includes(profile.user_type as UserType)) {
    const defaultRoute = profile.user_type === 'studio'
      ? '/studio/dashboard'
      : '/pro/feed';
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
}
