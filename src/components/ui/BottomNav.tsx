import { Home, Plus, MessageCircle, User, Zap, List, Calendar } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  userType: 'studio' | 'pro';
}

export function BottomNav({ userType }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const studioTabs = [
    { icon: Home, label: 'Missions', path: '/dashboard' },
    { icon: Plus, label: 'Créer', path: '/studio/mission/create' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    { icon: User, label: 'Profil', path: '/studio/profil' },
  ];

  const proTabs = [
    { icon: Zap, label: 'Feed', path: '/pro/feed' },
    { icon: List, label: 'Candidatures', path: '/pro/mes-candidatures' },
    { icon: Calendar, label: 'Calendrier', path: '/pro/calendrier' },
    { icon: User, label: 'Profil', path: '/pro/profil' },
  ];

  const tabs = userType === 'studio' ? studioTabs : proTabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#f4ece4]/80 backdrop-blur-md border-t border-black/5 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.path) && tab.path !== '/' || (tab.path === '/dashboard' && location.pathname === '/dashboard');
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center w-16 h-full gap-1"
            >
              <Icon 
                size={24} 
                className={cn(
                  "transition-colors duration-200",
                  isActive ? "text-orange-600" : "text-black/40"
                )} 
              />
              <span 
                className={cn(
                  "text-[10px] font-medium transition-colors duration-200",
                  isActive ? "text-orange-600" : "text-black/40"
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
