import React from 'react';
import { DailyParticipant } from '@daily-co/daily-js';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { getInitials } from '../../lib/utils';

interface LiveParticipantsPanelProps {
  participants: DailyParticipant[];
  isTeacher?: boolean;
  onMuteParticipant?: (participant: DailyParticipant) => void;
  onRemoveParticipant?: (participant: DailyParticipant) => void;
  onMuteAll?: () => void;
}

const isTrackOn = (participant: DailyParticipant, track: 'audio' | 'video') => {
  const trackState = participant.tracks?.[track]?.state;
  if (trackState) {
    return trackState === 'playable';
  }
  const fallback = (participant as unknown as Record<string, unknown>)[track];
  return typeof fallback === 'boolean' ? fallback : false;
};

export const LiveParticipantsPanel: React.FC<LiveParticipantsPanelProps> = ({
  participants,
  isTeacher = false,
  onMuteParticipant,
  onRemoveParticipant,
  onMuteAll,
}) => {
  return (
    <aside className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--hub-primary)]">Participants</p>
          <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{participants.length} in session</p>
        </div>
        {isTeacher ? (
          <button
            type="button"
            onClick={onMuteAll}
            className="rounded-full border border-[color:var(--hub-border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--hub-text)]"
          >
            Mute all
          </button>
        ) : null}
      </div>
      <div className="mt-4 grid gap-2">
        {participants.length === 0 ? (
          <div className="rounded-2xl bg-[color:var(--hub-soft)] p-3 text-sm text-[color:var(--hub-muted)]">No one connected yet.</div>
        ) : (
          participants.map((participant) => (
            <div key={participant.session_id} className="flex items-center gap-3 rounded-2xl border border-[color:var(--hub-border)] px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--hub-primary)] text-xs font-bold text-white">
                {getInitials(participant.user_name || 'SkillStream')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[color:var(--hub-text)]">
                  {participant.user_name || 'Guest'}
                  {participant.local ? ' (You)' : ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[color:var(--hub-muted)]">
                {isTrackOn(participant, 'audio') ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4 text-rose-600" />}
                {isTrackOn(participant, 'video') ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4 text-rose-600" />}
              </div>
              {isTeacher && !participant.local ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onMuteParticipant?.(participant)}
                    className="rounded-full border border-[color:var(--hub-border)] px-2 py-1 text-[10px] font-semibold text-[color:var(--hub-text)]"
                  >
                    Mute
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveParticipant?.(participant)}
                    className="rounded-full border border-[rgba(200,95,73,0.3)] px-2 py-1 text-[10px] font-semibold text-[color:var(--edu-danger)]"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
