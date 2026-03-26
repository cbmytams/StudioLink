import { lazy, Suspense, type ReactNode, useEffect } from 'react';
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
import {
  getDashboardPath,
  isProfileIncomplete,
  resolveProfileType,
} from '@/lib/auth/profileCompleteness';
import { useAnalytics } from '@/hooks/useAnalytics';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const InvitationPage = lazy(() => import('@/pages/InvitationPage'));
const InvitationLandingPage = lazy(() => import('@/pages/InvitationLanding'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallback'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const OnboardingPage = lazy(() => import('@/pages/Onboarding'));
const StudioDashboardPage = lazy(() => import('@/pages/StudioDashboard'));
const MissionFormPage = lazy(() => import('@/pages/MissionForm'));
const StudioMissionsPage = lazy(() => import('@/pages/StudioMissions'));
const MissionDetailPage = lazy(() => import('@/pages/MissionDetail'));
const ManageApplicationsPage = lazy(() => import('@/pages/ManageApplications'));
const StudioProfilePage = lazy(() => import('@/pages/StudioProfile'));
const MissionsPage = lazy(() => import('@/pages/MissionsPage'));
const ProsPage = lazy(() => import('@/pages/ProsPage'));
const ProMissionsPage = lazy(() => import('@/pages/ProMissionsPage'));
const ProDashboardPage = lazy(() => import('@/pages/ProDashboard'));
const ProApplicationsPage = lazy(() => import('@/pages/ProApplications'));
const ProProfilePage = lazy(() => import('@/pages/ProProfile'));
const ProPublicProfilePage = lazy(() => import('@/pages/ProPublicProfile'));
const StudioPublicProfilePage = lazy(() => import('@/pages/StudioPublicProfile'));
const NewConversationPage = lazy(() => import('@/pages/NewConversation'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const ConversationListPage = lazy(() => import('@/pages/ConversationList'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const SavedPage = lazy(() => import('@/pages/SavedPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const HealthCheckPage = lazy(() => import('@/pages/HealthCheck'));
const PrivacyPage = lazy(() => import('@/pages/legal/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/legal/TermsPage'));
const LegalMentionsPage = lazy(() => import('@/pages/legal/LegalMentionsPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const StudioLayout = lazy(() => import('@/layouts/StudioLayout'));
const ProLayout = lazy(() => import('@/layouts/ProLayout'));
const CookieBanner = lazy(() => import('@/components/shared/CookieBanner').then((module) => ({ default: module.CookieBanner })));

type AppProfile = {
  user_type?: 'studio' | 'pro' | null;
  type?: 'studio' | 'pro' | null;
  full_name?: string | null;
  display_name?: string | null;
  bio?: string | null;
} | null;

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const appProfile = profile as AppProfile;

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <>{children}</>;
  }

  if (isProfileIncomplete(appProfile)) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to={getDashboardPath(resolveProfileType(appProfile))} replace />;
}

function OnboardingRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const appProfile = profile as AppProfile;

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!isProfileIncomplete(appProfile)) {
    return <Navigate to={getDashboardPath(resolveProfileType(appProfile))} replace />;
  }

  return <>{children}</>;
}

function RoleLayout({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const profileType = resolveProfileType(profile as AppProfile);
  if (profileType === 'studio') {
    return <StudioLayout>{children}</StudioLayout>;
  }
  return <ProLayout>{children}</ProLayout>;
}

function RoleMissionPage() {
  const { profile } = useAuth();
  const profileType = resolveProfileType(profile as AppProfile);
  if (profileType === 'studio') {
    return <ManageApplicationsPage />;
  }
  return <MissionDetailPage />;
}

function RoleDashboardPage() {
  const { profile } = useAuth();
  const profileType = resolveProfileType(profile as AppProfile);
  if (profileType === 'studio') {
    return <StudioDashboardPage />;
  }
  return <ProDashboardPage />;
}

export default function App() {
  const { session } = useAuth();
  const { identify } = useAnalytics();

  useEffect(() => {
    if (!session?.user?.id) return;
    identify();
  }, [identify, session?.user?.id]);

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
            path="/register"
            element={(
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            )}
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/invitation"
            element={(
              <PublicOnlyRoute>
                <InvitationPage />
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
          <Route path="/legal/privacy" element={<PrivacyPage />} />
          <Route path="/legal/terms" element={<TermsPage />} />
          <Route path="/legal/mentions" element={<LegalMentionsPage />} />

          <Route
            path="/onboarding"
            element={(
              <OnboardingRoute>
                <OnboardingPage />
              </OnboardingRoute>
            )}
          />
          <Route path="/onboarding/studio" element={<Navigate to="/onboarding" replace />} />
          <Route path="/onboarding/pro" element={<Navigate to="/onboarding" replace />} />

          <Route
            path="/chat"
            element={(
              <ProtectedRoute>
                <RoleLayout>
                  <ConversationListPage />
                </RoleLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/chat/:conversationId"
            element={(
              <ProtectedRoute>
                <RoleLayout>
                  <ChatPage />
                </RoleLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/studio/conversations"
            element={(
              <ProtectedRoute requiredType="studio">
                <RoleLayout>
                  <ConversationListPage />
                </RoleLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/studio/chat/:conversationId"
            element={(
              <ProtectedRoute requiredType="studio">
                <RoleLayout>
                  <ChatPage />
                </RoleLayout>
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
            path="/settings"
            element={(
              <ProtectedRoute>
                <RoleLayout>
                  <SettingsPage />
                </RoleLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute>
                <RoleLayout>
                  <RoleDashboardPage />
                </RoleLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/studio/settings"
            element={(
              <ProtectedRoute>
                <Navigate to="/settings" replace />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/pro/settings"
            element={(
              <ProtectedRoute>
                <Navigate to="/settings" replace />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/studio/new-conversation"
            element={(
              <ProtectedRoute>
                <RoleLayout>
                  <NewConversationPage />
                </RoleLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/sessions"
            element={(
              <ProtectedRoute>
                <Navigate to="/chat" replace />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/applications"
            element={(
              <ProtectedRoute requiredType="pro">
                <Navigate to="/pro/applications" replace />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/missions/new"
            element={(
              <ProtectedRoute requiredType="studio">
                <Navigate to="/studio/missions/new" replace />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/missions/:id/manage"
            element={(
              <ProtectedRoute requiredType="studio">
                <RoleLayout>
                  <ManageApplicationsPage />
                </RoleLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/missions/:id"
            element={(
              <ProtectedRoute>
                <RoleLayout>
                  <RoleMissionPage />
                </RoleLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/missions"
            element={(
              <ProtectedRoute requiredType="pro">
                <ProLayout>
                  <MissionsPage />
                </ProLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/pros"
            element={(
              <ProtectedRoute requiredType="studio">
                <StudioLayout>
                  <ProsPage />
                </StudioLayout>
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
            path="/pros/:id"
            element={<ProPublicProfilePage />}
          />
          <Route
            path="/pro/public/:id"
            element={<ProPublicProfilePage />}
          />
          <Route
            path="/studios/:id"
            element={<StudioPublicProfilePage />}
          />
          <Route
            path="/studio/public/:id"
            element={<StudioPublicProfilePage />}
          />
          <Route
            path="/admin"
            element={(
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            )}
          />
          <Route path="/health" element={<HealthCheckPage />} />

          <Route element={<ProtectedRoute requiredType="studio"><StudioLayout /></ProtectedRoute>}>
            <Route path="/studio/dashboard" element={<StudioDashboardPage />} />
            <Route path="/studio/missions" element={<StudioMissionsPage />} />
            <Route path="/studio/create-mission" element={<MissionFormPage />} />
            <Route path="/studio/missions/create" element={<MissionFormPage />} />
            <Route path="/studio/missions/new" element={<MissionFormPage />} />
            <Route path="/studio/missions/:id" element={<ManageApplicationsPage />} />
            <Route path="/studio/missions/:id/edit" element={<MissionFormPage />} />
            <Route path="/studio/applications/:missionId" element={<ManageApplicationsPage />} />
            <Route path="/studio/missions/:id/applications" element={<ManageApplicationsPage />} />
            <Route path="/studio/profile" element={<StudioProfilePage />} />
            <Route path="/studio/calendrier" element={<CalendarPage />} />
            <Route path="/studio/search-pros" element={<ProsPage />} />
          </Route>

          <Route element={<ProtectedRoute requiredType="pro"><ProLayout /></ProtectedRoute>}>
            <Route path="/pro/feed" element={<MissionsPage />} />
            <Route path="/pro/missions" element={<ProMissionsPage />} />
            <Route path="/pro/dashboard" element={<ProDashboardPage />} />
            <Route path="/pro/applications" element={<ProApplicationsPage />} />
            <Route path="/pro/conversations" element={<ConversationListPage />} />
            <Route path="/pro/profile" element={<ProProfilePage />} />
            <Route path="/pro/profile/:id" element={<ProProfilePage />} />
            <Route path="/pro/missions/:id" element={<MissionDetailPage />} />
            <Route path="/pro/offer/:id" element={<MissionDetailPage />} />
            <Route path="/pro/calendrier" element={<CalendarPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toaster />
      <Suspense fallback={null}>
        <CookieBanner />
      </Suspense>
    </BrowserRouter>
  );
}
