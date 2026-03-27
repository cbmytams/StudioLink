import { Briefcase, LayoutDashboard, MessageCircle, PlusCircle, User, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { GlobalSearchBar } from '@/components/shared/GlobalSearchBar';

type DesktopNavProps = {
  userType: 'studio' | 'pro';
};

type NavItem = {
  key: string;
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
};

function isActivePath(currentPath: string, itemKey: string): boolean {
  switch (itemKey) {
    case 'dashboard':
      return currentPath === '/dashboard';
    case 'missions':
      return currentPath.startsWith('/studio/missions')
        || currentPath.startsWith('/studio/create-mission')
        || currentPath.startsWith('/studio/missions/create')
        || currentPath.startsWith('/missions/new')
        || currentPath.startsWith('/missions/')
        || currentPath === '/missions';
    case 'pros':
      return currentPath === '/pros' || currentPath.startsWith('/pros/');
    case 'applications':
      return currentPath === '/pro/applications' || currentPath.startsWith('/applications');
    case 'chat':
      return currentPath === '/chat' || currentPath.startsWith('/chat/');
    case 'profile':
      return currentPath.startsWith('/pro/profile') || currentPath.startsWith('/studio/profile');
    default:
      return false;
  }
}

export function DesktopNav({ userType }: DesktopNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const items: NavItem[] = userType === 'studio'
    ? [
        { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { key: 'missions', label: 'Missions', path: '/studio/missions', icon: Briefcase },
        { key: 'pros', label: 'Pros', path: '/pros', icon: Users },
        { key: 'chat', label: 'Chat', path: '/chat', icon: MessageCircle },
        { key: 'profile', label: 'Profil', path: '/studio/profile', icon: User },
      ]
    : [
        { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { key: 'missions', label: 'Missions', path: '/missions', icon: Briefcase },
        { key: 'applications', label: 'Candidatures', path: '/pro/applications', icon: Users },
        { key: 'chat', label: 'Chat', path: '/chat', icon: MessageCircle },
        { key: 'profile', label: 'Profil', path: '/pro/profile', icon: User },
      ];

  return (
    <aside className="pointer-events-auto fixed inset-y-4 left-4 z-40 hidden w-[272px] md:flex">
      <div className="flex h-full w-full flex-col rounded-[28px] border border-white/10 bg-black/35 p-4 shadow-[0_12px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mb-4 flex w-full items-center gap-3 rounded-xl px-2 py-1 text-left transition hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          aria-label="Retour au dashboard"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-sm font-bold text-white shadow-[0_8px_20px_rgba(249,115,22,0.35)]">
            SL
          </div>
          <div>
            <p className="text-sm font-semibold text-white">StudioLink</p>
            <p className="text-xs text-white/45">
              {userType === 'studio' ? 'Espace studio' : 'Espace pro'}
            </p>
          </div>
        </button>

        <GlobalSearchBar userType={userType} variant="sidebar" />

        <nav className="mt-5 flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = isActivePath(location.pathname, item.key);
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition',
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
        </nav>

        <button
          type="button"
          onClick={() => navigate(userType === 'studio' ? '/studio/missions/new' : '/missions')}
          className="mt-4 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(249,115,22,0.28)] transition hover:bg-orange-400"
        >
          <PlusCircle size={16} />
          <span>{userType === 'studio' ? 'Publier une mission' : 'Explorer les missions'}</span>
        </button>
      </div>
    </aside>
  );
}
