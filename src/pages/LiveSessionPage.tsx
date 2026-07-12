import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart2, ChevronLeft, Circle, DoorOpen,
  Hand, LayoutGrid, Lock, Unlock, Maximize2,
  MessageSquare, Mic, MicOff, Radio,
  Users, Video, VideoOff,
} from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { BreakoutPanel } from '../components/live/BreakoutPanel';
import { ChatPanel } from '../components/live/ChatPanel';
import { LiveControlsBar } from '../components/live/LiveControlsBar';
import { LiveParticipantsPanel } from '../components/live/LiveParticipantsPanel';
import { LiveSetupPanel } from '../components/live/LiveSetupPanel';
import { PollPanel } from '../components/live/PollPanel';
import { VideoGrid } from '../components/live/VideoGrid';
import { useNotifications } from '../components/notifications/NotificationToast';
import { BreakoutRoom, ChatMessage, Poll, PollResults, RaisedHand, SidePanelId } from '../lib/liveFeatures';
import { SWParticipant, SWSessionConfig } from '../lib/signalwireLive';
import type { VideoRoomSession, RoomSessionScreenShare } from '@signalwire/js';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import { cn, formatDateTime, getInitials } from '../lib/utils';
import { useAuthStore } from '../store/auth';
import { useTeacherHubStore } from '../store/teacherHub';

