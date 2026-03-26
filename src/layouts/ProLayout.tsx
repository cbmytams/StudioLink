import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/ui/BottomNav';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { GlobalSearchBar } from '@/components/shared/GlobalSearchBar';
import { DesktopNav } from '@/components/shared/DesktopNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function ProLayout({ children }: { children?: React.ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div className="min-h-screen relative pb-24">
      <GlobalSearchBar userType="pro" />
      <DesktopNav userType="pro" />

      {/* Floating Notification Bell */}
      <div className="fixed top-4 right-4 z-50 md:top-6 md:right-8">
        <NotificationBell userType="pro" />
      </div>

      {children || <Outlet />}
      
      {isMobile ? <BottomNav userType="pro" /> : null}
    </div>
  );
}
