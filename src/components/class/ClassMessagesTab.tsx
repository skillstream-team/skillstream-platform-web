import React, { useState } from 'react';
import { Megaphone, Plus } from 'lucide-react';
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
  onOpenMessageModal: () => void;
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
  onOpenMessageModal,
  onCloseMessageModal,
}) => {
  const { addNotification } = useNotifications();
  const [messageError, setMessageError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messages = [...teacherClass.messages].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
  );

  return (
    <>
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
            <Megaphone className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em]">Announcements</p>
          </div>
          {!isStudent && (
            <button
              type="button"
              onClick={onOpenMessageModal}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Post announcement
            </button>
          )}
        </div>

        {isStudent && (
          <p className="mt-2 text-sm text-[color:var(--hub-muted)]">
            Announcements posted by your teacher appear here.
          </p>
        )}

        <div className="mt-6 grid gap-4">
          {messages.length > 0 ? (
            messages.map((message) => (
              <div
                key={message.id}
                className="rounded-[24px] border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--hub-primary)] text-xs font-bold text-white">
                      {message.sender.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-[color:var(--hub-text)]">{message.sender}</span>
                  </div>
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">
                    {formatHubDateTime(message.sentAt)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--hub-text)]">{message.body}</p>
                {message.syncStatus === 'pending' && (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--hub-primary)]">
                    Sending…
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-[24px] border border-dashed border-[color:var(--hub-border)] py-12 text-center">
              <Megaphone className="h-8 w-8 text-[color:var(--hub-muted)]" />
              <p className="text-sm font-medium text-[color:var(--hub-muted)]">
                {isStudent ? 'No announcements yet.' : 'No announcements posted yet.'}
              </p>
              {!isStudent && (
                <button
                  type="button"
                  onClick={onOpenMessageModal}
                  className="mt-1 rounded-full border border-[color:var(--hub-border)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--hub-text)] transition hover:border-[color:var(--hub-primary)] hover:text-[color:var(--hub-primary)]"
                >
                  Post your first announcement
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <ActionModal
        isOpen={showMessageModal && !isStudent}
        title="Post announcement"
        description="Send a message to everyone in this class."
        onClose={onCloseMessageModal}
      >
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!classDraft.trim()) { setMessageError('Announcement text is required.'); return; }
            try {
              setIsSending(true);
              setMessageError('');
              await sendClassMessage(teacherClass.id, classDraft.trim());
              clearDraft();
              onCloseMessageModal();
              addNotification({ type: 'success', title: 'Announcement posted', message: 'Your class has been notified.', duration: 2200 });
            } catch (error) {
              setMessageError(error instanceof Error ? error.message : 'Could not send announcement.');
            } finally {
              setIsSending(false);
            }
          }}
        >
          <textarea
            value={classDraft}
            onChange={(e) => { onDraftChange(e.target.value); if (messageError) setMessageError(''); }}
            rows={5}
            placeholder="Write your announcement…"
            className="w-full rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 text-sm outline-none focus:border-[color:var(--hub-primary)]"
            autoFocus
          />
          {messageError && <p className="text-xs text-[color:var(--edu-danger)]">{messageError}</p>}
          <button
            type="submit"
            disabled={isSending}
            className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSending ? 'Posting…' : 'Post announcement'}
          </button>
        </form>
      </ActionModal>
    </>
  );
};
