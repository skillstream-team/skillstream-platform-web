import React from 'react';

interface LiveSetupPanelProps {
  isTeacher: boolean;
  notes: string;
  onNotesChange: (value: string) => void;
  onJoin: () => void;
  isJoining: boolean;
  isDisabled: boolean;
}

export const LiveSetupPanel: React.FC<LiveSetupPanelProps> = ({
  isTeacher,
  notes,
  onNotesChange,
  onJoin,
  isJoining,
  isDisabled,
}) => {
  return (
    <div className="grid gap-4">
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
