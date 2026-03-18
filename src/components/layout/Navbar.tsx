import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';

type NavLink = {
  label: string;
  to: string;
  activePrefixes: string[];
};

function NavItem({
  label,
  to,
  activePrefixes,
  pathname,
  onNavigate,
}: NavLink & { pathname: string; onNavigate: (to: string) => void }) {
  const isActive = activePrefixes.some((prefix) => pathname.startsWith(prefix));

  return (
    <button
      type="button"
      onClick={() => onNavigate(to)}
      className={`whitespace-nowrap text-sm transition-colors ${
        isActive
          ? 'text-white font-medium'
          : 'text-white/60 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { profile } = useAuth();

  const profileType = (profile as { type?: 'studio' | 'pro' | 'admin'; user_type?: 'studio' | 'pro' } | null)?.type
    ?? (profile as { user_type?: 'studio' | 'pro' } | null)?.user_type
    ?? null;

  const handleHome = () => {
    if (profileType === 'studio') {
      navigate('/studio/dashboard');
      return;
    }
    if (profileType === 'pro') {
      navigate('/pro/dashboard');
      return;
    }
    navigate('/');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  const studioLinks: NavLink[] = [
    {
      label: 'Missions',
      to: '/studio/dashboard',
      activePrefixes: ['/studio/dashboard', '/studio/missions', '/studio/applications'],
    },
    {
      label: 'Créer une mission',
      to: '/studio/create-mission',
      activePrefixes: ['/studio/create-mission', '/studio/missions/create'],
    },
    {
      label: 'Mon profil',
      to: '/studio/profile',
      activePrefixes: ['/studio/profile', '/studio/settings'],
    },
  ];

  const proLinks: NavLink[] = [
    {
      label: 'Feed',
      to: '/pro/feed',
      activePrefixes: ['/pro/feed'],
    },
    {
      label: 'Mes candidatures',
      to: '/pro/dashboard',
      activePrefixes: ['/pro/dashboard', '/pro/applications'],
    },
    {
      label: 'Mon profil',
      to: '/pro/profile',
      activePrefixes: ['/pro/profile', '/pro/settings'],
    },
  ];

  const links = profileType === 'studio' ? studioLinks : profileType === 'pro' ? proLinks : [];

  return (
    <nav className="sticky top-0 z-40 h-14 border-b border-white/10 bg-[#0D0D0F]/80 backdrop-blur">
      <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-between px-4">
        <button
          type="button"
          onClick={handleHome}
          className="text-lg font-semibold tracking-tight bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent"
        >
          frapppe
        </button>

        <div className="ml-4 flex flex-1 items-center justify-end gap-3 overflow-x-auto">
          {links.map((link) => (
            <NavItem
              key={link.label}
              label={link.label}
              to={link.to}
              activePrefixes={link.activePrefixes}
              pathname={pathname}
              onNavigate={(to) => navigate(to)}
            />
          ))}
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="whitespace-nowrap text-sm text-white/40 transition-colors hover:text-red-400"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
}

