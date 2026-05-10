import React from 'react';
import { Ticket, Users } from 'lucide-react';
import { LiveSessionMode } from '../../lib/dailyLive';

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
  return (
    <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Live session</p>
      <h3 className="mt-2 text-2xl font-semibold text-[color:var(--hub-text)]">{isTeacher ? 'Start lesson instantly.' : 'Join your live lesson.'}</h3>

      <div className="mt-5 grid gap-4">
        {isTeacher ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-[color:var(--hub-text)]">Session type</p>
            <div className="inline-flex rounded-full border border-[color:var(--hub-border)] p-1">
              <button
                type="button"
                onClick={() => onSessionModeChange('free')}
                disabled={!isTeacher}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${sessionMode === 'free' ? 'bg-[color:var(--hub-primary)] text-white' : 'text-[color:var(--hub-muted)]'}`}
              >
                <Users className="h-4 w-4" />
                Free session
              </button>
              <button
                type="button"
                onClick={() => onSessionModeChange('paid')}
                disabled={!isTeacher}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${sessionMode === 'paid' ? 'bg-[color:var(--hub-primary)] text-white' : 'text-[color:var(--hub-muted)]'}`}
              >
                <Ticket className="h-4 w-4" />
                Paid one-off
              </button>
            </div>
          </div>
        ) : null}

        {isTeacher ? (
          <div>
            {sessionMode === 'paid' ? (
              <>
                <label className="mb-2 block text-sm font-semibold text-[color:var(--hub-text)]" htmlFor="ticket-price">Ticket price (GBP)</label>
                <input
                  id="ticket-price"
                  type="number"
                  min={1}
                  step={1}
                  value={ticketPriceGBP}
                  onChange={(event) => onTicketPriceChange(Number(event.target.value) || 1)}
                  className="w-full rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 text-sm outline-none"
                />
              </>
            ) : null}
          </div>
        ) : null}

        {isTeacher ? (
          <div>
            <label className="mb-2 block text-sm font-semibold text-[color:var(--hub-text)]" htmlFor="lesson-notes">Lesson notes (optional)</label>
            <textarea
              id="lesson-notes"
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              rows={3}
              placeholder="What this live lesson covers"
              className="w-full rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 text-sm outline-none"
            />
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isDisabled || isJoining}
          onClick={onJoin}
          className="rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isJoining ? 'Starting...' : isTeacher ? 'Start lesson' : 'Join lesson'}
        </button>
      </div>
    </section>
  );
};
