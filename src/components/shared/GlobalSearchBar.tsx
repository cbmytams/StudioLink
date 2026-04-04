import { Search } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type GlobalSearchBarProps = {
  userType: 'studio' | 'pro';
  variant?: 'floating' | 'sidebar';
};

function targetPath(userType: 'studio' | 'pro'): string {
  return userType === 'studio' ? '/pros' : '/missions';
}

export function GlobalSearchBar({ userType, variant = 'floating' }: GlobalSearchBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const hiddenOnCurrentRoute = location.pathname === '/chat'
    || location.pathname.startsWith('/chat/')
    || location.pathname.startsWith('/studio/chat/');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQuery(params.get('q') ?? '');
  }, [location.search]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const value = query.trim();
    if (value) params.set('q', value);
    void navigate(`${targetPath(userType)}${params.toString() ? `?${params.toString()}` : ''}`);
  };

  if (hiddenOnCurrentRoute) {
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        variant === 'sidebar'
          ? 'w-full'
          : 'pointer-events-auto fixed left-4 right-20 top-4 z-40 md:hidden'
      }
    >
      <div className={`flex items-center gap-2 ${
        variant === 'sidebar'
          ? 'rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 backdrop-blur-xl shadow-[var(--shadow-float)]'
          : 'rounded-full border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-xl shadow-[var(--shadow-float)]'
      }`}>
        <label htmlFor="global-search-input" className="sr-only">
          {userType === 'studio' ? 'Rechercher un pro' : 'Rechercher une mission'}
        </label>
        <input
          id="global-search-input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={userType === 'studio' ? 'Rechercher un pro' : 'Rechercher une mission'}
          className="min-h-[var(--size-touch)] min-w-0 flex-1 bg-transparent text-base md:text-sm text-white placeholder:text-white/35 outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        />
        <button
          id="btn-global-search"
          type="submit"
          aria-label="Lancer la recherche globale"
          className="flex min-h-[var(--size-touch)] min-w-[var(--size-touch)] items-center justify-center rounded-full bg-orange-500 text-white transition hover:bg-orange-600"
        >
          <Search size={16} />
        </button>
      </div>
    </form>
  );
}
