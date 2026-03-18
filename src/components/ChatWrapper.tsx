import { useAuth } from '@/auth/AuthProvider';
import StudioLayout from '@/layouts/StudioLayout';
import ProLayout from '@/layouts/ProLayout';
import ChatPage from '@/pages/ChatPage';

export default function ChatWrapper() {
  const { profile } = useAuth();
  const userType = profile?.user_type ?? 'pro';

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
