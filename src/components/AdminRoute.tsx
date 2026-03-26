import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/supabase/auth';
import LoadingScreen from '@/components/LoadingScreen';

const ADMIN_EMAILS = [
  'sasha@wafia.fr',
  import.meta.env.VITE_ADMIN_EMAIL ?? '',
]
  .map((email) => email.trim().toLowerCase())
  .filter((email): email is string => Boolean(email));

type AdminProfile = {
  role?: string | null;
  user_role?: string | null;
} | null;

export function AdminRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const userEmail = session?.user?.email?.toLowerCase() ?? '';
  const profileRole = ((profile as AdminProfile)?.role ?? (profile as AdminProfile)?.user_role ?? '').toLowerCase();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = profileRole === 'admin' || ADMIN_EMAILS.includes(userEmail);
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
