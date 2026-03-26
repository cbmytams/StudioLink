import { Briefcase, LayoutDashboard, MessageCircle, User, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

type DesktopNavProps = {
  userType: 'studio' | 'pro';
};

type NavItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
};

function isActivePath(currentPath: string, itemPath: string): boolean {
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

export function DesktopNav({ userType }: DesktopNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const items: NavItem[] = userType === 'studio'
    ? [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Missions', path: '/studio/missions', icon: Briefcase },
        { label: 'Pros', path: '/pros', icon: Users },
        { label: 'Chat', path: '/chat', icon: MessageCircle },
        { label: 'Profil', path: '/studio/profile', icon: User },
      ]
    : [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Missions', path: '/missions', icon: Briefcase },
        { label: 'Candidatures', path: '/pro/applications', icon: Users },
        { label: 'Chat', path: '/chat', icon: MessageCircle },
        { label: 'Profil', path: '/pro/profile', icon: User },
      ];

  return (
    <nav className="pointer-events-auto fixed left-1/2 top-6 z-40 hidden -translate-x-1/2 md:block">
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/35 p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        {items.map((item) => {
          const active = isActivePath(location.pathname, item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition',
                active
                  ? 'bg-orange-500 text-white shadow-[0_8px_20px_rgba(249,115,22,0.35)]'
                  : 'text-white/70 hover:bg-white/8 hover:text-white',
              )}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
