import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Plus, Search, SendHorizonal } from 'lucide-react';
import { ActionModal } from '../components/common/ActionModal';
import { useNotifications } from '../components/notifications/NotificationToast';
import { formatHubDateTime } from '../lib/utils';
import { useAuthStore } from '../store/auth';
import { useTeacherHubStore } from '../store/teacherHub';

export const MessagesPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role === 'STUDENT';
  const classes = useTeacherHubStore((state) => state.classes);
  const conversations = useTeacherHubStore((state) => state.directConversations);
  const openDirectConversation = useTeacherHubStore((state) => state.openDirectConversation);
  const sendDirectMessage = useTeacherHubStore((state) => state.sendDirectMessage);
  const { addNotification } = useNotifications();

  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [composeClassId, setComposeClassId] = useState('');
  const [composeParticipantId, setComposeParticipantId] = useState('');
  const [composeError, setComposeError] = useState('');
  const [sendError, setSendError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const threadEndRef = React.useRef<HTMLDivElement>(null);

  const chatTargetsByClass = useMemo(() => (
    classes.map((entry) => ({
      classId: entry.id,
      className: entry.name,
      participants: isStudent
        ? (entry.teachers || []).map((teacher) => ({
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
        }))
        : entry.students.map((student) => ({
          id: student.id,
          name: student.name,
          email: student.email,
        })),
    }))
  ), [classes, isStudent]);

  const composeParticipants = useMemo(() => {
    const targetClass = chatTargetsByClass.find((entry) => entry.classId === composeClassId);
    return targetClass?.participants || [];
  }, [chatTargetsByClass, composeClassId]);

  const filteredConversations = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return conversations;
    return conversations.filter((conversation) => (
      `${conversation.participantName} ${conversation.participantEmail} ${conversation.className} ${conversation.lastMessagePreview}`
        .toLowerCase()
        .includes(normalized)
    ));
  }, [conversations, searchQuery]);

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  // Auto-scroll to bottom when messages arrive
  const activeMessages = conversations.find((c) => c.id === selectedConversationId)?.messages;
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages?.length]);

  useEffect(() => {
    if (!composeClassId) {
      setComposeParticipantId('');
      return;
    }
    if (composeParticipants.length === 1) {
      setComposeParticipantId(composeParticipants[0].id);
      return;
    }
    if (composeParticipantId && composeParticipants.some((entry) => entry.id === composeParticipantId)) return;
    setComposeParticipantId('');
  }, [composeClassId, composeParticipantId, composeParticipants]);

  const activeConversation = conversations.find((entry) => entry.id === selectedConversationId) || null;
  const hasMobileThreadOpen = Boolean(activeConversation);

  const handleCreateConversation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!composeClassId || !composeParticipantId) {
      setComposeError('Class and recipient are required.');
      return;
    }

    try {
      setIsCreating(true);
      setComposeError('');
      const conversationId = await openDirectConversation(composeClassId, composeParticipantId);
      setSelectedConversationId(conversationId);
      setShowNewChat(false);
      setComposeClassId('');
      setComposeParticipantId('');
      addNotification({
        type: 'success',
        title: 'Chat ready',
        message: 'Conversation opened.',
        duration: 1800,
      });
    } catch (error) {
      setComposeError(error instanceof Error ? error.message : 'Could not create chat.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeConversation) return;
    const body = draftMessage.trim();
    if (!body) {
      setSendError('Write a message before sending.');
      return;
    }

    try {
      setIsSending(true);
      setSendError('');
      await sendDirectMessage(activeConversation.id, body);
      setDraftMessage('');
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Could not send message.');
    } finally {
      setIsSending(false);
    }
  };

  const renderConversationList = () => (
    <div className={`flex h-full flex-col ${hasMobileThreadOpen ? 'hidden md:flex' : 'flex'}`}>
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--hub-border)] px-4 py-4">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-primary)]">Recent chats</p>
        <button
          type="button"
          onClick={() => setShowNewChat(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--hub-primary)] text-[color:var(--hub-primary)]"
          aria-label="Start new chat"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-[color:var(--hub-border)] px-4 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--hub-muted)]" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search chats"
            className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-10 py-2.5 text-sm outline-none"
          />
        </div>
      </div>

      {filteredConversations.length === 0 ? (
        <div className="px-4 py-6 text-sm text-[color:var(--hub-muted)]">No recent conversations.</div>
      ) : (
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {filteredConversations.map((conversation) => {
            const selected = conversation.id === selectedConversationId;
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setSelectedConversationId(conversation.id)}
                className={`w-full rounded-2xl px-3 py-3 text-left transition ${
                  selected ? 'bg-[color:var(--hub-soft)]' : 'hover:bg-[color:var(--hub-soft)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--hub-text)]">{conversation.participantName}</p>
                    <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">{conversation.className}</p>
                  </div>
                  <p className="text-xs text-[color:var(--hub-muted)]">
                    {conversation.lastMessageAt ? formatHubDateTime(conversation.lastMessageAt) : ''}
                  </p>
                </div>
                <p className="mt-1 truncate text-sm text-[color:var(--hub-muted)]">
                  {conversation.lastMessagePreview || 'No messages yet.'}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderThread = () => (
    <div className={`h-full flex-col ${hasMobileThreadOpen ? 'flex' : 'hidden md:flex'}`}>
      {activeConversation ? (
        <>
          <div className="flex items-center gap-3 border-b border-[color:var(--hub-border)] px-4 py-4">
            <button
              type="button"
              onClick={() => setSelectedConversationId('')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--hub-border)] text-[color:var(--hub-muted)] md:hidden"
              aria-label="Back to conversations"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-sm font-semibold text-[color:var(--hub-text)]">{activeConversation.participantName}</p>
              <p className="text-xs text-[color:var(--hub-muted)]">{activeConversation.className}</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[color:var(--hub-soft)] px-4 py-4">
            {activeConversation.messages.length === 0 ? (
              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-[color:var(--hub-muted)]">
                No messages yet. Start the conversation.
              </div>
            ) : (
              activeConversation.messages.map((message) => {
                const isOwn = message.senderUserId === user?.id;
                return (
                  <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${
                        isOwn ? 'bg-[color:var(--hub-primary)] text-white' : 'bg-white text-[color:var(--hub-text)]'
                      }`}
                    >
                      {!isOwn ? <p className="mb-1 text-xs font-semibold text-[color:var(--hub-muted)]">{message.senderName}</p> : null}
                      <p>{message.body}</p>
                      <p className={`mt-1 text-[11px] ${isOwn ? 'text-white/80' : 'text-[color:var(--hub-muted)]'}`}>
                        {formatHubDateTime(message.sentAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={threadEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="grid gap-2 border-t border-[color:var(--hub-border)] bg-white px-4 py-3">
            {sendError ? <p className="text-xs text-[color:var(--edu-danger)]">{sendError}</p> : null}
            <div className="flex items-end gap-2">
              <textarea
                value={draftMessage}
                onChange={(event) => {
                  setDraftMessage(event.target.value);
                  if (sendError) setSendError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={2}
                placeholder={`Message ${activeConversation.participantName}`}
                className="min-h-[44px] flex-1 resize-none rounded-2xl border border-[color:var(--hub-border)] px-3 py-2.5 text-sm outline-none"
              />
              <button
                type="submit"
                disabled={isSending}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--hub-primary)] text-white disabled:opacity-60"
                aria-label="Send message"
              >
                <SendHorizonal className="h-4 w-4" />
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="hidden h-full items-center justify-center text-sm text-[color:var(--hub-muted)] md:flex">
          Select a conversation to start chatting.
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Inbox</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--hub-text)]">
          {isStudent ? 'Message your teachers.' : 'Message your learners.'}
        </h2>
      </section>

      <section className="h-[72vh] rounded-[32px] border border-[color:var(--hub-border)] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="grid h-full md:grid-cols-[340px_1fr]">
          <div className="h-full border-r border-[color:var(--hub-border)] md:block">{renderConversationList()}</div>
          <div className="h-full">{renderThread()}</div>
        </div>
      </section>

      <ActionModal
        isOpen={showNewChat}
        title="Start chat"
        description={isStudent ? 'Pick a class and teacher.' : 'Pick a class and learner.'}
        onClose={() => {
          setShowNewChat(false);
          setComposeError('');
          setComposeClassId('');
          setComposeParticipantId('');
        }}
      >
        <form onSubmit={handleCreateConversation} className="grid gap-4">
          {composeError ? <p className="text-xs text-[color:var(--edu-danger)]">{composeError}</p> : null}
          <select
            value={composeClassId}
            onChange={(event) => {
              setComposeClassId(event.target.value);
              if (composeError) setComposeError('');
            }}
            className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 text-sm outline-none"
          >
            <option value="">Select class</option>
            {chatTargetsByClass
              .filter((entry) => entry.participants.length > 0)
              .map((entry) => (
                <option key={entry.classId} value={entry.classId}>{entry.className}</option>
              ))}
          </select>
          <select
            value={composeParticipantId}
            onChange={(event) => {
              setComposeParticipantId(event.target.value);
              if (composeError) setComposeError('');
            }}
            disabled={!composeClassId || composeParticipants.length === 0}
            className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 text-sm outline-none disabled:opacity-60"
          >
            <option value="">
              {composeClassId
                ? (composeParticipants.length > 0 ? 'Select recipient' : 'No recipients in this class')
                : 'Select class first'}
            </option>
            {composeParticipants.map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.name}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isCreating ? 'Opening...' : 'Open chat'}
          </button>
        </form>
      </ActionModal>
    </div>
  );
};
