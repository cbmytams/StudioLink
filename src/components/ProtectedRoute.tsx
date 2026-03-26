import type React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/supabase/auth';
import LoadingScreen from '@/components/LoadingScreen';
import type { UserType } from '@/types/backend';
import {
  getDashboardPath,
  isProfileIncomplete,
  resolveProfileType,
} from '@/lib/auth/profileCompleteness';
import { consumeAuthRedirectReason } from '@/lib/auth/handleAuthError';

interface Props {
  children: React.ReactNode;
  requiredType?: UserType;
  allowedTypes?: UserType[];
}

type GuardProfile = {
  user_type?: UserType | null;
  type?: UserType | null;
  full_name?: string | null;
  display_name?: string | null;
  bio?: string | null;
  onboarding_complete?: boolean | null;
} | null;

export default function ProtectedRoute({ children, requiredType, allowedTypes }: Props) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();
  const requiredTypes = requiredType ? [requiredType] : allowedTypes;
  const guardProfile = profile as GuardProfile;
  const profileType = resolveProfileType(guardProfile);
  const profileLoading = loading;
  const redirectReason = !session ? consumeAuthRedirectReason() : null;

  if (profileLoading) return <LoadingScreen />;
  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={redirectReason ? { reason: redirectReason } : undefined}
      />
    );
  }

  if (!guardProfile && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (isProfileIncomplete(guardProfile) && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (requiredTypes && !requiredTypes.includes(profileType as UserType)) {
    return <Navigate to={getDashboardPath(profileType)} replace />;
  }

  return <>{children}</>;
}
