import { supabase, hasSupabaseConfig } from './supabase';
import type { ClassMessage, DirectConversationMessage } from '../data/teacherHub';

type Unsubscribe = () => void;

export function subscribeToMessages(
  userId: string,
  onDirect: (conversationId: string, message: DirectConversationMessage) => void,
  onClass: (classId: string, message: ClassMessage) => void,
): Unsubscribe {
  if (!hasSupabaseConfig) return () => {};

  const channel = supabase
    .channel(`ss-messages-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'direct_messages' },
      (payload) => {
        const row = payload.new as {
          id: string;
          conversation_id: string;
          sender_user_id: string;
          sender_display_name: string;
          body: string;
          created_at: string;
        };
        if (row.sender_user_id === userId) return; // own messages are added optimistically
        onDirect(row.conversation_id, {
          id: row.id,
          conversationId: row.conversation_id,
          senderUserId: row.sender_user_id,
          senderName: row.sender_display_name || 'Unknown',
          body: row.body,
          sentAt: row.created_at || new Date().toISOString(),
          syncStatus: 'synced',
        });
      },
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'class_messages' },
      (payload) => {
        const row = payload.new as {
          id: string;
          class_id: string;
          sender_user_id: string;
          sender_display_name: string;
          sender_role: 'teacher' | 'student' | 'system';
          body: string;
          created_at: string;
        };
        if (row.sender_user_id === userId) return;
        onClass(row.class_id, {
          id: row.id,
          sender: row.sender_display_name || 'Unknown',
          role: row.sender_role || 'teacher',
          body: row.body,
          sentAt: row.created_at || new Date().toISOString(),
          syncStatus: 'synced',
        });
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
