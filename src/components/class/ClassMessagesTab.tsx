import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { ActionModal } from '../common/ActionModal';
import { useNotifications } from '../notifications/NotificationToast';
import { formatHubDateTime } from '../../lib/utils';
import { TeacherClass } from '../../data/teacherHub';

interface Props {
  teacherClass: TeacherClass;
  isStudent: boolean;
  classDraft: string;
  onDraftChange: (value: string) => void;
  sendClassMessage: (classId: string, body: string) => Promise<void>;
  clearDraft: () => void;
  showMessageModal: boolean;
  onCloseMessageModal: () => void;
}

export const ClassMessagesTab: React.FC<Props> = ({
  teacherClass,
  isStudent,
  classDraft,
  onDraftChange,
  sendClassMessage,
  clearDraft,
  showMessageModal,
  onCloseMessageModal,
}) => {
  const { addNotification } = useNotifications();
  const [messageError, setMessageError] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  return (
    <>
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
            <MessageSquare className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em]">Class communication</p>
          </div>
          {!isStudent ? (
            <button type="button" onClick={onCloseMessageModal} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white">Send announcement</button>
          ) : null}
        </div>
        <div className="mt-5 grid gap-4">
          {teacherClass.messages.length > 0 ? (
            teacherClass.messages.map((message) => (
              <div key={message.id} className="rounded-[24px] border border-[color:var(--hub-border)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-[color:var(--hub-text)]">{message.sender}</p>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--hub-muted)]">{formatHubDateTime(message.sentAt)}</p>
                </div>
                <p className="mt-3 text-sm text-[color:var(--hub-muted)]">{message.body}</p>
                {message.syncStatus === 'pending' ? (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-primary)]">Sending...</p>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-[24px] bg-[color:var(--hub-soft)] p-4 text-sm text-[color:var(--hub-muted)]">No class messages yet.</div>
          )}
        </div>
      </section>

      <ActionModal isOpen={showMessageModal && !isStudent} title="Send announcement" description="Post an update to everyone in this class." onClose={onCloseMessageModal}>
        <form className="grid gap-4" onSubmit={async (event) => {
          event.preventDefault();
          if (!classDraft.trim()) { setMessageError('Message body is required.'); return; }
          try {
            setIsSendingMessage(true);
            setMessageError('');
            await sendClassMessage(teacherClass.id, classDraft.trim());
            clearDraft();
            onCloseMessageModal();
            addNotification({ type: 'success', title: 'Announcement sent', message: 'Your class has been notified.', duration: 2200 });
          } catch (error) {
            setMessageError(error instanceof Error ? error.message : 'Could not send message.');
          } finally {
            setIsSendingMessage(false);
          }
        }}>
          <textarea value={classDraft} onChange={(e) => { onDraftChange(e.target.value); if (messageError) setMessageError(''); }} rows={5} placeholder="Write your announcement" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          {messageError ? <p className="text-xs text-[color:var(--edu-danger)]">{messageError}</p> : null}
          <button type="submit" disabled={isSendingMessage} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isSendingMessage ? 'Sending...' : 'Send message'}</button>
        </form>
      </ActionModal>
    </>
  );
};
