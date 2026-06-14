import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { ChatMessage } from '../../lib/liveFeatures';
import { cn } from '../../lib/utils';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSend }) => {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = () => {
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft('');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-white/30">No messages yet. Say hello!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={cn('flex flex-col gap-0.5', msg.isLocal ? 'items-end' : 'items-start')}>
              <span className="text-[11px] text-white/30">{msg.isLocal ? 'You' : msg.name}</span>
              <div
                className={cn('max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed', msg.isLocal ? 'bg-[color:var(--hub-primary)] text-white' : 'bg-white/10 text-white')}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Message everyone…"
            className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--hub-primary)] text-white disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
