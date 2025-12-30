// src/hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { socketService } from '@/services/socketService';

export function useSocket() {
  const socketRef = useRef<ReturnType<typeof socketService.connect> | null>(null);

  useEffect(() => {
    // Connect on mount
    socketRef.current = socketService.connect();

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected: socketService.isConnected(),
    joinConversation: socketService.joinConversation.bind(socketService),
    leaveConversation: socketService.leaveConversation.bind(socketService),
    sendMessage: socketService.sendMessage.bind(socketService),
    on: socketService.on.bind(socketService),
    off: socketService.off.bind(socketService),
  };
}

