/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import InvitationPage from "./pages/InvitationPage";
import StudioOnboarding from "./pages/StudioOnboarding";
import ProOnboarding from "./pages/ProOnboarding";
import StudioDashboard from "./pages/StudioDashboard";
import CreateMission from "./pages/CreateMission";
import ManageApplications from "./pages/ManageApplications";
import ProFeed from "./pages/ProFeed";
import ProApplications from "./pages/ProApplications";
import MissionDetail from "./pages/MissionDetail";
import CalendarPage from "./pages/CalendarPage";
import StudioProfile from "./pages/StudioProfile";
import ProProfile from "./pages/ProProfile";
import StudioLayout from "./layouts/StudioLayout";
import ProLayout from "./layouts/ProLayout";
import ChatWrapper from "./components/ChatWrapper";
import { useAppStore } from "./store/useAppStore";
import { useOnboardingStore } from "./store/useOnboardingStore";

function ProtectedRoute({ children, allowedType }: { children: React.ReactNode, allowedType: 'studio' | 'pro' }) {
  const { userType } = useAppStore();
  const { onboardingComplete } = useOnboardingStore();
  
  if (!userType) return <Navigate to="/invitation" replace />;
  if (userType !== allowedType) return <Navigate to={userType === 'studio' ? '/dashboard' : '/pro/feed'} replace />;
  if (!onboardingComplete) return <Navigate to={userType === 'studio' ? '/onboarding/studio' : '/onboarding/pro'} replace />;
  
  return <>{children}</>;
}

export default function App() {
  const { userType } = useAppStore();
  const { onboardingComplete } = useOnboardingStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/invitation" replace />} />
        <Route path="/invitation" element={<InvitationPage />} />
        <Route path="/login" element={<Login />} />
        
        {/* Onboarding Routes */}
        <Route path="/onboarding/studio" element={
          userType === 'studio' && !onboardingComplete ? <StudioOnboarding /> : <Navigate to="/dashboard" replace />
        } />
        <Route path="/onboarding/pro" element={
          userType === 'pro' && !onboardingComplete ? <ProOnboarding /> : <Navigate to="/pro/feed" replace />
        } />
        
        {/* Chat Route (Dynamic Layout) */}
        <Route path="/chat/:sessionId" element={<ChatWrapper />} />

        {/* Studio Routes */}
        <Route element={<StudioLayout />}>
          <Route path="/dashboard" element={<StudioDashboard />} />
          <Route path="/studio/mission/create" element={<CreateMission />} />
          <Route path="/studio/mission/:id/candidatures" element={<ManageApplications />} />
          <Route path="/studio/calendrier" element={<CalendarPage />} />
          <Route path="/studio/profil" element={<StudioProfile />} />
        </Route>

        {/* Pro Routes */}
        <Route element={<ProLayout />}>
          <Route path="/pro/feed" element={<ProFeed />} />
          <Route path="/pro/mes-candidatures" element={<ProApplications />} />
          <Route path="/pro/mission/:id" element={<MissionDetail />} />
          <Route path="/pro/calendrier" element={<CalendarPage />} />
          <Route path="/pro/profil" element={<ProProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
