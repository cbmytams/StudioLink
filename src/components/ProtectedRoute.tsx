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

type GuardProfile = {
  user_type?: UserType | null;
  type?: UserType | null;
  full_name?: string | null;
  onboarding_complete?: boolean | null;
} | null;

export default function ProtectedRoute({ children, requiredType, allowedTypes }: Props) {
  const { session, profile, loading } = useAuth();
  const requiredTypes = requiredType ? [requiredType] : allowedTypes;
  const guardProfile = profile as GuardProfile;
  const profileType = guardProfile?.user_type ?? guardProfile?.type ?? null;
  const fullName = guardProfile?.full_name?.trim() ?? '';

  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;

  if (!guardProfile) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!fullName || (profileType !== 'studio' && profileType !== 'pro')) {
    return <Navigate to="/onboarding" replace />;
  }

  if (requiredTypes && !requiredTypes.includes(profileType as UserType)) {
    const defaultRoute = profileType === 'studio'
      ? '/studio/dashboard'
      : '/pro/dashboard';
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
}
