import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft, Circle, CreditCard, Mic, MicOff, Radio,
  Users, Video, VideoOff,
} from 'lucide-react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { LiveControlsBar } from '../components/live/LiveControlsBar';
import { LiveParticipantsPanel } from '../components/live/LiveParticipantsPanel';
import { LiveSetupPanel } from '../components/live/LiveSetupPanel';
import { VideoGrid } from '../components/live/VideoGrid';
import { useNotifications } from '../components/notifications/NotificationToast';
import { LiveSessionMode, SWParticipant, SWSessionConfig } from '../lib/signalwireLive';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import { formatDateTime, getInitials } from '../lib/utils';
import { useAuthStore } from '../store/auth';
import { useTeacherHubStore } from '../store/teacherHub';
import { useCurrencyFormatter } from '../lib/currency';
import { useCurrencyStore } from '../store/currency';

export const LiveSessionPage: React.FC = () => {
  const { id = '', lessonId = '' } = useParams();
  const { addNotification } = useNotifications();
  const { format: formatMoney } = useCurrencyFormatter();
  const currency = useCurrencyStore((state) => state.currency);
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

  const swSessionRef = useRef<any>(null);
  const swMemberIdRef = useRef<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const swContainerRef = useRef<HTMLDivElement>(null);

  const [sessionConfig, setSessionConfig] = useState<SWSessionConfig | null>(null);
  const [sessionMode, setSessionMode] = useState<LiveSessionMode>('free');
  const [ticketPriceGBP, setTicketPriceGBP] = useState(0);
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
  const [paymentRequired, setPaymentRequired] = useState<{ ticketPriceGBP: number } | null>(null);
  const [isPayingForLesson, setIsPayingForLesson] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [searchParams] = useSearchParams();
  const paymentSuccess = searchParams.get('payment_success') === '1';

  useEffect(() => {
    return () => {
      swSessionRef.current?.leave().catch(() => undefined);
      swSessionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isJoined || !sessionConfig || isTeacher || isDemoSession) return;
    const ch = supabase.channel(`session:${sessionConfig.roomName}`);
    ch.on('broadcast', { event: 'teacher:mute' }, (evt) => {
      if ((evt.payload as { targetId?: string }).targetId === swMemberIdRef.current) {
        swSessionRef.current?.audioMute().catch(() => undefined);
        setIsMicOn(false);
      }
    });
    ch.on('broadcast', { event: 'teacher:kick' }, (evt) => {
      if ((evt.payload as { targetId?: string }).targetId === swMemberIdRef.current) {
        void handleLeave();
      }
    });
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJoined, sessionConfig?.roomName]);

  if (!teacherClass || !lesson) return <Navigate to="/classes" replace />;
  if (isStudent && (!currentStudent || !teacherClass.students.some((s) => s.id === currentStudent.id))) {
    return <Navigate to="/classes" replace />;
  }

  // ─── Cancelled ───────────────────────────────────────────────────────────────
  if (lesson.status === 'cancelled') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-6">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Live classroom</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Session cancelled</h2>
          <p className="mt-3 text-sm text-white/50">
            This lesson was cancelled. Please check the class schedule for a replacement session.
          </p>
          <Link
            to={`/class/${id}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to class
          </Link>
        </div>
      </div>
    );
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const fetchJoinToken = async (): Promise<SWSessionConfig | null> => {
    if (!hasSupabaseConfig) throw new Error('Live sessions are not configured yet.');
    const body: Record<string, unknown> = { lessonId: lesson.id };
    if (isTeacher) {
      body.sessionMode = sessionMode;
      body.ticketPriceGBP = sessionMode === 'paid' ? Math.max(1, ticketPriceGBP) : 0;
      body.notes = notes.trim();
    }
    const { data, error } = await supabase.functions.invoke('signalwire-token', { body });
    if (error) {
      const errBody = await (error as { context?: { json?: () => Promise<Record<string, unknown>> } }).context?.json?.().catch(() => null);
      if (errBody?.error === 'Payment required') {
        setPaymentRequired({ ticketPriceGBP: Number(errBody.ticketPriceGBP || 0) });
        return null;
      }
      throw new Error((error as { message?: string }).message || 'Could not prepare this live lesson.');
    }
    const p = data as SWSessionConfig & { error?: string; message?: string };
    if (!p?.roomToken) throw new Error(p?.message || p?.error || 'Live setup is not ready.');
    return p;
  };

  const handlePayForLesson = async () => {
    if (!hasSupabaseConfig || !paymentRequired) return;
    setIsPayingForLesson(true);
    try {
      const returnUrl = `${window.location.origin}/class/${id}/live/${lessonId}?payment_success=1`;
      const { data, error } = await supabase.functions.invoke('dodo-checkout', {
        body: { type: 'lesson', lessonId: lesson.id, classId: id, returnUrl, cancelUrl: `${window.location.origin}/class/${id}/live/${lessonId}` },
      });
      if (error || !data?.checkoutUrl) throw error || new Error('No checkout URL');
      window.location.href = data.checkoutUrl as string;
    } catch {
      setIsPayingForLesson(false);
      setSessionError('Could not start payment. Please try again.');
    }
  };

  const handleJoin = async () => {
    setSessionError(null);

    if (isDemoSession) {
      setIsJoining(true);
      window.setTimeout(() => {
        setIsJoined(true);
        setIsJoining(false);
        setShowParticipants(true);
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
      setSessionMode(config.sessionMode);

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
          id: m.id,
          name: m.name || 'Guest',
          isLocal: m.id === myId,
          audioMuted: m.audio_muted ?? false,
          videoMuted: m.video_muted ?? false,
        }));
        setParticipants(initial);
        setIsJoined(true);
        setIsJoining(false);
        setShowParticipants(true);
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
          p.id === m.id
            ? { ...p, audioMuted: m.audio_muted ?? p.audioMuted, videoMuted: m.video_muted ?? p.videoMuted }
            : p,
        ));
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
      setShowParticipants(false);
      return;
    }
    await swSessionRef.current?.leave().catch(() => undefined);
    swSessionRef.current = null;
    swMemberIdRef.current = '';
    setIsJoined(false);
    setParticipants([]);
    setSessionConfig(null);
    setPinnedId(null);
    setShowParticipants(false);

    if (isTeacher && lesson?.id && hasSupabaseConfig) {
      void supabase.functions
        .invoke('ai-session-recap', { body: { lessonId: lesson.id } })
        .then((res) => {
          const recap = (res.data as { result?: string } | null)?.result;
          if (recap) setLessonAiRecap(id, lesson.id, recap);
        })
        .catch(() => undefined);
    }
  };

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
        await swSessionRef.current?.stopScreenShare();
        setIsScreenSharingOn(false);
      } else {
        await swSessionRef.current?.startScreenShare({ audio: true });
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

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

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

  const muteParticipant = async (participant: SWParticipant) => {
    if (!isTeacher || participant.isLocal) return;
    if (isDemoSession) {
      addNotification({ type: 'success', title: 'Participant muted', message: `${participant.name} has been muted.`, duration: 1800 });
      return;
    }
    if (!sessionConfig) return;
    const ch = supabase.channel(`session:${sessionConfig.roomName}`);
    await ch.send({ type: 'broadcast', event: 'teacher:mute', payload: { targetId: participant.id } });
    supabase.removeChannel(ch);
    addNotification({ type: 'info', title: 'Mute sent', message: `${participant.name} was asked to mute.`, duration: 2000 });
  };

  const removeParticipant = async (participant: SWParticipant) => {
    if (!isTeacher || participant.isLocal) return;
    if (isDemoSession) {
      setParticipants((c) => c.filter((p) => p.id !== participant.id));
      addNotification({ type: 'success', title: 'Participant removed', message: `${participant.name} has been removed.`, duration: 1800 });
      return;
    }
    if (!sessionConfig) return;
    try {
      await swSessionRef.current?.removeMember({ memberId: participant.id });
    } catch {
      const ch = supabase.channel(`session:${sessionConfig.roomName}`);
      await ch.send({ type: 'broadcast', event: 'teacher:kick', payload: { targetId: participant.id } });
      supabase.removeChannel(ch);
    }
  };

  const muteAllParticipants = async () => {
    if (!isTeacher) return;
    await Promise.all(participants.filter((p) => !p.isLocal).map((p) => muteParticipant(p)));
  };

  const videoGridProps = {
    participants,
    isTeacher,
    pinnedId,
    onPin: setPinnedId,
    onMuteParticipant: (p: SWParticipant) => void muteParticipant(p),
    onRemoveParticipant: (p: SWParticipant) => void removeParticipant(p),
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col bg-gray-950 ${isJoined ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-4">
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

        <div className="flex items-center gap-2">
          {isJoined && isRecording ? (
            <span className="flex items-center gap-1.5 rounded-full bg-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-400">
              <Circle className="h-2 w-2 fill-rose-400" />
              REC
            </span>
          ) : null}
          {isJoined ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
              <Circle className="h-2 w-2 fill-emerald-400" />
              LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/30">
              <Circle className="h-2 w-2" />
              Not connected
            </span>
          )}
          {isJoined ? (
            <button
              type="button"
              onClick={() => setShowParticipants((v) => !v)}
              title="Toggle participants"
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${showParticipants ? 'bg-white/15 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white'}`}
            >
              <Users className="h-4 w-4" />
              {participants.length}
            </button>
          ) : null}
        </div>
      </header>

      {/* ── In-session layout ──────────────────────────────────────────────── */}
      {isJoined ? (
        <>
          {/* Main area: video + optional participants sidebar */}
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden p-2 sm:p-3">
              {isDemoSession ? (
                <VideoGrid {...videoGridProps} className="h-full rounded-2xl" />
              ) : (
                <div ref={swContainerRef} className="h-full w-full overflow-hidden rounded-2xl" />
              )}
            </div>

            {showParticipants ? (
              <aside className="w-64 shrink-0 overflow-hidden border-l border-white/10 xl:w-72">
                <LiveParticipantsPanel
                  participants={participants}
                  isTeacher={isTeacher}
                  onMuteParticipant={(p) => void muteParticipant(p)}
                  onRemoveParticipant={(p) => void removeParticipant(p)}
                  onMuteAll={() => void muteAllParticipants()}
                />
              </aside>
            ) : null}
          </div>

          {/* Bottom controls bar */}
          <div className="flex h-20 shrink-0 items-center justify-center gap-3 border-t border-white/10 bg-gray-950/90 px-4 backdrop-blur">
            <LiveControlsBar
              micOn={isMicOn}
              cameraOn={isCameraOn}
              screenSharingOn={isScreenSharingOn}
              onToggleMic={() => void toggleMic()}
              onToggleCamera={() => void toggleCamera()}
              onToggleScreenShare={() => void toggleScreenShare()}
              onLeave={() => void handleLeave()}
            />
            {isTeacher ? (
              <>
                <div className="mx-1 h-8 w-px bg-white/15" />
                <button
                  type="button"
                  onClick={() => void toggleRecording()}
                  disabled={isUploading}
                  title={isRecording ? 'Stop recording' : 'Start recording'}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-50 ${isRecording ? 'bg-rose-500/30 text-rose-400 ring-1 ring-rose-500/50' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  <Radio className="h-5 w-5" />
                </button>
              </>
            ) : null}
            {sessionError ? (
              <p className="absolute bottom-20 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-rose-500/20 px-4 py-2 text-xs font-medium text-rose-400">
                {sessionError}
              </p>
            ) : null}
          </div>
        </>
      ) : (

        /* ── Pre-join lobby ───────────────────────────────────────────────── */
        <div className="flex flex-1 items-start justify-center overflow-y-auto p-6 sm:items-center">
          <div className="w-full max-w-md space-y-4 py-4">

            {/* Camera preview card */}
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
              {/* Mic / camera status chips */}
              <div className="absolute bottom-3 left-3 flex gap-2">
                <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${isMicOn ? 'bg-black/50 text-white/70' : 'bg-rose-500/80 text-white'}`}>
                  {isMicOn ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                  Mic
                </span>
                <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${isCameraOn ? 'bg-black/50 text-white/70' : 'bg-rose-500/80 text-white'}`}>
                  {isCameraOn ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
                  Camera
                </span>
              </div>
            </div>

            {/* Device toggles */}
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsMicOn((v) => !v)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95 ${isMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-500 text-white hover:bg-rose-600'}`}
                >
                  {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
                <p className="mt-1.5 text-[11px] text-white/35">{isMicOn ? 'Mic on' : 'Mic off'}</p>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsCameraOn((v) => !v)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95 ${isCameraOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-500 text-white hover:bg-rose-600'}`}
                >
                  {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>
                <p className="mt-1.5 text-[11px] text-white/35">{isCameraOn ? 'Camera on' : 'Camera off'}</p>
              </div>
            </div>

            {/* Lesson info */}
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center">
              <p className="font-semibold text-white">{lesson.title}</p>
              <p className="mt-1 text-sm text-white/40">{teacherClass.name} · {formatDateTime(lesson.scheduledAt)}</p>
              {sessionMode === 'paid' && ticketPriceGBP > 0 ? (
                <p className="mt-1.5 text-xs font-semibold text-emerald-400">
                  Paid session · {currency} {ticketPriceGBP}
                </p>
              ) : null}
            </div>

            {/* Payment success banner */}
            {paymentSuccess && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400">
                Payment confirmed — click Join lesson below to enter.
              </div>
            )}

            {/* Payment required prompt */}
            {paymentRequired ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Paid session</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatMoney(paymentRequired.ticketPriceGBP)}</p>
                <p className="mt-1 text-sm text-white/50">A one-off ticket is required to join this lesson.</p>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => void handlePayForLesson()}
                    disabled={isPayingForLesson || !hasSupabaseConfig}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[color:var(--hub-primary)] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    <CreditCard className="h-4 w-4" />
                    {isPayingForLesson ? 'Redirecting…' : `Pay ${formatMoney(paymentRequired.ticketPriceGBP)}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentRequired(null)}
                    className="rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:border-white/30 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {/* Teacher session settings */}
            {isTeacher && !paymentRequired ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">Session settings</p>
                <LiveSetupPanel
                  isTeacher={isTeacher}
                  sessionMode={sessionMode}
                  ticketPriceGBP={ticketPriceGBP}
                  notes={notes}
                  onSessionModeChange={(mode) => {
                    setSessionMode(mode);
                    if (mode === 'paid' && ticketPriceGBP < 1) setTicketPriceGBP(15);
                    if (mode === 'free') setTicketPriceGBP(0);
                  }}
                  onTicketPriceChange={setTicketPriceGBP}
                  onNotesChange={setNotes}
                  onJoin={() => void handleJoin()}
                  isJoining={isJoining}
                  isDisabled={false}
                />
              </div>
            ) : null}

            {/* Error */}
            {sessionError ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                {sessionError}
              </div>
            ) : null}

            {/* Join button (students + teacher when no payment required) */}
            {!paymentRequired && !isTeacher ? (
              <button
                type="button"
                disabled={isJoining}
                onClick={() => void handleJoin()}
                className="w-full rounded-full bg-[color:var(--hub-primary)] py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(27,74,128,0.35)] transition hover:opacity-90 disabled:opacity-60"
              >
                {isJoining ? 'Connecting…' : 'Join lesson'}
              </button>
            ) : null}

            {/* Teacher join button is inside LiveSetupPanel above */}

          </div>
        </div>
      )}
    </div>
  );
};
