import React from 'react';
import { Ticket, Users } from 'lucide-react';
import { LiveSessionMode } from '../../lib/signalwireLive';
import { useCurrencyStore } from '../../store/currency';

interface LiveSetupPanelProps {
  isTeacher: boolean;
  sessionMode: LiveSessionMode;
  ticketPriceGBP: number;
  notes: string;
  onSessionModeChange: (value: LiveSessionMode) => void;
  onTicketPriceChange: (value: number) => void;
  onNotesChange: (value: string) => void;
  onJoin: () => void;
  isJoining: boolean;
  isDisabled: boolean;
}

export const LiveSetupPanel: React.FC<LiveSetupPanelProps> = ({
  isTeacher,
  sessionMode,
  ticketPriceGBP,
  notes,
  onSessionModeChange,
  onTicketPriceChange,
  onNotesChange,
  onJoin,
  isJoining,
  isDisabled,
}) => {
  const currency = useCurrencyStore((state) => state.currency);
  return (
    <div className="grid gap-4">
      {isTeacher ? (
        <div>
          <p className="mb-2 text-sm font-semibold text-white/70">Session type</p>
          <div className="inline-flex rounded-full border border-white/15 p-1">
            <button
              type="button"
              onClick={() => onSessionModeChange('free')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${sessionMode === 'free' ? 'bg-[color:var(--hub-primary)] text-white' : 'text-white/50 hover:text-white'}`}
            >
              <Users className="h-4 w-4" />
              Free session
            </button>
            <button
              type="button"
              onClick={() => onSessionModeChange('paid')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${sessionMode === 'paid' ? 'bg-[color:var(--hub-primary)] text-white' : 'text-white/50 hover:text-white'}`}
            >
              <Ticket className="h-4 w-4" />
              Paid one-off
            </button>
          </div>
        </div>
      ) : null}

      {isTeacher && sessionMode === 'paid' ? (
        <div>
          <label className="mb-2 block text-sm font-semibold text-white/70" htmlFor="ticket-price">
            Ticket price ({currency})
          </label>
          <input
            id="ticket-price"
            type="number"
            min={1}
            step={1}
            value={ticketPriceGBP}
            onChange={(event) => onTicketPriceChange(Number(event.target.value) || 1)}
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
          />
        </div>
      ) : null}

      {isTeacher ? (
        <div>
          <label className="mb-2 block text-sm font-semibold text-white/70" htmlFor="lesson-notes">
            Lesson notes (optional)
          </label>
          <textarea
            id="lesson-notes"
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={3}
            placeholder="What this live lesson covers"
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
          />
        </div>
      ) : null}

      <button
        type="button"
        disabled={isDisabled || isJoining}
        onClick={onJoin}
        className="w-full rounded-full bg-[color:var(--hub-primary)] py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(27,74,128,0.35)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isJoining ? 'Connecting…' : 'Start lesson'}
      </button>
    </div>
  );
};
