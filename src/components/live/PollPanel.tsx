import React, { useState } from 'react';
import { BarChart2, Plus, Trash2 } from 'lucide-react';
import { Poll, PollResults } from '../../lib/liveFeatures';

interface PollPanelProps {
  isTeacher: boolean;
  activePoll: Poll | null;
  results: PollResults | null;
  myVote: number[] | null;
  onCreatePoll: (data: { question: string; options: string[]; allowMultiple: boolean }) => void;
  onVote: (optionIndices: number[]) => void;
  onClosePoll: () => void;
  onClearPoll: () => void;
}

export const PollPanel: React.FC<PollPanelProps> = ({
  isTeacher, activePoll, results, myVote,
  onCreatePoll, onVote, onClosePoll, onClearPoll,
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [pendingVote, setPendingVote] = useState<number[]>([]);

  const totalVotes = results
    ? Object.values(results).reduce((sum, voters) => sum + voters.length, 0)
    : 0;

  // ─── Active poll: results or voting ──────────────────────────────────────
  if (activePoll) {
    const showResults = isTeacher || myVote !== null;

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-white/10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
              {isTeacher ? 'Live poll' : 'Poll'}
            </p>
            <p className="mt-1 text-sm font-semibold text-white leading-snug">{activePoll.question}</p>
            <p className="mt-0.5 text-xs text-white/30">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
          </div>
          {isTeacher && (
            <div className="flex flex-col gap-1 ml-3 shrink-0">
              {results === null ? (
                <button
                  type="button"
                  onClick={onClosePoll}
                  className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/60 hover:border-white/30 hover:text-white"
                >
                  End poll
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClearPoll}
                  className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/60 hover:border-white/30 hover:text-white"
                >
                  New poll
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {showResults ? (
            activePoll.options.map((option, i) => {
              const count = results?.[i]?.length ?? 0;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const isMyAnswer = myVote?.includes(i);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm ${isMyAnswer ? 'font-semibold text-white' : 'text-white/70'}`}>
                      {option}
                      {isMyAnswer ? <span className="ml-1 text-[10px] text-[color:var(--hub-primary)]">✓ Your answer</span> : null}
                    </span>
                    <span className="text-xs text-white/40 ml-2 shrink-0">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[color:var(--hub-primary)] transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {isTeacher && results?.[i]?.length ? (
                    <p className="mt-0.5 text-[10px] text-white/25 truncate">
                      {results[i].slice(0, 3).join(', ')}{results[i].length > 3 ? ` +${results[i].length - 3}` : ''}
                    </p>
                  ) : null}
                </div>
              );
            })
          ) : (
            <>
              {activePoll.options.map((option, i) => {
                const selected = pendingVote.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (activePoll.allowMultiple) {
                        setPendingVote((v) => v.includes(i) ? v.filter((x) => x !== i) : [...v, i]);
                      } else {
                        setPendingVote([i]);
                      }
                    }}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      selected
                        ? 'border-[color:var(--hub-primary)] bg-[color:var(--hub-primary)]/20 text-white'
                        : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
              {activePoll.allowMultiple && (
                <p className="text-xs text-white/30">Select all that apply.</p>
              )}
              <button
                type="button"
                disabled={pendingVote.length === 0}
                onClick={() => { onVote(pendingVote); setPendingVote([]); }}
                className="w-full rounded-full bg-[color:var(--hub-primary)] py-2.5 text-sm font-semibold text-white disabled:opacity-40 transition"
              >
                Submit vote
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── No active poll: student waiting ────────────────────────────────────
  if (!isTeacher) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4">
        <BarChart2 className="h-9 w-9 text-white/15 mb-3" />
        <p className="text-sm text-white/30">No active poll.</p>
        <p className="mt-1 text-xs text-white/20">Your teacher will launch one soon.</p>
      </div>
    );
  }

  // ─── Teacher: create poll ────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-white/50">Question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            placeholder="Ask the class something…"
            className="w-full resize-none rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-white/50">Options</label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => setOptions((prev) => prev.map((o, j) => j === i ? e.target.value : o))}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/25 hover:bg-white/10 hover:text-white/60 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button
                type="button"
                onClick={() => setOptions((prev) => [...prev, ''])}
                className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Add option
              </button>
            )}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={allowMultiple}
            onChange={(e) => setAllowMultiple(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <span className="text-sm text-white/60">Allow multiple answers</span>
        </label>
      </div>

      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          disabled={!question.trim() || options.filter(Boolean).length < 2}
          onClick={() => {
            onCreatePoll({ question: question.trim(), options: options.filter(Boolean), allowMultiple });
            setQuestion('');
            setOptions(['', '']);
            setAllowMultiple(false);
          }}
          className="w-full rounded-full bg-[color:var(--hub-primary)] py-2.5 text-sm font-semibold text-white disabled:opacity-40 transition"
        >
          Launch poll
        </button>
      </div>
    </div>
  );
};
