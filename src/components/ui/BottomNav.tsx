import { Home, Plus, MessageCircle, User, Zap, List } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/supabase/auth';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useUnreadMessages } from '@/hooks/useMessages';

interface BottomNavProps {
  userType: 'studio' | 'pro';
}

export function BottomNav({ userType }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { unreadCount } = useUnreadCount(session?.user?.id);
  const { data: unreadMessages = 0 } = useUnreadMessages(session?.user?.id);

  const studioTabs = [
    { icon: Home, label: 'Missions', path: '/studio/dashboard' },
    { icon: Plus, label: 'Créer', path: '/studio/missions/create' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    { icon: User, label: 'Profil', path: '/studio/profile' },
  ];

  const proTabs = [
    { icon: Zap, label: 'Feed', path: '/pro/feed' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    { icon: List, label: 'Candidatures', path: '/pro/applications' },
    { icon: User, label: 'Profil', path: '/pro/profile' },
  ];

  const tabs = userType === 'studio' ? studioTabs : proTabs;
  const isTabActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#f4ece4]/80 backdrop-blur-md border-t border-black/5 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {tabs.map((tab) => {
          const isActive = isTabActive(tab.path);
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center w-16 h-full gap-1"
            >
              <Icon 
                size={24} 
                className={cn(
                  "transition-colors duration-200",
                  isActive ? "text-orange-500" : "text-black/40"
                )} 
              />
              <span 
                className={cn(
                  "text-[10px] font-medium transition-colors duration-200",
                  isActive ? "text-orange-500" : "text-black/40"
                )}
              >
                {tab.label}
              </span>
              {tab.path === '/chat' && unreadMessages > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-[18px] text-white border-2 border-[#f4ece4]">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              ) : null}
              {tab.path.includes('/profile') && unreadCount > 0 ? (
                <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
