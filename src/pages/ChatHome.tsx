import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { useConversations } from '@/hooks/useMessages';
import LoadingScreen from '@/components/LoadingScreen';

export default function ChatHome() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: conversations = [], isLoading } = useConversations(session?.user?.id);

  useEffect(() => {
    if (!isLoading) {
      const first = conversations[0];
      if (first) {
        navigate(`/chat/${first.id}`, { replace: true });
      } else {
        navigate('/pro/feed', { replace: true });
      }
    }
  }, [conversations, isLoading, navigate]);

  return <LoadingScreen />;
}
