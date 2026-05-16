import { useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { useTeacherHubStore } from '../store/teacherHub';
import { subscribeToMessages } from '../lib/realtime';

export function useRealtimeMessages(): void {
  const user = useAuthStore((state) => state.user);
  const receiveDirectMessage = useTeacherHubStore((state) => state.receiveDirectMessage);
  const receiveClassMessage = useTeacherHubStore((state) => state.receiveClassMessage);

  useEffect(() => {
    if (!user?.id) return;
    const isDemo = user.id.startsWith('demo-') || user.email.endsWith('@skillstream.demo');
    if (isDemo) return;

    const unsubscribe = subscribeToMessages(user.id, receiveDirectMessage, receiveClassMessage);
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, receiveDirectMessage, receiveClassMessage]);
}