export const LiveSessionPage: React.FC = () => {
  const { id = '', lessonId = '' } = useParams();
  const { addNotification } = useNotifications();
  const user = useAuthStore((state) => state.user);
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';
  const isDemoSession = Boolean(user?.id.startsWith('demo-') || user?.email.endsWith('@skillstream.demo'));
  const allClasses = useTeacherHubStore((state) => state.classes);
  const students = useTeacherHubStore((state) => state.students);
  const teacherClass = allClasses.find((c) => c.id === id);
  const lesson = teacherClass?.lessons.find((l) => l.id === lessonId);
  const currentStudent = students.find((s) => s.email.toLowerCase() === (user?.email || '').toLowerCase());
  const setLessonRecording = useTeacherHubStore((state) => state.setLessonRecording);
  const setLessonAiRecap = useTeacherHubStore((state) => state.setLessonAiRecap);

  // ─── Refs ─────────────────────────────────────────────────────────────────
  const swSessionRef = useRef<VideoRoomSession | null>(null);
  const screenShareRef = useRef<RoomSessionScreenShare | null>(null);
  const swMemberIdRef = useRef<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const swContainerRef = useRef<HTMLDivElement>(null);
  // Single persistent Realtime channel (fixes ephemeral channel bug)
  const realtimeChRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Ref for sidePanel so the channel event handler always has the current value
  const sidePanelRef = useRef<SidePanelId | null>(null);
  // Supabase user ID of the class teacher — used to verify broadcast sender authenticity
  const teacherUserIdRef = useRef<string | null>(null);

  // ─── Core session state ───────────────────────────────────────────────────
  const [sessionConfig, setSessionConfig] = useState<SWSessionConfig | null>(null);
  const [notes, setNotes] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharingOn, setIsScreenSharingOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [participants, setParticipants] = useState<SWParticipant[]>([]);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  // ─── Layout + room controls ───────────────────────────────────────────────
  const [sessionLayout, setSessionLayout] = useState<'grid' | 'spotlight'>('grid');
  const [isRoomLocked, setIsRoomLocked] = useState(false);

  // ─── Feature state ────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChat, setUnreadChat] = useState(0);
  const [raisedHands, setRaisedHands] = useState<RaisedHand[]>([]);
  const [myHandRaised, setMyHandRaised] = useState(false);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [pollResults, setPollResults] = useState<PollResults | null>(null);
  const [myVote, setMyVote] = useState<number[] | null>(null);
  const [breakoutRooms, setBreakoutRooms] = useState<BreakoutRoom[] | null>(null);
  const [myBreakoutRoom, setMyBreakoutRoom] = useState<BreakoutRoom | null>(null);

  // ─── Sidebar panel ────────────────────────────────────────────────────────
  const [sidePanel, setSidePanelState] = useState<SidePanelId | null>(null);
  const setSidePanel = (val: SidePanelId | null | ((prev: SidePanelId | null) => SidePanelId | null)) => {
    setSidePanelState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      sidePanelRef.current = next;
      return next;
    });
  };

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      swSessionRef.current?.leave().catch(() => undefined);
      swSessionRef.current = null;
      if (realtimeChRef.current) {
        supabase.removeChannel(realtimeChRef.current);
        realtimeChRef.current = null;
      }
    };
  }, []);

  // ─── Persistent Realtime channel ─────────────────────────────────────────
  // Set up when isJoined becomes true; torn down on leave or unmount.
  // All sends also go through this ref to avoid the ephemeral-channel bug.
  useEffect(() => {
    if (!isJoined || isDemoSession || !sessionConfig) return;

    const ch = supabase.channel(`session:${sessionConfig.roomName}`);
    realtimeChRef.current = ch;

    // Everyone: chat
    ch.on('broadcast', { event: 'chat:message' }, (evt) => {
      const msg = evt.payload as Omit<ChatMessage, 'isLocal'>;
      setChatMessages((prev) => [...prev, { ...msg, isLocal: msg.uid === swMemberIdRef.current }]);
      if (sidePanelRef.current !== 'chat') setUnreadChat((c) => c + 1);
    });

    if (!isTeacher) {
      // Verify a broadcast came from the legitimate class teacher.
      // This prevents students from spoofing teacher commands via DevTools.
      const isFromTeacher = (evt: any) =>
        teacherUserIdRef.current !== null &&
        (evt.payload as { _authorId?: string })?._authorId === teacherUserIdRef.current;

      // Students receive teacher commands + broadcast events
      ch.on('broadcast', { event: 'teacher:mute' }, (evt) => {
        if (!isFromTeacher(evt)) return;
        const { targetId } = evt.payload as { targetId?: string };
        if (targetId === swMemberIdRef.current) {
          // Do NOT call swSessionRef.current?.audioMute() here — the teacher's
          // SignalWire moderator action (audioMute({ memberId })) is the authoritative
          // server-side mute. The member.updated event will sync the UI state.
          setIsMicOn(false);
        }
      });
      ch.on('broadcast', { event: 'teacher:kick' }, (evt) => {
        if (!isFromTeacher(evt)) return;
        const { targetId } = evt.payload as { targetId?: string };
        if (targetId === swMemberIdRef.current) {
          // Do NOT call handleLeave() here — the teacher's removeMember() call will
          // close the WebRTC connection which fires room.left, triggering handleLeave().
          addNotification({ type: 'info', title: 'Removed from session', message: 'The teacher has ended your session.', duration: 3000 });
        }
      });
      ch.on('broadcast', { event: 'poll:create' }, (evt) => {
        if (!isFromTeacher(evt)) return;
        setActivePoll(evt.payload as Poll);
        setMyVote(null);
        setPollResults(null);
        setSidePanel('polls');
        addNotification({ type: 'info', title: 'New poll', message: 'Your teacher launched a poll.', duration: 2200 });
      });
      ch.on('broadcast', { event: 'poll:close' }, (evt) => {
        if (!isFromTeacher(evt)) return;
        setPollResults((evt.payload as { results: PollResults }).results ?? {});
      });
      ch.on('broadcast', { event: 'poll:clear' }, (evt) => {
        if (!isFromTeacher(evt)) return;
        setActivePoll(null);
        setPollResults(null);
        setMyVote(null);
      });
      ch.on('broadcast', { event: 'breakout:create' }, (evt) => {
        if (!isFromTeacher(evt)) return;
        const rooms = (evt.payload as { rooms: BreakoutRoom[] }).rooms;
        setBreakoutRooms(rooms);
        const mine = rooms.find((r) => r.memberIds.includes(swMemberIdRef.current));
        setMyBreakoutRoom(mine ?? null);
        setSidePanel('breakout');
        addNotification({ type: 'info', title: 'Breakout started', message: mine ? `You're in ${mine.name}.` : 'Breakout rooms are open.', duration: 3000 });
      });
      ch.on('broadcast', { event: 'breakout:end' }, (evt) => {
        if (!isFromTeacher(evt)) return;
        setBreakoutRooms(null);
        setMyBreakoutRoom(null);
        addNotification({ type: 'info', title: 'Breakout ended', message: 'Everyone is back in the main session.', duration: 2200 });
      });
      ch.on('broadcast', { event: 'layout:change' }, (evt) => {
        if (!isFromTeacher(evt)) return;
        const layout = (evt.payload as { layout: 'grid' | 'spotlight' }).layout;
        setSessionLayout(layout);
        if (layout === 'spotlight') {
          setPinnedId(null); // teacher's side sets pinned on their own
        }
      });
      ch.on('broadcast', { event: 'room:lock' }, (evt) => {
        if (!isFromTeacher(evt)) return;
        setIsRoomLocked((evt.payload as { locked: boolean }).locked ?? false);
      });
      ch.on('broadcast', { event: 'hand:lower-all' }, (evt) => {
        if (!isFromTeacher(evt)) return;
        setMyHandRaised(false);
      });
    }

    if (isTeacher) {
      ch.on('broadcast', { event: 'hand:raise' }, (evt) => {
        const { uid, name, raisedAt } = evt.payload as RaisedHand;
        setRaisedHands((prev) => prev.find((h) => h.uid === uid) ? prev : [...prev, { uid, name, raisedAt }]);
        addNotification({ type: 'info', title: `${name} raised their hand`, message: '', duration: 2500 });
      });
      ch.on('broadcast', { event: 'hand:lower' }, (evt) => {
        const uid = (evt.payload as { uid: string }).uid;
        setRaisedHands((prev) => prev.filter((h) => h.uid !== uid));
      });
      ch.on('broadcast', { event: 'poll:vote' }, (evt) => {
        const { name, optionIndices } = evt.payload as { uid: string; name: string; optionIndices: number[] };
        setPollResults((prev) => {
          const updated: PollResults = {};
          // Copy existing, removing old votes from this voter
          for (const [k, voters] of Object.entries(prev ?? {})) {
            updated[Number(k)] = voters.filter((v) => v !== name);
          }
          // Add new votes
          optionIndices.forEach((i) => {
            updated[i] = [...(updated[i] ?? []), name];
          });
          return updated;
        });
      });
    }

    ch.subscribe();

    return () => {
      supabase.removeChannel(ch);
      realtimeChRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJoined, sessionConfig?.roomName, isDemoSession, isTeacher]);

  // ─── Guards ───────────────────────────────────────────────────────────────
  if (!teacherClass || !lesson) return <Navigate to="/classes" replace />;
  if (isStudent && (!currentStudent || !teacherClass.students.some((s) => s.id === currentStudent.id))) {
    return <Navigate to="/classes" replace />;
  }

  if (lesson.status === 'cancelled') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-6">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Live classroom</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Session cancelled</h2>
          <p className="mt-3 text-sm text-white/50">This lesson was cancelled. Please check the class schedule for a replacement session.</p>
          <Link to={`/class/${id}`} className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white">
            <ChevronLeft className="h-4 w-4" />
            Back to class
          </Link>
        </div>
      </div>
    );
  }

  // ─── Broadcast helper (always uses the persistent channel) ───────────────
  // _authorId is the sender's Supabase user ID — receivers validate it matches teacherUserId
  const broadcast = async (event: string, payload: Record<string, unknown>) => {
    if (isDemoSession || !realtimeChRef.current) return;
    await realtimeChRef.current.send({ type: 'broadcast', event, payload: { ...payload, _authorId: user?.id } });
  };

  // ─── Core session handlers ────────────────────────────────────────────────
  const fetchJoinToken = async (): Promise<SWSessionConfig | null> => {
    if (!hasSupabaseConfig) throw new Error('Live sessions are not configured yet.');
    const body: Record<string, unknown> = { lessonId: lesson.id };
    if (isTeacher) {
      body.notes = notes.trim();
    }
    const { data, error } = await supabase.functions.invoke('signalwire-token', { body });
    if (error) {
      throw new Error((error as { message?: string }).message || 'Could not prepare this live lesson.');
    }
    const p = data as SWSessionConfig & { error?: string; message?: string };
    if (!p?.roomToken) throw new Error(p?.message || p?.error || 'Live setup is not ready.');
    return p;
  };

  const handleJoin = async () => {
    setSessionError(null);

    if (isDemoSession) {
      setIsJoining(true);
      window.setTimeout(() => {
        setIsJoined(true);
        setIsJoining(false);
        setSidePanel('participants');
        setParticipants([
          { id: 'demo-1', name: user?.name || 'Demo User', isLocal: true, audioMuted: !isMicOn, videoMuted: !isCameraOn },
          { id: 'demo-2', name: 'Ava Thompson', isLocal: false, audioMuted: false, videoMuted: true },
        ]);
        addNotification({ type: 'success', title: 'Demo lesson started', message: 'You are now in demo live mode.', duration: 2200 });
      }, 600);
      return;
    }

    setIsJoining(true);
    try {
      const config = await fetchJoinToken();
      if (!config) { setIsJoining(false); return; }
      setSessionConfig(config);
      teacherUserIdRef.current = config.teacherUserId;

      const sw = await import('@signalwire/js');
      const roomSession = new sw.Video.RoomSession({
        token: config.roomToken,
        rootElement: swContainerRef.current!,
        audio: true,
        video: true,
        logLevel: 'silent',
      });

      roomSession.on('room.joined', (e: any) => {
        const myId: string = e.room_session?.member_id || '';
        swMemberIdRef.current = myId;
        const initial: SWParticipant[] = (e.room_session?.members || []).map((m: any) => ({
          id: m.id, name: m.name || 'Guest', isLocal: m.id === myId,
          audioMuted: m.audio_muted ?? false, videoMuted: m.video_muted ?? false,
        }));
        setParticipants(initial);
        setIsJoined(true);
        setIsJoining(false);
        setSidePanel('participants');
        addNotification({ type: 'success', title: config.isModerator ? 'Lesson started' : 'Joined lesson', message: 'You are now live.', duration: 2200 });
      });

      roomSession.on('member.joined', (e: any) => {
        const m = e.member;
        setParticipants((prev) => {
          if (prev.find((p) => p.id === m.id)) return prev;
          return [...prev, { id: m.id, name: m.name || 'Guest', isLocal: m.id === swMemberIdRef.current, audioMuted: m.audio_muted ?? false, videoMuted: m.video_muted ?? false }];
        });
      });

      roomSession.on('member.left', (e: any) => {
        setParticipants((prev) => prev.filter((p) => p.id !== e.member.id));
      });

      roomSession.on('member.updated', (e: any) => {
        const m = e.member;
        setParticipants((prev) => prev.map((p) =>
          p.id === m.id ? { ...p, audioMuted: m.audio_muted ?? p.audioMuted, videoMuted: m.video_muted ?? p.videoMuted } : p,
        ));
        // Keep local controls in sync when teacher server-side mutes this participant
        if (m.id === swMemberIdRef.current) {
          if (m.audio_muted !== undefined) setIsMicOn(!m.audio_muted);
          if (m.video_muted !== undefined) setIsCameraOn(!m.video_muted);
        }
      });

      // Fired when the teacher's removeMember() disconnects this client
      roomSession.on('room.left', () => {
        void handleLeave();
      });

      swSessionRef.current = roomSession;
      await roomSession.join();
    } catch {
      setSessionError('Could not start this live lesson right now. Please try again.');
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (isDemoSession) {
      setIsJoined(false);
      setParticipants([]);
      setIsRecording(false);
    } else {
      await swSessionRef.current?.leave().catch(() => undefined);
      swSessionRef.current = null;
      swMemberIdRef.current = '';
      setIsJoined(false);
      setParticipants([]);
      setSessionConfig(null);
      setPinnedId(null);

      if (isTeacher && lesson?.id && hasSupabaseConfig) {
        void supabase.functions
          .invoke('ai-session-recap', { body: { lessonId: lesson.id } })
          .then((res) => {
            const recap = (res.data as { result?: string } | null)?.result;
            if (recap) setLessonAiRecap(id, lesson.id, recap);
          })
          .catch(() => undefined);
      }
    }

    // Reset all feature state
    setSidePanel(null);
    setChatMessages([]);
    setUnreadChat(0);
    setRaisedHands([]);
    setMyHandRaised(false);
    setActivePoll(null);
    setPollResults(null);
    setMyVote(null);
    setBreakoutRooms(null);
    setMyBreakoutRoom(null);
    setSessionLayout('grid');
    setIsRoomLocked(false);
  };

  // ─── Media controls ───────────────────────────────────────────────────────
  const toggleMic = async () => {
    if (isDemoSession) { setIsMicOn((c) => !c); return; }
    try {
      if (isMicOn) { await swSessionRef.current?.audioMute(); }
      else { await swSessionRef.current?.audioUnmute(); }
      setIsMicOn((c) => !c);
    } catch { /* ignore */ }
  };

  const toggleCamera = async () => {
    if (isDemoSession) { setIsCameraOn((c) => !c); return; }
    try {
      if (isCameraOn) { await swSessionRef.current?.videoMute(); }
      else { await swSessionRef.current?.videoUnmute(); }
      setIsCameraOn((c) => !c);
    } catch { /* ignore */ }
  };

  const toggleScreenShare = async () => {
    if (isDemoSession) { setIsScreenSharingOn((c) => !c); return; }
    try {
      if (isScreenSharingOn) {
        await screenShareRef.current?.leave();
        screenShareRef.current = null;
        setIsScreenSharingOn(false);
      } else {
        const share = await swSessionRef.current?.startScreenShare({ audio: true });
        if (share) screenShareRef.current = share;
        setIsScreenSharingOn(true);
      }
    } catch {
      setSessionError('Screen sharing could not start. Check browser permissions.');
    }
  };

  const toggleRecording = async () => {
    if (isDemoSession && isTeacher) {
      if (isRecording) {
        setIsRecording(false);
        window.setTimeout(() => {
          setLessonRecording(id, lesson.id, 'https://www.w3schools.com/html/mov_bbb.mp4');
          addNotification({ type: 'success', title: 'Demo recording saved', message: 'Recording link added to the Lessons tab.', duration: 2800 });
        }, 1200);
      } else {
        setIsRecording(true);
      }
      return;
    }
    if (!isTeacher) return;
    if (isRecording) { mediaRecorderRef.current?.stop(); setIsRecording(false); return; }
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const mimeType =
        MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' :
        MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' :
        'video/webm';
      recordingChunksRef.current = [];
      const recorder = new MediaRecorder(displayStream, { mimeType });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordingChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        displayStream.getTracks().forEach((t) => t.stop());
        if (recordingChunksRef.current.length === 0) return;
        setIsUploading(true);
        try {
          const blob = new Blob(recordingChunksRef.current, { type: mimeType });
          const path = `${lesson.id}/${Date.now()}.webm`;
          const { error: uploadError } = await supabase.storage.from('recordings').upload(path, blob, { contentType: mimeType });
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from('recordings').getPublicUrl(path);
          await supabase.from('lessons').update({ recording_url: urlData.publicUrl }).eq('id', lesson.id);
          setLessonRecording(id, lesson.id, urlData.publicUrl);
          addNotification({ type: 'success', title: 'Recording saved', message: 'The recording link is now in the Lessons tab.', duration: 2800 });
        } catch {
          setSessionError('Recording upload failed.');
        } finally {
          setIsUploading(false);
        }
      };
      displayStream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (recorder.state === 'recording') recorder.stop();
        setIsRecording(false);
      });
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setSessionError('Recording could not start. Allow screen capture when prompted.');
    }
  };

  // ─── Participant management ───────────────────────────────────────────────
  const muteParticipant = async (participant: SWParticipant) => {
    if (!isTeacher || participant.isLocal) return;
    if (isDemoSession) {
      addNotification({ type: 'success', title: 'Participant muted', message: `${participant.name} has been muted.`, duration: 1800 });
      return;
    }
    await broadcast('teacher:mute', { targetId: participant.id });
    addNotification({ type: 'info', title: 'Mute sent', message: `${participant.name} was asked to mute.`, duration: 2000 });
  };

  const removeParticipant = async (participant: SWParticipant) => {
    if (!isTeacher || participant.isLocal) return;
    if (isDemoSession) {
      setParticipants((c) => c.filter((p) => p.id !== participant.id));
      addNotification({ type: 'success', title: 'Participant removed', message: `${participant.name} has been removed.`, duration: 1800 });
      return;
    }
    try {
      await swSessionRef.current?.removeMember({ memberId: participant.id });
    } catch {
      await broadcast('teacher:kick', { targetId: participant.id });
    }
  };

  const muteAllParticipants = async () => {
    if (!isTeacher) return;
    await Promise.all(participants.filter((p) => !p.isLocal).map((p) => muteParticipant(p)));
  };

  // ─── Layout + room lock ───────────────────────────────────────────────────
  const toggleLayout = async () => {
    const next: 'grid' | 'spotlight' = sessionLayout === 'grid' ? 'spotlight' : 'grid';
    setSessionLayout(next);
    if (next === 'spotlight') {
      const local = participants.find((p) => p.isLocal);
      setPinnedId(local?.id ?? null);
      swSessionRef.current?.setLayout?.({ name: 'highlight' }).catch(() => undefined);
    } else {
      setPinnedId(null);
      swSessionRef.current?.setLayout?.({ name: 'grid-responsive' }).catch(() => undefined);
    }
    await broadcast('layout:change', { layout: next });
  };

  const toggleRoomLock = async () => {
    const locked = !isRoomLocked;
    setIsRoomLocked(locked);
    if (locked) { swSessionRef.current?.lock?.().catch(() => undefined); }
    else { swSessionRef.current?.unlock?.().catch(() => undefined); }
    await broadcast('room:lock', { locked });
    addNotification({ type: 'info', title: locked ? 'Room locked' : 'Room unlocked', message: locked ? 'New participants cannot join.' : 'New participants can now join.', duration: 2000 });
  };

  // ─── Chat ─────────────────────────────────────────────────────────────────
  const sendChatMessage = async (text: string) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      uid: isDemoSession ? (user?.id ?? 'demo') : swMemberIdRef.current,
      name: user?.name ?? 'Unknown',
      text,
      timestamp: Date.now(),
      isLocal: true,
    };
    setChatMessages((prev) => [...prev, msg]);
    await broadcast('chat:message', { ...msg, isLocal: false });
  };

  // ─── Hand raising ─────────────────────────────────────────────────────────
  const toggleHandRaise = async () => {
    const newState = !myHandRaised;
    setMyHandRaised(newState);
    const uid = isDemoSession ? (user?.id ?? 'demo') : swMemberIdRef.current;
    const name = user?.name ?? 'Unknown';

    if (isDemoSession) {
      if (newState) {
        setRaisedHands((prev) => [...prev, { uid, name, raisedAt: Date.now() }]);
      } else {
        setRaisedHands((prev) => prev.filter((h) => h.uid !== uid));
      }
      return;
    }

    if (newState) {
      await broadcast('hand:raise', { uid, name, raisedAt: Date.now() });
    } else {
      await broadcast('hand:lower', { uid });
    }
  };

  const lowerHand = async (uid: string) => {
    setRaisedHands((prev) => prev.filter((h) => h.uid !== uid));
    await broadcast('hand:lower', { uid });
  };

  // ─── Polls ────────────────────────────────────────────────────────────────
  const createPoll = async (data: { question: string; options: string[]; allowMultiple: boolean }) => {
    const poll: Poll = { id: crypto.randomUUID(), ...data, createdAt: Date.now() };
    setActivePoll(poll);
    setPollResults({});
    setMyVote(null);
    await broadcast('poll:create', { ...poll });
  };

  const closePoll = async () => {
    const results = pollResults ?? {};
    setPollResults(results);
    await broadcast('poll:close', { results });
  };

  const clearPoll = async () => {
    setActivePoll(null);
    setPollResults(null);
    setMyVote(null);
    await broadcast('poll:clear', {});
  };

  const submitVote = async (optionIndices: number[]) => {
    if (!activePoll) return;
    setMyVote(optionIndices);
    const uid = isDemoSession ? (user?.id ?? 'demo') : swMemberIdRef.current;
    const name = user?.name ?? 'Unknown';

    if (isDemoSession) {
      setPollResults((prev) => {
        const updated: PollResults = { ...(prev ?? {}) };
        optionIndices.forEach((i) => { updated[i] = [...(updated[i] ?? []), name]; });
        return updated;
      });
      return;
    }
    await broadcast('poll:vote', { pollId: activePoll.id, uid, name, optionIndices });
  };

  // ─── Breakout rooms ───────────────────────────────────────────────────────
  const startBreakout = async (rooms: BreakoutRoom[]) => {
    setBreakoutRooms(rooms);
    setMyBreakoutRoom(null);
    await broadcast('breakout:create', { rooms });
  };

  const endBreakout = async () => {
    setBreakoutRooms(null);
    setMyBreakoutRoom(null);
    await broadcast('breakout:end', {});
  };

  const moveParticipant = (uid: string, toRoomId: string) => {
    setBreakoutRooms((prev) => {
      if (!prev) return prev;
      return prev.map((r) => ({
        ...r,
        memberIds: r.id === toRoomId
          ? [...r.memberIds.filter((mid) => mid !== uid), uid]
          : r.memberIds.filter((mid) => mid !== uid),
      }));
    });
  };

  // ─── Derived values ───────────────────────────────────────────────────────
  // In breakout mode, show only participants in the same room (visual only — audio stays global in demo)
  const videoParticipants = myBreakoutRoom
    ? participants.filter((p) => p.isLocal || myBreakoutRoom.memberIds.includes(p.id))
    : participants;

  const videoGridProps = {
    participants: videoParticipants,
    isTeacher,
    pinnedId,
    onPin: setPinnedId,
    onMuteParticipant: (p: SWParticipant) => void muteParticipant(p),
    onRemoveParticipant: (p: SWParticipant) => void removeParticipant(p),
  };

  const openPanel = (panel: SidePanelId) => {
    setSidePanel((prev) => prev === panel ? null : panel);
    if (panel === 'chat') setUnreadChat(0);
  };

  // ─── Sidebar content ──────────────────────────────────────────────────────
  const sidebarContent = sidePanel ? (
    <aside className="flex w-64 shrink-0 flex-col border-l border-white/10 xl:w-72">
      {/* Sidebar header with panel title */}
      <div className="flex h-14 shrink-0 items-center border-b border-white/10 px-4">
        <p className="flex-1 text-sm font-semibold text-white">
          {sidePanel === 'participants' && 'Participants'}
          {sidePanel === 'chat' && 'Chat'}
          {sidePanel === 'polls' && (isTeacher ? 'Polls' : 'Poll')}
          {sidePanel === 'breakout' && 'Breakout rooms'}
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        {sidePanel === 'participants' && (
          <LiveParticipantsPanel
            participants={participants}
            isTeacher={isTeacher}
            raisedHands={raisedHands}
            onLowerHand={(uid) => void lowerHand(uid)}
            onMuteParticipant={(p) => void muteParticipant(p)}
            onRemoveParticipant={(p) => void removeParticipant(p)}
            onMuteAll={() => void muteAllParticipants()}
          />
        )}
        {sidePanel === 'chat' && (
          <ChatPanel
            messages={chatMessages}
            onSend={(text) => void sendChatMessage(text)}
          />
        )}
        {sidePanel === 'polls' && (
          <PollPanel
            isTeacher={isTeacher}
            activePoll={activePoll}
            results={pollResults}
            myVote={myVote}
            onCreatePoll={(data) => void createPoll(data)}
            onVote={(indices) => void submitVote(indices)}
            onClosePoll={() => void closePoll()}
            onClearPoll={() => void clearPoll()}
          />
        )}
        {sidePanel === 'breakout' && (
          <BreakoutPanel
            isTeacher={isTeacher}
            participants={participants}
            rooms={breakoutRooms}
            myRoom={myBreakoutRoom}
            onStartBreakout={(rooms) => void startBreakout(rooms)}
            onEndBreakout={() => void endBreakout()}
            onMoveParticipant={moveParticipant}
          />
        )}
      </div>
    </aside>
  ) : null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={cn('flex flex-col bg-gray-950', isJoined ? 'h-screen overflow-hidden' : 'min-h-screen')}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 px-4">
        <Link
          to={`/class/${id}`}
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="flex min-w-0 flex-1 flex-col items-center">
          <p className="max-w-xs truncate text-sm font-semibold text-white">{lesson.title}</p>
          <p className="text-[11px] text-white/35">{teacherClass.name} · {lesson.durationMinutes} min</p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Status chips */}
          {isJoined && isRecording && (
            <span className="flex items-center gap-1.5 rounded-full bg-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-400">
              <Circle className="h-2 w-2 fill-rose-400" /> REC
            </span>
          )}
          {isJoined ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
              <Circle className="h-2 w-2 fill-emerald-400" /> LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/25">
              <Circle className="h-2 w-2" /> Not connected
            </span>
          )}

          {isJoined && (
            <>
              <div className="mx-0.5 h-5 w-px bg-white/10" />

              {/* Teacher: layout + lock in top bar */}
              {isTeacher && (
                <>
                  <button
                    type="button"
                    onClick={() => void toggleLayout()}
                    title={sessionLayout === 'spotlight' ? 'Switch to grid view' : 'Spotlight view'}
                    className={cn('flex h-8 w-8 items-center justify-center rounded-full transition', sessionLayout === 'spotlight' ? 'bg-blue-500/30 text-blue-300' : 'text-white/40 hover:bg-white/10 hover:text-white')}
                  >
                    {sessionLayout === 'spotlight' ? <LayoutGrid className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleRoomLock()}
                    title={isRoomLocked ? 'Unlock room' : 'Lock room — prevent new joiners'}
                    className={cn('flex h-8 w-8 items-center justify-center rounded-full transition', isRoomLocked ? 'bg-amber-500/30 text-amber-300' : 'text-white/40 hover:bg-white/10 hover:text-white')}
                  >
                    {isRoomLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </button>
                  <div className="mx-0.5 h-5 w-px bg-white/10" />
                </>
              )}

              {/* Panel toggles */}
              <button
                type="button"
                onClick={() => openPanel('participants')}
                title="Participants"
                className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition', sidePanel === 'participants' ? 'bg-white/15 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white')}
              >
                <Users className="h-3.5 w-3.5" />
                {participants.length}
                {raisedHands.length > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-gray-900">
                    {raisedHands.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => openPanel('chat')}
                title="Chat"
                className={cn('relative flex h-8 w-8 items-center justify-center rounded-full transition', sidePanel === 'chat' ? 'bg-white/15 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white')}
              >
                <MessageSquare className="h-4 w-4" />
                {unreadChat > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--hub-primary)] text-[9px] font-bold text-white">
                    {unreadChat > 9 ? '9+' : unreadChat}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => openPanel('polls')}
                title="Polls"
                className={cn('relative flex h-8 w-8 items-center justify-center rounded-full transition', sidePanel === 'polls' ? 'bg-white/15 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white')}
              >
                <BarChart2 className="h-4 w-4" />
                {activePoll && pollResults === null && (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                )}
              </button>

              {(isTeacher || breakoutRooms !== null) && (
                <button
                  type="button"
                  onClick={() => openPanel('breakout')}
                  title="Breakout rooms"
                  className={cn('relative flex h-8 w-8 items-center justify-center rounded-full transition', sidePanel === 'breakout' ? 'bg-white/15 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white')}
                >
                  <DoorOpen className="h-4 w-4" />
                  {breakoutRooms && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* ── In-session layout ──────────────────────────────────────────────── */}
      {isJoined ? (
        <>
          <div className="flex flex-1 overflow-hidden">
            {/* Video grid */}
            <div className="flex flex-1 flex-col overflow-hidden p-2 sm:p-3">
              {myBreakoutRoom && (
                <div className="mb-2 flex items-center gap-2 rounded-xl bg-blue-500/10 px-3 py-1.5">
                  <DoorOpen className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs font-semibold text-blue-300">{myBreakoutRoom.name} — breakout in progress</span>
                </div>
              )}
              {isDemoSession ? (
                <VideoGrid {...videoGridProps} className="h-full rounded-2xl" />
              ) : (
                <div ref={swContainerRef} className="h-full w-full overflow-hidden rounded-2xl" />
              )}
            </div>

            {sidebarContent}
          </div>

          {/* Bottom controls bar */}
          <div className="flex h-20 shrink-0 items-center justify-center gap-2 border-t border-white/10 bg-gray-950/90 px-4 backdrop-blur sm:gap-3">
            {/* Student: hand raise */}
            {!isTeacher && (
              <button
                type="button"
                onClick={() => void toggleHandRaise()}
                title={myHandRaised ? 'Lower your hand' : 'Raise your hand'}
                className={cn('flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95', myHandRaised ? 'bg-amber-500 text-white' : 'bg-white/10 text-white hover:bg-white/20')}
              >
                <Hand className="h-5 w-5" />
              </button>
            )}

            <LiveControlsBar
              micOn={isMicOn}
              cameraOn={isCameraOn}
              screenSharingOn={isScreenSharingOn}
              onToggleMic={() => void toggleMic()}
              onToggleCamera={() => void toggleCamera()}
              onToggleScreenShare={() => void toggleScreenShare()}
              onLeave={() => void handleLeave()}
            />

            {isTeacher && (
              <>
                <div className="mx-1 h-8 w-px bg-white/15" />
                <button
                  type="button"
                  onClick={() => void toggleRecording()}
                  disabled={isUploading}
                  title={isRecording ? 'Stop recording' : 'Record session'}
                  className={cn('flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-50', isRecording ? 'bg-rose-500/30 text-rose-400 ring-1 ring-rose-500/50' : 'bg-white/10 text-white hover:bg-white/20')}
                >
                  <Radio className="h-5 w-5" />
                </button>
              </>
            )}

            {sessionError && (
              <p className="absolute bottom-[5.5rem] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-rose-500/20 px-4 py-2 text-xs font-medium text-rose-400">
                {sessionError}
              </p>
            )}
          </div>
        </>
      ) : (

        /* ── Pre-join lobby ─────────────────────────────────────────────── */
        <div className="flex flex-1 items-start justify-center overflow-y-auto p-6 sm:items-center">
          <div className="w-full max-w-md space-y-4 py-4">

            {/* Camera preview */}
            <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-gray-900">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--hub-primary)] text-2xl font-bold text-white">
                    {getInitials(user?.name)}
                  </div>
                  <p className="mt-3 text-sm font-medium text-white">{user?.name}</p>
                  <p className="mt-0.5 text-xs text-white/35">Camera preview</p>
                </div>
              </div>
              <div className="absolute bottom-3 left-3 flex gap-2">
                <span className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', isMicOn ? 'bg-black/50 text-white/70' : 'bg-rose-500/80 text-white')}>
                  {isMicOn ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />} Mic
                </span>
                <span className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', isCameraOn ? 'bg-black/50 text-white/70' : 'bg-rose-500/80 text-white')}>
                  {isCameraOn ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />} Camera
                </span>
              </div>
            </div>

            {/* Device toggles */}
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <button type="button" onClick={() => setIsMicOn((v) => !v)}
                  className={cn('flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95', isMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-500 text-white hover:bg-rose-600')}>
                  {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
                <p className="mt-1.5 text-[11px] text-white/35">{isMicOn ? 'Mic on' : 'Mic off'}</p>
              </div>
              <div className="text-center">
                <button type="button" onClick={() => setIsCameraOn((v) => !v)}
                  className={cn('flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95', isCameraOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-500 text-white hover:bg-rose-600')}>
                  {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>
                <p className="mt-1.5 text-[11px] text-white/35">{isCameraOn ? 'Camera on' : 'Camera off'}</p>
              </div>
            </div>

            {/* Lesson info */}
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center">
              <p className="font-semibold text-white">{lesson.title}</p>
              <p className="mt-1 text-sm text-white/40">{teacherClass.name} · {formatDateTime(lesson.scheduledAt)}</p>
            </div>

            {isTeacher && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">Session settings</p>
                <LiveSetupPanel
                  isTeacher={isTeacher}
                  notes={notes}
                  onNotesChange={setNotes}
                  onJoin={() => void handleJoin()}
                  isJoining={isJoining}
                  isDisabled={false}
                />
              </div>
            )}

            {sessionError && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                {sessionError}
              </div>
            )}

            {!isTeacher && (
              <button type="button" disabled={isJoining} onClick={() => void handleJoin()}
                className="w-full rounded-full bg-[color:var(--hub-primary)] py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(27,74,128,0.35)] transition hover:opacity-90 disabled:opacity-60">
                {isJoining ? 'Connecting…' : 'Join lesson'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
