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
    <div className="relative min-h-[100dvh] pb-24 md:pb-0">
      {isMobile ? <GlobalSearchBar userType="pro" /> : null}
      <DesktopNav userType="pro" />

      <div className="fixed right-4 top-4 z-50 md:right-6 md:top-6">
        <NotificationBell userType="pro" />
      </div>

      <div className="md:pl-[304px] md:pr-6 lg:pr-8">
        {children || <Outlet />}
      </div>
      
      {isMobile ? <BottomNav userType="pro" /> : null}
    </div>
  );
}
