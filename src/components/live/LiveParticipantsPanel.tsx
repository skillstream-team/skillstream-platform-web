import React from 'react';
import { Hand, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { RaisedHand } from '../../lib/liveFeatures';
import { SWParticipant } from '../../lib/signalwireLive';
import { getInitials } from '../../lib/utils';

interface LiveParticipantsPanelProps {
  participants: SWParticipant[];
  isTeacher?: boolean;
  raisedHands?: RaisedHand[];
  onLowerHand?: (uid: string) => void;
  onMuteParticipant?: (participant: SWParticipant) => void;
  onRemoveParticipant?: (participant: SWParticipant) => void;
  onMuteAll?: () => void;
}

export const LiveParticipantsPanel: React.FC<LiveParticipantsPanelProps> = ({
  participants,
  isTeacher = false,
  raisedHands = [],
  onLowerHand,
  onMuteParticipant,
  onRemoveParticipant,
  onMuteAll,
}) => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Participants</p>
          <p className="mt-0.5 text-sm font-semibold text-white">{participants.length} in session</p>
        </div>
        {isTeacher && participants.filter((p) => !p.isLocal).length > 0 ? (
          <button
            type="button"
            onClick={onMuteAll}
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:border-white/30 hover:text-white"
          >
            Mute all
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Raised hands section */}
        {raisedHands.length > 0 && (
          <div className="border-b border-white/10 px-3 py-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-400">
              <Hand className="h-3 w-3" />
              Raised hands ({raisedHands.length})
            </p>
            <div className="space-y-1.5">
              {raisedHands.map((hand) => (
                <div key={hand.uid} className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2">
                  <Hand className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <span className="flex-1 truncate text-sm text-white">{hand.name}</span>
                  {isTeacher && onLowerHand ? (
                    <button
                      type="button"
                      onClick={() => onLowerHand(hand.uid)}
                      className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/50 hover:border-white/30 hover:text-white transition"
                    >
                      Lower
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Participants list */}
        <div className="px-3 py-3 space-y-1">
          {participants.length === 0 ? (
            <div className="rounded-2xl bg-white/5 px-4 py-4 text-center text-sm text-white/25">
              No one else is here yet.
            </div>
          ) : (
            participants.map((participant) => {
              const handRaised = raisedHands.some((h) => h.uid === participant.id);
              return (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-white/5"
                >
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--hub-primary)] text-xs font-bold text-white">
                    {getInitials(participant.name || 'SkillStream')}
                    {handRaised && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400">
                        <Hand className="h-2 w-2 text-white" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {participant.name || 'Guest'}
                      {participant.isLocal ? <span className="ml-1 text-xs text-white/35">(You)</span> : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {participant.audioMuted
                      ? <MicOff className="h-3.5 w-3.5 text-rose-400" />
                      : <Mic className="h-3.5 w-3.5 text-white/35" />}
                    {participant.videoMuted
                      ? <VideoOff className="h-3.5 w-3.5 text-rose-400" />
                      : <Video className="h-3.5 w-3.5 text-white/35" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Teacher mute/remove actions */}
        {isTeacher && participants.some((p) => !p.isLocal) ? (
          <div className="border-t border-white/10 px-3 py-3 space-y-1">
            {participants.filter((p) => !p.isLocal).map((participant) => (
              <div key={`actions-${participant.id}`} className="flex items-center gap-2 px-1">
                <span className="min-w-0 flex-1 truncate text-xs text-white/35">{participant.name}</span>
                <button
                  type="button"
                  onClick={() => onMuteParticipant?.(participant)}
                  className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold text-white/55 transition hover:border-white/30 hover:text-white"
                >
                  Mute
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveParticipant?.(participant)}
                  className="rounded-full border border-rose-500/30 px-2.5 py-1 text-[10px] font-semibold text-rose-400 transition hover:border-rose-500/60"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
