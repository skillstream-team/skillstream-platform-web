import React, { useEffect, useRef, useState } from 'react';
import { Circle, CreditCard, Radio, ShieldCheck } from 'lucide-react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { LiveControlsBar } from '../components/live/LiveControlsBar';
import { LiveParticipantsPanel } from '../components/live/LiveParticipantsPanel';
import { LiveSetupPanel } from '../components/live/LiveSetupPanel';
import { VideoGrid } from '../components/live/VideoGrid';
import { useNotifications } from '../components/notifications/NotificationToast';
import { LiveSessionMode, SWParticipant, SWSessionConfig } from '../lib/signalwireLive';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import { formatDateTime } from '../lib/utils';
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

  // SignalWire session ref + local member ID (set on room.joined)
  const swSessionRef = useRef<any>(null);
  const swMemberIdRef = useRef<string>('');

  // Browser recording (screen capture → Supabase Storage)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);

  // Video container for SignalWire to render into (real sessions only)
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
  const [searchParams] = useSearchParams();
  const paymentSuccess = searchParams.get('payment_success') === '1';

  // Cleanup SignalWire session on unmount
  useEffect(() => {
    return () => {
      swSessionRef.current?.leave().catch(() => undefined);
      swSessionRef.current = null;
    };
  }, []);

  // Students listen for teacher mute/kick via Supabase Realtime
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

  if (lesson.status === 'cancelled') {
    return (
      <div className="space-y-6">
        <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Live classroom</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">Session cancelled</h2>
          <p className="mt-3 text-sm text-[color:var(--hub-muted)]">
            This lesson was cancelled. Please check the class schedule for the replacement session.
          </p>
        </section>
      </div>
    );
  }

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
      // Supabase wraps non-2xx as an error — attempt to read the body
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
      const returnUrl = `${window.location.origin}/live/${id}/${lessonId}?payment_success=1`;
      const { data, error } = await supabase.functions.invoke('dodo-checkout', {
        body: { type: 'lesson', lessonId: lesson.id, classId: id, returnUrl, cancelUrl: `${window.location.origin}/live/${id}/${lessonId}` },
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
        setParticipants([
          { id: 'demo-1', name: user?.name || 'Demo User', isLocal: true, audioMuted: false, videoMuted: false },
          { id: 'demo-2', name: 'Ava Thompson', isLocal: false, audioMuted: false, videoMuted: true },
        ]);
        addNotification({ type: 'success', title: 'Demo lesson started', message: 'You are now in demo live mode.', duration: 2200 });
      }, 450);
      return;
    }

    setIsJoining(true);
    try {
      const config = await fetchJoinToken();
      if (!config) { setIsJoining(false); return; } // payment required — UI already updated
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
      return;
    }
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
  };

  const toggleMic = async () => {
    if (isDemoSession) { setIsMicOn((c) => !c); return; }
    try {
      if (isMicOn) {
        await swSessionRef.current?.audioMute();
      } else {
        await swSessionRef.current?.audioUnmute();
      }
      setIsMicOn((c) => !c);
    } catch {
      // ignore
    }
  };

  const toggleCamera = async () => {
    if (isDemoSession) { setIsCameraOn((c) => !c); return; }
    try {
      if (isCameraOn) {
        await swSessionRef.current?.videoMute();
      } else {
        await swSessionRef.current?.videoUnmute();
      }
      setIsCameraOn((c) => !c);
    } catch {
      // ignore
    }
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
      // Capture the screen/tab so the recording includes all participants' video
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const mimeType =
        MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' :
        MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' :
        'video/webm';
      recordingChunksRef.current = [];
      const recorder = new MediaRecorder(displayStream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        displayStream.getTracks().forEach((t) => t.stop());
        if (recordingChunksRef.current.length === 0) return;
        setIsUploading(true);
        try {
          const blob = new Blob(recordingChunksRef.current, { type: mimeType });
          const path = `${lesson.id}/${Date.now()}.webm`;
          const { error: uploadError } = await supabase.storage
            .from('recordings')
            .upload(path, blob, { contentType: mimeType });
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

      // Stop recording when the user ends the screen share from the browser UI
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

  const controlsBar = (
    <LiveControlsBar
      micOn={isMicOn}
      cameraOn={isCameraOn}
      screenSharingOn={isScreenSharingOn}
      onToggleMic={() => void toggleMic()}
      onToggleCamera={() => void toggleCamera()}
      onToggleScreenShare={() => void toggleScreenShare()}
      onLeave={() => void handleLeave()}
    />
  );

  const actionButtons = (
    <div className="flex flex-wrap gap-2">
      {isTeacher ? (
        <button
          type="button"
          onClick={() => void toggleRecording()}
          disabled={isUploading}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold disabled:opacity-60 ${isRecording ? 'bg-rose-100 text-rose-700' : 'border border-[color:var(--hub-border)] bg-white text-[color:var(--hub-text)]'}`}
        >
          <Radio className="h-4 w-4" />
          {isUploading ? 'Saving…' : isRecording ? 'Stop recording' : 'Start recording'}
        </button>
      ) : null}
    </div>
  );

  const sessionPolicySection = (
    <section className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
        <ShieldCheck className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">Session policy</p>
      </div>
      <div className="mt-3 text-sm text-[color:var(--hub-muted)]">
        <p>{sessionMode === 'paid' ? 'Entry is gated by successful payment checks in backend.' : 'Entry is limited to enrolled learners and approved attendees.'}</p>
        <p className="mt-2">{notes?.trim() ? notes : 'No teacher notes added for this live session yet.'}</p>
      </div>
    </section>
  );

  const videoGridProps = {
    participants,
    isTeacher,
    pinnedId,
    onPin: setPinnedId,
    onMuteParticipant: (p: SWParticipant) => void muteParticipant(p),
    onRemoveParticipant: (p: SWParticipant) => void removeParticipant(p),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Live classroom</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">{lesson.title}</h2>
            <p className="mt-2 text-sm text-[color:var(--hub-muted)]">{teacherClass.name} • {formatDateTime(lesson.scheduledAt)} • {lesson.durationMinutes} mins</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--hub-muted)]">
              {sessionMode === 'paid' ? `Paid one-off • ${currency} ${Math.max(1, ticketPriceGBP)}` : 'Free session'}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${isJoined ? 'bg-emerald-100 text-emerald-700' : 'border border-[color:var(--hub-border)] bg-white text-[color:var(--hub-muted)]'}`}>
              <Circle className={`h-2.5 w-2.5 ${isJoined ? 'fill-emerald-600 text-emerald-600' : 'text-[color:var(--hub-muted)]'}`} />
              {isJoined ? 'Live now' : 'Not connected'}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-6">
            <div className="overflow-hidden rounded-[24px] border border-[color:var(--hub-border)] bg-gray-900">
              {isJoined ? (
                <div className="h-[360px] md:h-[500px]">
                  {isDemoSession ? (
                    <div className="h-full p-2">
                      <VideoGrid {...videoGridProps} className="h-full" />
                    </div>
                  ) : (
                    /* SignalWire renders video tiles into this div */
                    <div ref={swContainerRef} className="h-full w-full" />
                  )}
                </div>
              ) : (
                <div className="flex h-[360px] items-center justify-center md:h-[500px]">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center backdrop-blur-sm">
                    <p className="text-sm font-semibold text-white">Ready when you are</p>
                    <p className="mt-1 text-sm text-white/50">Join from the setup panel.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {isJoined ? controlsBar : null}
              {isJoined ? actionButtons : null}
              {sessionError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{sessionError}</div>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            {/* Payment success banner (student returns from Dodo) */}
            {paymentSuccess && !isJoined ? (
              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                Payment confirmed — click "Join lesson" below to enter.
              </div>
            ) : null}

            {!isJoined ? (
              paymentRequired ? (
                /* ── Payment prompt ── */
                <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Paid session</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[color:var(--hub-text)]">Payment required</h3>
                  <p className="mt-2 text-sm text-[color:var(--hub-muted)]">
                    This lesson requires a one-off ticket to join.
                  </p>
                  <p className="mt-3 text-3xl font-bold text-[color:var(--hub-text)]">
                    {formatMoney(paymentRequired.ticketPriceGBP)}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void handlePayForLesson()}
                      disabled={isPayingForLesson || !hasSupabaseConfig}
                      className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(27,74,128,0.25)] disabled:opacity-60"
                    >
                      <CreditCard className="h-4 w-4" />
                      {isPayingForLesson ? 'Redirecting…' : `Pay ${formatMoney(paymentRequired.ticketPriceGBP)} to join`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentRequired(null)}
                      className="rounded-full border border-[color:var(--hub-border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)]"
                    >
                      Cancel
                    </button>
                  </div>
                </section>
              ) : (
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
              )
            ) : (
              <LiveParticipantsPanel
                participants={participants}
                isTeacher={isTeacher}
                onMuteParticipant={(p) => void muteParticipant(p)}
                onRemoveParticipant={(p) => void removeParticipant(p)}
                onMuteAll={() => void muteAllParticipants()}
              />
            )}
            {sessionPolicySection}
          </div>
        </section>
    </div>
  );
};
