import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/ui/BottomNav';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { GlobalSearchBar } from '@/components/shared/GlobalSearchBar';
import { DesktopNav } from '@/components/shared/DesktopNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function StudioLayout({ children }: { children?: React.ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div className="relative min-h-[var(--size-full-dvh)] pb-24 md:pb-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-toast focus:rounded focus:bg-white focus:p-2 focus:text-black"
      >
        Aller au contenu principal
      </a>

      <header>
        {isMobile ? <GlobalSearchBar userType="studio" /> : null}
        <DesktopNav userType="studio" />
        <div className="fixed right-4 top-4 z-toast md:right-6 md:top-6">
          <NotificationBell userType="studio" />
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="md:pl-[var(--layout-sidebar-offset)] md:pr-6 lg:pr-8">
        {children || <Outlet />}
      </main>

      <footer className="sr-only">Pied de page StudioLink</footer>
      
      {isMobile ? <BottomNav userType="studio" /> : null}
    </div>
  );
}
