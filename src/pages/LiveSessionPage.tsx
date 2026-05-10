import DailyIframe, { DailyCall, DailyEventObject, DailyParticipant } from '@daily-co/daily-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Circle, Download, Radio, ShieldCheck } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { LiveControlsBar } from '../components/live/LiveControlsBar';
import { LiveParticipantsPanel } from '../components/live/LiveParticipantsPanel';
import { LiveSetupPanel } from '../components/live/LiveSetupPanel';
import { useNotifications } from '../components/notifications/NotificationToast';
import { LiveSessionMode } from '../lib/dailyLive';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import { formatDateTime } from '../lib/utils';
import { useAuthStore } from '../store/auth';
import { useTeacherHubStore } from '../store/teacherHub';

const sortParticipants = (participantsObject: Record<string, DailyParticipant>) =>
  Object.values(participantsObject)
    .sort((a, b) => {
      if (a.local) return -1;
      if (b.local) return 1;
      return (a.user_name || '').localeCompare(b.user_name || '');
    });

export const LiveSessionPage: React.FC = () => {
  const { id = '', lessonId = '' } = useParams();
  const { addNotification } = useNotifications();
  const user = useAuthStore((state) => state.user);
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';
  const isDemoSession = Boolean(user?.id.startsWith('demo-') || user?.email.endsWith('@skillstream.demo'));
  const allClasses = useTeacherHubStore((state) => state.classes);
  const students = useTeacherHubStore((state) => state.students);
  const teacherClass = allClasses.find((entry) => entry.id === id);
  const lesson = teacherClass?.lessons.find((entry) => entry.id === lessonId);
  const currentStudent = students.find((entry) => entry.email.toLowerCase() === (user?.email || '').toLowerCase());

  const setLessonRecording = useTeacherHubStore((state) => state.setLessonRecording);

  const callFrameRef = useRef<DailyCall | null>(null);
  const frameHostRef = useRef<HTMLDivElement | null>(null);
  const roomUrlRef = useRef<string>('');
  const [sessionMode, setSessionMode] = useState<LiveSessionMode>('free');
  const [ticketPriceGBP, setTicketPriceGBP] = useState(0);
  const [notes, setNotes] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharingOn, setIsScreenSharingOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingReady, setRecordingReady] = useState(false);
  const [isFetchingRecording, setIsFetchingRecording] = useState(false);
  const [participants, setParticipants] = useState<DailyParticipant[]>([]);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const loadParticipantState = useCallback(() => {
    const frame = callFrameRef.current;
    if (!frame) return;
    setIsMicOn(frame.localAudio());
    setIsCameraOn(frame.localVideo());
    setIsScreenSharingOn(frame.localScreenVideo());
    setParticipants(sortParticipants(frame.participants()));
  }, []);

  useEffect(() => {
    return () => {
      const frame = callFrameRef.current;
      if (!frame) return;
      frame.leave().catch(() => undefined);
      frame.destroy().catch(() => undefined);
      callFrameRef.current = null;
    };
  }, []);

  if (!teacherClass || !lesson) {
    return <Navigate to="/classes" replace />;
  }
  if (isStudent && (!currentStudent || !teacherClass.students.some((entry) => entry.id === currentStudent.id))) {
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

  const fetchJoinToken = async (): Promise<{ roomUrl: string; token: string; sessionMode: LiveSessionMode }> => {
    if (!hasSupabaseConfig) {
      throw new Error('Live sessions are not configured yet.');
    }

    const requestBody: Record<string, unknown> = { lessonId: lesson.id };
    if (isTeacher) {
      requestBody.sessionMode = sessionMode;
      requestBody.ticketPriceGBP = sessionMode === 'paid' ? Math.max(1, ticketPriceGBP) : 0;
      requestBody.notes = notes.trim();
    }

    const { data, error } = await supabase.functions.invoke('daily-token', {
      body: requestBody,
    });
    if (error) {
      throw new Error(error.message || 'Could not prepare this live lesson.');
    }

    const payload = data as { roomUrl?: string; token?: string; sessionMode?: LiveSessionMode; error?: string; message?: string };
    if (!payload?.roomUrl || !payload?.token) {
      throw new Error(payload?.message || payload?.error || 'Live setup is not ready.');
    }
    return {
      roomUrl: payload.roomUrl,
      token: payload.token,
      sessionMode: payload.sessionMode || 'free',
    };
  };

  const bindFrameListeners = (frame: DailyCall) => {
    frame
      .on('joined-meeting', () => {
        setIsJoined(true);
        setSessionError(null);
        loadParticipantState();
      })
      .on('left-meeting', () => {
        setIsJoined(false);
        setIsRecording(false);
        setParticipants([]);
      })
      .on('participant-joined', () => loadParticipantState())
      .on('participant-left', () => loadParticipantState())
      .on('participant-updated', () => loadParticipantState())
      .on('recording-started', () => setIsRecording(true))
      .on('recording-stopped', () => { setIsRecording(false); setRecordingReady(true); })
      .on('camera-error', (event: DailyEventObject<'camera-error'>) => {
        setSessionError(event.errorMsg?.errorMsg || 'Camera access failed. Check browser permissions.');
      })
      .on('recording-error', () => {
        setSessionError('Recording could not start. Check your Daily room permissions.');
      })
      .on('error', (event: DailyEventObject<'error'>) => {
        setSessionError(event.errorMsg || 'Live session failed to connect.');
      });
  };

  const ensureFrame = () => {
    if (callFrameRef.current) return callFrameRef.current;
    if (!frameHostRef.current) return null;

    const frame = DailyIframe.createFrame(frameHostRef.current, {
      showLeaveButton: false,
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
      },
      showFullscreenButton: true,
    });
    callFrameRef.current = frame;
    bindFrameListeners(frame);
    return frame;
  };

  const handleJoin = async () => {
    if (isDemoSession) {
      setIsJoining(true);
      setSessionError(null);
      window.setTimeout(() => {
        setIsJoined(true);
        setIsJoining(false);
        setParticipants([
          {
            session_id: 'demo-local',
            local: true,
            user_name: user?.name || 'Demo User',
            audio: true,
            video: true,
          } as unknown as DailyParticipant,
          {
            session_id: 'demo-peer-1',
            local: false,
            user_name: 'Ava Thompson',
            audio: true,
            video: false,
          } as unknown as DailyParticipant,
        ]);
        addNotification({
          type: 'success',
          title: 'Demo lesson started',
          message: 'You are now in demo live mode.',
          duration: 2200,
        });
      }, 450);
      return;
    }

    const frame = ensureFrame();
    if (!frame) {
      setSessionError('Live room container did not initialize. Refresh and retry.');
      return;
    }
    setIsJoining(true);
    setSessionError(null);
    try {
      const prepared = await fetchJoinToken();
      roomUrlRef.current = prepared.roomUrl;
      setSessionMode(prepared.sessionMode);
      await frame.join({
        url: prepared.roomUrl,
        userName: user?.name || user?.email || 'SkillStream user',
        token: prepared.token,
      });
      loadParticipantState();
      if (isTeacher) {
        addNotification({
          type: 'success',
          title: 'Lesson started',
          message: 'Your live lesson is now running.',
          duration: 2200,
        });
      }
    } catch {
      setSessionError('Could not start this live lesson right now. Please try again.');
    } finally {
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
    const frame = callFrameRef.current;
    if (!frame) return;
    await frame.leave();
    setIsJoined(false);
    setParticipants([]);
  };

  const toggleMic = () => {
    if (isDemoSession) {
      setIsMicOn((current) => !current);
      return;
    }
    const frame = callFrameRef.current;
    if (!frame) return;
    frame.setLocalAudio(!isMicOn);
    setIsMicOn(!isMicOn);
  };

  const toggleCamera = () => {
    if (isDemoSession) {
      setIsCameraOn((current) => !current);
      return;
    }
    const frame = callFrameRef.current;
    if (!frame) return;
    frame.setLocalVideo(!isCameraOn);
    setIsCameraOn(!isCameraOn);
  };

  const toggleScreenShare = () => {
    if (isDemoSession) {
      setIsScreenSharingOn((current) => !current);
      return;
    }
    const frame = callFrameRef.current;
    if (!frame) return;
    if (isScreenSharingOn) {
      frame.stopScreenShare();
      setIsScreenSharingOn(false);
      return;
    }
    frame.startScreenShare();
    setIsScreenSharingOn(true);
  };

  const handleFetchRecording = async () => {
    if (!hasSupabaseConfig) {
      setSessionError('Recording retrieval requires Supabase to be configured.');
      return;
    }
    setIsFetchingRecording(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-recording', {
        body: { lessonId: lesson.id, roomUrl: roomUrlRef.current },
      });
      if (error) throw new Error(error.message);
      const payload = data as { recordingUrl?: string | null; message?: string };
      if (!payload.recordingUrl) {
        addNotification({ type: 'info', title: 'Still processing', message: payload.message || 'Try again in a minute.', duration: 3000 });
        return;
      }
      setLessonRecording(id, lesson.id, payload.recordingUrl);
      setRecordingReady(false);
      addNotification({ type: 'success', title: 'Recording saved', message: 'The recording link is now in the Lessons tab.', duration: 2800 });
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : 'Could not retrieve recording.');
    } finally {
      setIsFetchingRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isDemoSession && isTeacher) {
      if (isRecording) {
        setIsRecording(false);
        setRecordingReady(true);
        // Simulate recording available after a short delay
        window.setTimeout(() => {
          setLessonRecording(id, lesson.id, 'https://www.w3schools.com/html/mov_bbb.mp4');
          setRecordingReady(false);
          addNotification({ type: 'success', title: 'Demo recording saved', message: 'Recording link added to the Lessons tab.', duration: 2800 });
        }, 1200);
      } else {
        setIsRecording(true);
      }
      return;
    }
    const frame = callFrameRef.current;
    if (!frame || !isTeacher) return;
    try {
      if (isRecording) {
        frame.stopRecording();
        return;
      }
      frame.startRecording();
    } catch {
      setSessionError('Recording action failed. Check room settings in Daily.');
    }
  };

  const muteParticipant = async (participant: DailyParticipant) => {
    if (!isTeacher || participant.local) return;
    if (isDemoSession) {
      addNotification({
        type: 'success',
        title: 'Participant muted',
        message: `${participant.user_name || 'Participant'} has been muted.`,
        duration: 1800,
      });
      return;
    }
    const frame = callFrameRef.current as DailyCall & {
      updateParticipant?: (sessionId: string, updates: Record<string, unknown>) => Promise<unknown>;
    };
    if (!frame?.updateParticipant) return;
    try {
      await frame.updateParticipant(participant.session_id, { setAudio: false });
    } catch {
      setSessionError('Could not mute this participant.');
    }
  };

  const removeParticipant = async (participant: DailyParticipant) => {
    if (!isTeacher || participant.local) return;
    if (isDemoSession) {
      setParticipants((current) => current.filter((entry) => entry.session_id !== participant.session_id));
      addNotification({
        type: 'success',
        title: 'Participant removed',
        message: `${participant.user_name || 'Participant'} has been removed.`,
        duration: 1800,
      });
      return;
    }
    const frame = callFrameRef.current as DailyCall & {
      updateParticipant?: (sessionId: string, updates: Record<string, unknown>) => Promise<unknown>;
    };
    if (!frame?.updateParticipant) return;
    try {
      await frame.updateParticipant(participant.session_id, { eject: true });
    } catch {
      setSessionError('Could not remove this participant.');
    }
  };

  const muteAllParticipants = async () => {
    if (!isTeacher) return;
    const targets = participants.filter((participant) => !participant.local);
    if (targets.length === 0) return;
    await Promise.all(targets.map((participant) => muteParticipant(participant)));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Live classroom</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">{lesson.title}</h2>
            <p className="mt-2 text-sm text-[color:var(--hub-muted)]">{teacherClass.name} • {formatDateTime(lesson.scheduledAt)} • {lesson.durationMinutes} mins</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--hub-muted)]">
              {sessionMode === 'paid' ? `Paid one-off • GBP ${Math.max(1, ticketPriceGBP)}` : 'Free session'}
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
          <div className="relative overflow-hidden rounded-[24px] border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)]">
            {isDemoSession ? (
              <div className="flex h-[360px] w-full items-center justify-center bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_100%)] text-center md:h-[500px]">
                <div className="rounded-2xl border border-[color:var(--hub-border)] bg-white px-5 py-4">
                  <p className="text-sm font-semibold text-[color:var(--hub-text)]">Demo Live Classroom</p>
                  <p className="mt-1 text-sm text-[color:var(--hub-muted)]">No Daily connection required in demo mode.</p>
                </div>
              </div>
            ) : (
              <div ref={frameHostRef} className="h-[360px] w-full md:h-[500px]" />
            )}
            {!isJoined ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[rgba(244,246,248,0.86)]">
                <div className="rounded-2xl border border-[color:var(--hub-border)] bg-white px-4 py-3 text-center">
                  <p className="text-sm font-semibold text-[color:var(--hub-text)]">Ready when you are</p>
                  <p className="mt-1 text-sm text-[color:var(--hub-muted)]">Join from the setup panel.</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 space-y-3">
            {isJoined ? (
              <LiveControlsBar
                micOn={isMicOn}
                cameraOn={isCameraOn}
                screenSharingOn={isScreenSharingOn}
                onToggleMic={toggleMic}
                onToggleCamera={toggleCamera}
                onToggleScreenShare={toggleScreenShare}
                onLeave={handleLeave}
              />
            ) : null}
            {isTeacher && isJoined ? (
              <button
                type="button"
                onClick={toggleRecording}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${isRecording ? 'bg-rose-100 text-rose-700' : 'border border-[color:var(--hub-border)] bg-white text-[color:var(--hub-text)]'}`}
              >
                <Radio className="h-4 w-4" />
                {isRecording ? 'Stop recording' : 'Start recording'}
              </button>
            ) : null}
            {isTeacher && recordingReady && !isDemoSession ? (
              <button
                type="button"
                onClick={() => void handleFetchRecording()}
                disabled={isFetchingRecording}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-primary)] px-3 py-2 text-sm font-semibold text-[color:var(--hub-primary)] disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {isFetchingRecording ? 'Fetching…' : 'Save recording link'}
              </button>
            ) : null}
            {sessionError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{sessionError}</div>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          {!isJoined ? (
            <LiveSetupPanel
              isTeacher={isTeacher}
              sessionMode={sessionMode}
              ticketPriceGBP={ticketPriceGBP}
              notes={notes}
              onSessionModeChange={(mode) => {
                setSessionMode(mode);
                if (mode === 'paid' && ticketPriceGBP < 1) {
                  setTicketPriceGBP(15);
                }
                if (mode === 'free') {
                  setTicketPriceGBP(0);
                }
              }}
              onTicketPriceChange={setTicketPriceGBP}
              onNotesChange={setNotes}
              onJoin={handleJoin}
              isJoining={isJoining}
              isDisabled={false}
            />
          ) : (
            <LiveParticipantsPanel
              participants={participants}
              isTeacher={isTeacher}
              onMuteParticipant={muteParticipant}
              onRemoveParticipant={removeParticipant}
              onMuteAll={muteAllParticipants}
            />
          )}

          <section className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">Session policy</p>
            </div>
            <div className="mt-3 text-sm text-[color:var(--hub-muted)]">
              <p>{sessionMode === 'paid' ? 'Entry should be gated by successful payment checks in backend.' : 'Entry should be limited to enrolled learners and approved attendees.'}</p>
              <p className="mt-2">{notes?.trim() ? notes : 'No teacher notes added for this live session yet.'}</p>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
};
