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

  if (!profile) {
    const invitationCode = sessionStorage.getItem('invitationCode');
    const invitationType = sessionStorage.getItem('invitationType');
    if (
      invitationCode
      && (invitationType === 'studio' || invitationType === 'pro')
    ) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/invitation" replace />;
  }

  if (!profile.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  if (profile.user_type !== 'studio' && profile.user_type !== 'pro') {
    return <Navigate to="/invitation" replace />;
  }

  if (requiredTypes && !requiredTypes.includes(profile.user_type as UserType)) {
    const defaultRoute = profile.user_type === 'studio'
      ? '/studio/dashboard'
      : '/pro/dashboard';
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
}
