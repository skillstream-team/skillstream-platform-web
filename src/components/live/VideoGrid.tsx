import React from 'react';
import { Mic, MicOff, Pin, Video, VideoOff } from 'lucide-react';
import { SWParticipant } from '../../lib/signalwireLive';
import { getInitials } from '../../lib/utils';

interface TileProps {
  participant: SWParticipant;
  isTeacher: boolean;
  pinned: boolean;
  compact: boolean;
  onPin: (id: string | null) => void;
  onMute?: (p: SWParticipant) => void;
  onRemove?: (p: SWParticipant) => void;
}

const Tile: React.FC<TileProps> = ({
  participant, isTeacher, pinned, compact, onPin, onMute, onRemove,
}) => (
  <div className={`group relative overflow-hidden rounded-xl bg-gray-900${compact ? ' h-[116px] flex-shrink-0' : ''}`}>
    {/* Avatar tile (demo mode always shows avatars) */}
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--hub-primary)] text-xs font-bold text-white">
        {getInitials(participant.name || 'S')}
      </div>
    </div>

    {/* Bottom name + status bar */}
    <div className="absolute bottom-0 left-0 right-0 z-[2] flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5">
      <span className="truncate text-xs font-semibold text-white drop-shadow">
        {participant.name}{participant.isLocal ? ' (You)' : ''}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        {participant.audioMuted
          ? <MicOff className="h-3 w-3 text-rose-400" />
          : <Mic className="h-3 w-3 text-white/80" />}
        {participant.videoMuted
          ? <VideoOff className="h-3 w-3 text-rose-400" />
          : <Video className="h-3 w-3 text-white/80" />}
      </div>
    </div>

    {/* Spotlight pin button — top-right, on hover */}
    {!compact && (
      <button
        type="button"
        aria-label={pinned ? 'Unpin' : 'Pin to spotlight'}
        onClick={() => onPin(pinned ? null : participant.id)}
        className={`absolute right-2 top-2 z-[2] rounded-full p-1 transition-opacity${
          pinned
            ? ' bg-[color:var(--hub-primary)] opacity-100'
            : ' bg-black/50 opacity-0 group-hover:opacity-100'
        }`}
      >
        <Pin className="h-3 w-3 text-white" />
      </button>
    )}

    {/* Teacher mute/remove — top-left, hover only */}
    {isTeacher && !participant.isLocal && !compact && (
      <div className="absolute left-2 top-2 z-[2] flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onMute?.(participant)}
          className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white"
        >
          Mute
        </button>
        <button
          type="button"
          onClick={() => onRemove?.(participant)}
          className="rounded-full bg-rose-600/80 px-2 py-0.5 text-[10px] font-semibold text-white"
        >
          Remove
        </button>
      </div>
    )}
  </div>
);

export interface VideoGridProps {
  participants: SWParticipant[];
  isTeacher?: boolean;
  pinnedId: string | null;
  onPin: (id: string | null) => void;
  onMuteParticipant?: (p: SWParticipant) => void;
  onRemoveParticipant?: (p: SWParticipant) => void;
  stripMode?: boolean;
  className?: string;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  participants,
  isTeacher = false,
  pinnedId,
  onPin,
  onMuteParticipant,
  onRemoveParticipant,
  stripMode = false,
  className = '',
}) => {
  if (participants.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-gray-900 ${className}`}>
        <p className="text-xs text-white/30">Waiting for participants…</p>
      </div>
    );
  }

  if (stripMode) {
    return (
      <div className={`flex flex-col gap-2 overflow-y-auto ${className}`}>
        {participants.map((p) => (
          <Tile
            key={p.id}
            participant={p}
            isTeacher={isTeacher}
            pinned={pinnedId === p.id}
            compact
            onPin={onPin}
            onMute={onMuteParticipant}
            onRemove={onRemoveParticipant}
          />
        ))}
      </div>
    );
  }

  if (pinnedId !== null) {
    const pinned = participants.find((p) => p.id === pinnedId);
    const rest = participants.filter((p) => p.id !== pinnedId);
    return (
      <div className={`grid h-full gap-2 ${className}`} style={{ gridTemplateColumns: '1fr 156px' }}>
        {pinned ? (
          <Tile
            participant={pinned}
            isTeacher={isTeacher}
            pinned
            compact={false}
            onPin={onPin}
            onMute={onMuteParticipant}
            onRemove={onRemoveParticipant}
          />
        ) : null}
        <div className="flex flex-col gap-2 overflow-y-auto">
          {rest.map((p) => (
            <Tile
              key={p.id}
              participant={p}
              isTeacher={isTeacher}
              pinned={false}
              compact
              onPin={onPin}
              onMute={onMuteParticipant}
              onRemove={onRemoveParticipant}
            />
          ))}
        </div>
      </div>
    );
  }

  const n = participants.length;
  const cols =
    n <= 1 ? 'grid-cols-1' :
    n === 2 ? 'grid-cols-2' :
    n <= 4 ? 'grid-cols-2' :
    n <= 6 ? 'grid-cols-3' :
    'grid-cols-4';

  return (
    <div className={`grid auto-rows-fr gap-2 ${cols} h-full ${className}`}>
      {participants.map((p) => (
        <Tile
          key={p.id}
          participant={p}
          isTeacher={isTeacher}
          pinned={false}
          compact={false}
          onPin={onPin}
          onMute={onMuteParticipant}
          onRemove={onRemoveParticipant}
        />
      ))}
    </div>
  );
};
