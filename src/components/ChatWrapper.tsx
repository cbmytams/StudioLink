import { useAppStore } from '@/store/useAppStore';
import StudioLayout from '@/layouts/StudioLayout';
import ProLayout from '@/layouts/ProLayout';
import ChatPage from '@/pages/ChatPage';

export default function ChatWrapper() {
  const { userType } = useAppStore();

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
