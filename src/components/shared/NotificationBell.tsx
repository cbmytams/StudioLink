import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/supabase/auth';
import { useUnreadCount } from '@/hooks/useNotifications';

interface NotificationBellProps {
  userType: 'studio' | 'pro';
}

export function NotificationBell(_props: NotificationBellProps) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { unreadCount } = useUnreadCount(session?.user?.id);

  return (
    <button
      type="button"
      onClick={() => navigate('/notifications')}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/60 shadow-sm transition-colors hover:bg-white"
    >
      <Bell size={20} className="text-black/70" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-orange-500 px-1 text-center text-[10px] font-bold leading-[18px] text-white border-2 border-[#f4ece4]">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      ) : null}
    </button>
  );
}
