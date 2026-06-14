import React, { useState } from 'react';
import { DoorOpen, X } from 'lucide-react';
import { BreakoutRoom } from '../../lib/liveFeatures';
import { SWParticipant } from '../../lib/signalwireLive';
import { cn, getInitials } from '../../lib/utils';

interface BreakoutPanelProps {
  isTeacher: boolean;
  participants: SWParticipant[];
  rooms: BreakoutRoom[] | null;
  myRoom: BreakoutRoom | null;
  onStartBreakout: (rooms: BreakoutRoom[]) => void;
  onEndBreakout: () => void;
  onMoveParticipant: (uid: string, toRoomId: string) => void;
}

export const BreakoutPanel: React.FC<BreakoutPanelProps> = ({
  isTeacher, participants, rooms, myRoom,
  onStartBreakout, onEndBreakout, onMoveParticipant,
}) => {
  const [roomCount, setRoomCount] = useState(2);
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  // ─── Student: no active breakout ────────────────────────────────────────
  if (!isTeacher && !myRoom) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4">
        <DoorOpen className="h-9 w-9 text-white/15 mb-3" />
        <p className="text-sm text-white/30">No breakout session active.</p>
        <p className="mt-1 text-xs text-white/20">Your teacher will open one soon.</p>
      </div>
    );
  }

  // ─── Student: in a breakout room ────────────────────────────────────────
  if (!isTeacher && myRoom) {
    const roomParticipants = participants.filter((p) => myRoom.memberIds.includes(p.id));
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Breakout</p>
          <p className="mt-0.5 text-sm font-semibold text-white">{myRoom.name}</p>
          <p className="text-xs text-white/35">{roomParticipants.length} participant{roomParticipants.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
          {roomParticipants.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--hub-primary)] text-xs font-bold text-white">
                {getInitials(p.name)}
              </div>
              <p className="text-sm text-white">
                {p.name}
                {p.isLocal ? <span className="ml-1 text-xs text-white/40">(You)</span> : null}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Teacher: active breakout ────────────────────────────────────────────
  if (isTeacher && rooms) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Breakout rooms</p>
            <p className="mt-0.5 text-xs font-semibold text-emerald-400">Active · {rooms.length} rooms</p>
          </div>
          <button
            type="button"
            onClick={onEndBreakout}
            className="rounded-full border border-rose-500/30 px-3 py-1 text-[11px] font-semibold text-rose-400 transition hover:border-rose-500/60"
          >
            End breakout
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {rooms.map((room) => {
            const roomParticipants = participants.filter((p) => room.memberIds.includes(p.id));
            const otherRooms = rooms.filter((r) => r.id !== room.id);
            return (
              <div key={room.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">{room.name}</p>
                  <span className="text-xs text-white/35">{roomParticipants.length}</span>
                </div>
                {roomParticipants.length === 0 ? (
                  <p className="text-xs text-white/20">Empty</p>
                ) : (
                  <div className="space-y-1.5">
                    {roomParticipants.map((p) => (
                      <div key={p.id} className="flex items-center gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--hub-primary)]/60 text-[10px] font-bold text-white">
                          {getInitials(p.name)}
                        </div>
                        <span className="flex-1 truncate text-xs text-white/70">{p.name}</span>
                        {!p.isLocal && otherRooms.length > 0 && (
                          <select
                            defaultValue=""
                            onChange={(e) => e.target.value && onMoveParticipant(p.id, e.target.value)}
                            className="rounded-lg border border-white/15 bg-gray-900 px-1.5 py-0.5 text-[10px] text-white/50"
                          >
                            <option value="">Move…</option>
                            {otherRooms.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Teacher: setup breakout rooms ───────────────────────────────────────
  const remoteParticipants = participants.filter((p) => !p.isLocal);
  const roomDrafts = Array.from({ length: roomCount }, (_, i) => ({
    id: `breakout-${i + 1}`,
    name: `Group ${i + 1}`,
  }));

  const autoAssign = () => {
    const newAssignments: Record<string, string> = {};
    remoteParticipants.forEach((p, i) => {
      newAssignments[p.id] = roomDrafts[i % roomCount].id;
    });
    setAssignments(newAssignments);
  };

  const unassigned = remoteParticipants.filter((p) => !assignments[p.id]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Breakout rooms</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold text-white/50">Number of groups</p>
          <div className="flex gap-2">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => { setRoomCount(n); setAssignments({}); }}
                className={cn('flex-1 rounded-xl py-2 text-sm font-semibold transition', roomCount === n ? 'bg-[color:var(--hub-primary)] text-white' : 'bg-white/10 text-white/60 hover:text-white')}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={autoAssign}
          disabled={remoteParticipants.length === 0}
          className="w-full rounded-xl border border-white/15 py-2 text-xs font-semibold text-white/50 transition hover:border-white/30 hover:text-white disabled:opacity-30"
        >
          Auto-assign participants
        </button>

        {roomDrafts.map((room) => {
          const assigned = remoteParticipants.filter((p) => assignments[p.id] === room.id);
          return (
            <div key={room.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="mb-2 text-sm font-semibold text-white">{room.name}</p>
              {assigned.length === 0 ? (
                <p className="text-xs text-white/20">No participants assigned yet</p>
              ) : (
                <div className="space-y-1.5">
                  {assigned.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--hub-primary)]/60 text-[10px] font-bold text-white">
                        {getInitials(p.name)}
                      </div>
                      <span className="flex-1 text-xs text-white/70 truncate">{p.name}</span>
                      <button
                        type="button"
                        onClick={() => setAssignments((prev) => { const n = { ...prev }; delete n[p.id]; return n; })}
                        className="text-white/20 hover:text-white/60 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {unassigned.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-white/35">Unassigned ({unassigned.length})</p>
            <div className="space-y-1.5">
              {unassigned.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white">
                    {getInitials(p.name)}
                  </div>
                  <span className="flex-1 truncate text-xs text-white/60">{p.name}</span>
                  <select
                    defaultValue=""
                    onChange={(e) => e.target.value && setAssignments((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    className="rounded-lg border border-white/15 bg-gray-900 px-1.5 py-0.5 text-[10px] text-white/50"
                  >
                    <option value="">Assign…</option>
                    {roomDrafts.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={() => {
            const builtRooms: BreakoutRoom[] = roomDrafts.map((r) => ({
              id: r.id,
              name: r.name,
              memberIds: remoteParticipants.filter((p) => assignments[p.id] === r.id).map((p) => p.id),
            }));
            onStartBreakout(builtRooms);
          }}
          className="w-full rounded-full bg-[color:var(--hub-primary)] py-2.5 text-sm font-semibold text-white transition"
        >
          Start breakout
        </button>
      </div>
    </div>
  );
};
