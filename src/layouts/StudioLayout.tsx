import React from 'react';
import { Outlet } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { BottomNav } from '@/components/ui/BottomNav';

export default function StudioLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen relative pb-24">
      {/* Floating Notification Bell */}
      <div className="fixed top-4 right-4 md:top-8 md:right-8 z-50">
        <button className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md border border-white/50 flex items-center justify-center shadow-sm hover:bg-white/80 transition-colors relative">
          <Bell size={20} className="text-black/70" />
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-orange-500 border-2 border-[#f4ece4] rounded-full" />
        </button>
      </div>

      {children || <Outlet />}
      
      <BottomNav userType="studio" />
    </div>
  );
}
