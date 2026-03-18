import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/ui/BottomNav';
import { NotificationBell } from '@/components/shared/NotificationBell';

export default function StudioLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen relative pb-24">
      {/* Floating Notification Bell */}
      <div className="fixed top-4 right-4 md:top-8 md:right-8 z-50">
        <NotificationBell userType="studio" />
      </div>

      {children || <Outlet />}
      
      <BottomNav userType="studio" />
    </div>
  );
}
