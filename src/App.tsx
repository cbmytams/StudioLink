import { lazy, Suspense, type ReactNode } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { useAuth } from '@/lib/supabase/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingScreen from '@/components/LoadingScreen';
import { Toaster } from '@/components/ui/Toast';
import StudioLayout from '@/layouts/StudioLayout';
import ProLayout from '@/layouts/ProLayout';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const InvitationLandingPage = lazy(() => import('@/pages/InvitationLanding'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallback'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const StudioDashboardPage = lazy(() => import('@/pages/StudioDashboard'));
const CreateMissionPage = lazy(() => import('@/pages/CreateMission'));
const MissionDetailPage = lazy(() => import('@/pages/MissionDetail'));
const ManageApplicationsPage = lazy(() => import('@/pages/ManageApplications'));
const StudioProfilePage = lazy(() => import('@/pages/StudioProfile'));
const ProFeedPage = lazy(() => import('@/pages/ProFeed'));
const ProDashboardPage = lazy(() => import('@/pages/ProDashboard'));
const ProApplicationsPage = lazy(() => import('@/pages/ProApplications'));
const ProProfilePage = lazy(() => import('@/pages/ProProfile'));
const ProPublicProfilePage = lazy(() => import('@/pages/ProPublicProfile'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const ChatWrapperPage = lazy(() => import('@/components/ChatWrapper'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const SavedPage = lazy(() => import('@/pages/SavedPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session || !profile) {
    return <>{children}</>;
  }

  if (!profile.onboarding_complete) {
    return (
      <Navigate
        to={profile.user_type === 'studio' ? '/onboarding/studio' : '/onboarding/pro'}
        replace
      />
    );
  }

  return <Navigate to={profile.user_type === 'studio' ? '/studio/dashboard' : '/pro/feed'} replace />;
}

function OnboardingRoute({
  type,
  children,
}: {
  type: 'studio' | 'pro';
  children: ReactNode;
}) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.user_type !== type) {
    return <Navigate to={profile.user_type === 'studio' ? '/onboarding/studio' : '/onboarding/pro'} replace />;
  }

  if (profile.onboarding_complete) {
    return <Navigate to={profile.user_type === 'studio' ? '/studio/dashboard' : '/pro/feed'} replace />;
  }

  return <>{children}</>;
}

function RoleLayout({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  if (profile?.user_type === 'studio') {
    return <StudioLayout>{children}</StudioLayout>;
  }
  return <ProLayout>{children}</ProLayout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={(
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            )}
          />
          <Route
            path="/invitation"
            element={(
              <PublicOnlyRoute>
                <InvitationLandingPage />
              </PublicOnlyRoute>
            )}
          />
          <Route
            path="/invite/:code"
            element={(
              <PublicOnlyRoute>
                <InvitationLandingPage />
              </PublicOnlyRoute>
            )}
          />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          <Route
            path="/onboarding/studio"
            element={(
              <OnboardingRoute type="studio">
                <OnboardingPage />
              </OnboardingRoute>
            )}
          />
          <Route
            path="/onboarding/pro"
            element={(
              <OnboardingRoute type="pro">
                <OnboardingPage />
              </OnboardingRoute>
            )}
          />

          <Route
            path="/chat"
            element={(
              <ProtectedRoute>
                <ChatWrapperPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/chat/:conversationId"
            element={(
              <ProtectedRoute>
                <ChatWrapperPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/notifications"
            element={(
              <ProtectedRoute>
                <RoleLayout>
                  <NotificationsPage />
                </RoleLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/saved"
            element={(
              <ProtectedRoute>
                <RoleLayout>
                  <SavedPage />
                </RoleLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/missions/:id"
            element={(
              <ProtectedRoute>
                <RoleLayout>
                  <MissionDetailPage />
                </RoleLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/mission/:missionId"
            element={(
              <ProtectedRoute requiredType="pro">
                <ProLayout>
                  <MissionDetailPage />
                </ProLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/missions/:id/applications"
            element={(
              <ProtectedRoute requiredType="studio">
                <RoleLayout>
                  <ManageApplicationsPage />
                </RoleLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/pro/public/:proId"
            element={(
              <ProtectedRoute requiredType="studio">
                <StudioLayout>
                  <ProPublicProfilePage />
                </StudioLayout>
              </ProtectedRoute>
            )}
          />
          <Route path="/admin" element={<AdminPage />} />

          <Route element={<ProtectedRoute requiredType="studio"><StudioLayout /></ProtectedRoute>}>
            <Route path="/studio/dashboard" element={<StudioDashboardPage />} />
            <Route path="/studio/missions" element={<StudioDashboardPage />} />
            <Route path="/studio/create-mission" element={<CreateMissionPage />} />
            <Route path="/studio/missions/create" element={<CreateMissionPage />} />
            <Route path="/studio/missions/:id" element={<MissionDetailPage />} />
            <Route path="/studio/missions/:id/edit" element={<CreateMissionPage />} />
            <Route path="/studio/applications/:missionId" element={<ManageApplicationsPage />} />
            <Route path="/studio/missions/:id/applications" element={<ManageApplicationsPage />} />
            <Route path="/studio/profile" element={<StudioProfilePage />} />
            <Route path="/studio/settings" element={<StudioProfilePage />} />
            <Route path="/studio/calendrier" element={<CalendarPage />} />
          </Route>

          <Route element={<ProtectedRoute requiredType="pro"><ProLayout /></ProtectedRoute>}>
            <Route path="/pro/feed" element={<ProFeedPage />} />
            <Route path="/pro/dashboard" element={<ProDashboardPage />} />
            <Route path="/pro/applications" element={<ProApplicationsPage />} />
            <Route path="/pro/profile" element={<ProProfilePage />} />
            <Route path="/pro/profile/:id" element={<ProProfilePage />} />
            <Route path="/pro/settings" element={<ProProfilePage />} />
            <Route path="/pro/missions/:id" element={<MissionDetailPage />} />
            <Route path="/pro/calendrier" element={<CalendarPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Toaster />
    </BrowserRouter>
  );
}
