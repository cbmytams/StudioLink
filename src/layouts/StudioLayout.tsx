import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/ui/BottomNav';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { GlobalSearchBar } from '@/components/shared/GlobalSearchBar';
import { DesktopNav } from '@/components/shared/DesktopNav';

export default function StudioLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen relative pb-24">
      <GlobalSearchBar userType="studio" />
      <DesktopNav userType="studio" />

      {/* Floating Notification Bell */}
      <div className="fixed top-4 right-4 z-50 md:top-6 md:right-8">
        <NotificationBell userType="studio" />
      </div>

      {children || <Outlet />}
      
      <BottomNav userType="studio" />
    </div>
  );
}
