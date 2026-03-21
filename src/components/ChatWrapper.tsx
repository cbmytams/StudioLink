import { useAuth } from '@/lib/supabase/auth';
import StudioLayout from '@/layouts/StudioLayout';
import ProLayout from '@/layouts/ProLayout';
import ChatPage from '@/pages/ChatPage';

export default function ChatWrapper() {
  const { profile } = useAuth();
  const userType = (
    profile as { user_type?: 'studio' | 'pro' | null; type?: 'studio' | 'pro' | null } | null
  )?.user_type
    ?? (
      profile as { user_type?: 'studio' | 'pro' | null; type?: 'studio' | 'pro' | null } | null
    )?.type
    ?? 'pro';

  if (userType === 'studio') {
    return (
      <StudioLayout>
        <ChatPage />
      </StudioLayout>
    );
  }

  return (
    <ProLayout>
      <ChatPage />
    </ProLayout>
  );
}
