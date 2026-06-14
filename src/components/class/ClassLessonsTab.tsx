import React, { useState } from 'react';
import { PlayCircle, Sparkles, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AiPanel } from '../ai/AiPanel';
import { ActionModal } from '../common/ActionModal';
import { useNotifications } from '../notifications/NotificationToast';
import { cn, formatHubDateTime, toDateTimeLocalMin } from '../../lib/utils';
import { TeacherClass } from '../../data/teacherHub';

const DUE_SOON_MS = 48 * 60 * 60 * 1000;

interface Props {
  teacherClass: TeacherClass;
  isStudent: boolean;
  scheduleLesson: (args: { classId: string; title: string; scheduledAt: string; durationMinutes: number }) => Promise<void>;
  scheduleLessonSeries: (args: { classId: string; title: string; firstScheduledAt: string; durationMinutes: number; occurrences: number }) => Promise<void>;
  rescheduleLesson: (classId: string, lessonId: string, scheduledAt: string) => Promise<void>;
  cancelLesson: (classId: string, lessonId: string) => Promise<void>;
  setLessonAiRecap: (classId: string, lessonId: string, recap: string) => void;
  setScheduleSelectedClassId: (id: string) => void;
  onTabChange: (tab: string) => void;
  showLessonModal: boolean;
  onCloseLessonModal: () => void;
}

export const ClassLessonsTab: React.FC<Props> = ({
  teacherClass,
  isStudent,
  scheduleLesson,
  scheduleLessonSeries,
  rescheduleLesson,
  cancelLesson,
  setLessonAiRecap,
  setScheduleSelectedClassId,
  onTabChange,
  showLessonModal,
  onCloseLessonModal,
}) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [recordingPlayingId, setRecordingPlayingId] = useState<string | null>(null);
  const [aiOpenLessonId, setAiOpenLessonId] = useState<string | null>(null);
  const [aiTabByLesson, setAiTabByLesson] = useState<Record<string, 'plan' | 'quiz' | 'recap'>>({});
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDate, setLessonDate] = useState('');
  const [lessonRepeatWeekly, setLessonRepeatWeekly] = useState(false);
  const [lessonRepeatCount, setLessonRepeatCount] = useState(1);
  const [lessonError, setLessonError] = useState('');
  const [isSchedulingLesson, setIsSchedulingLesson] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<{ lessonId: string; current: string } | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [isReschedulingLesson, setIsReschedulingLesson] = useState(false);

  return (
    <>
      <section className="grid gap-4 lg:grid-cols-2">
        {teacherClass.lessons.map((lesson) => (
          <div key={lesson.id} className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
            <p className={cn('text-xs font-semibold uppercase tracking-[0.18em]', lesson.status === 'today' ? 'text-[color:var(--hub-accent)]' : 'text-[color:var(--hub-primary)]')}>
              {lesson.status === 'cancelled' ? 'Cancelled session' : lesson.status === 'completed' ? 'Past session' : lesson.status === 'today' ? 'Today' : 'Upcoming session'}
            </p>
            <h3 className="mt-3 text-xl font-semibold">{lesson.title}</h3>
            <p className="mt-2 text-sm text-[color:var(--hub-muted)]">{formatHubDateTime(lesson.scheduledAt)}</p>
            <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{lesson.durationMinutes} minutes • {lesson.studentCount} students</p>
            {lesson.syncStatus === 'pending' ? <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-primary)]">Saving...</p> : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setScheduleSelectedClassId(teacherClass.id);
                  if (lesson.status === 'completed' || lesson.status === 'cancelled') { onTabChange('messages'); return; }
                  navigate(`/class/${teacherClass.id}/live/${lesson.id}`);
                }}
                disabled={lesson.status === 'cancelled'}
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Video className="h-4 w-4" />
                {lesson.status === 'cancelled' ? 'Session cancelled' : lesson.status === 'completed' ? 'View session' : 'Start / join lesson'}
              </button>
              {lesson.recordingUrl ? (
                <button
                  type="button"
                  onClick={() => setRecordingPlayingId(recordingPlayingId === lesson.id ? null : lesson.id)}
                  className={cn('inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold', recordingPlayingId === lesson.id ? 'bg-[color:var(--hub-primary)] text-white' : 'border border-[color:var(--hub-border)] text-[color:var(--hub-text)]')}
                >
                  <PlayCircle className="h-4 w-4" />
                  {recordingPlayingId === lesson.id ? 'Close player' : 'Watch recording'}
                </button>
              ) : null}
              {!isStudent ? (
                <>
                  <button type="button" onClick={() => { setRescheduleTarget({ lessonId: lesson.id, current: lesson.scheduledAt }); setRescheduleDate(lesson.scheduledAt.slice(0, 16)); }} className="rounded-full border border-[color:var(--hub-border)] px-4 py-2.5 text-sm font-semibold">Reschedule</button>
                  {lesson.status !== 'cancelled' ? (
                    <button
                      type="button"
                      onClick={() => void (async () => {
                        try {
                          await cancelLesson(teacherClass.id, lesson.id);
                          addNotification({ type: 'success', title: 'Lesson cancelled', message: 'Students will see this lesson as cancelled.', duration: 2200 });
                        } catch (error) {
                          addNotification({ type: 'error', title: 'Could not cancel lesson', message: error instanceof Error ? error.message : 'Please try again.', duration: 2600 });
                        }
                      })()}
                      className="rounded-full border border-[rgba(200,95,73,0.36)] px-4 py-2.5 text-sm font-semibold text-[color:var(--edu-danger)]"
                    >
                      Cancel
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>

            {lesson.recordingUrl && recordingPlayingId === lesson.id ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-[color:var(--hub-border)] bg-gray-950">
                <video key={lesson.recordingUrl} src={lesson.recordingUrl} controls autoPlay controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} className="w-full" style={{ maxHeight: 340, display: 'block' }} />
                <div className="px-4 py-2.5"><span className="text-xs text-white/40">Recorded lesson · {lesson.title}</span></div>
              </div>
            ) : null}

            {!isStudent ? (
              <div className="mt-4">
                <button type="button" onClick={() => setAiOpenLessonId(aiOpenLessonId === lesson.id ? null : lesson.id)} className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--hub-border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--hub-muted)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI tools
                </button>
                {aiOpenLessonId === lesson.id ? (
                  <div className="mt-3 rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] p-4">
                    <div className="flex gap-2">
                      {(['plan', 'quiz', 'recap'] as const).map((tab) => (
                        <button key={tab} type="button" onClick={() => setAiTabByLesson((prev) => ({ ...prev, [lesson.id]: tab }))} className={cn('rounded-full px-3 py-1 text-xs font-semibold', (aiTabByLesson[lesson.id] || 'plan') === tab ? 'bg-[color:var(--hub-primary)] text-white' : 'border border-[color:var(--hub-border)] text-[color:var(--hub-muted)]')}>
                          {tab === 'plan' ? 'Lesson Plan' : tab === 'quiz' ? 'Quiz' : 'Session Recap'}
                        </button>
                      ))}
                    </div>
                    {(aiTabByLesson[lesson.id] || 'plan') === 'plan' ? (
                      <AiPanel feature="ai-lesson-plan" payload={{ topic: lesson.title, durationMinutes: lesson.durationMinutes }} label="Generate lesson plan" outputFormat="text" />
                    ) : (aiTabByLesson[lesson.id] || 'plan') === 'quiz' ? (
                      <AiPanel feature="ai-quiz-gen" payload={{ lessonTitle: lesson.title, questionCount: 5 }} label="Generate quiz" outputFormat="quiz" />
                    ) : (
                      <AiPanel feature="ai-session-recap" payload={{ lessonId: lesson.id }} label="Generate session recap" outputFormat="text" storedResult={lesson.aiRecap} onResult={(r) => setLessonAiRecap(teacherClass.id, lesson.id, r)} />
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
        {teacherClass.lessons.length === 0 ? (
          <div className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-6 text-sm text-[color:var(--hub-muted)] shadow-[0_18px_48px_rgba(15,23,42,0.05)] lg:col-span-2">
            {isStudent ? 'No lessons are scheduled yet for this class.' : 'No lessons scheduled yet. Add the first session.'}
          </div>
        ) : null}
        {!isStudent ? (
          <button type="button" onClick={onCloseLessonModal} className="rounded-[28px] border border-dashed border-[color:var(--hub-border)] bg-white p-6 text-left shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold text-[color:var(--hub-text)]">Schedule a new session</p>
            <p className="mt-2 text-sm text-[color:var(--hub-muted)]">Add another lesson to this class in a couple of clicks.</p>
          </button>
        ) : null}
      </section>

      <ActionModal isOpen={showLessonModal && !isStudent} title="Schedule lesson" description="Add a new class session." onClose={onCloseLessonModal}>
        <form className="grid gap-4" onSubmit={async (event) => {
          event.preventDefault();
          if (!lessonTitle.trim() || !lessonDate) { setLessonError('Lesson title and date/time are required.'); return; }
          const lessonTime = new Date(lessonDate).getTime();
          if (!Number.isFinite(lessonTime) || lessonTime <= Date.now()) { setLessonError('Lesson date/time must be in the future.'); return; }
          try {
            setIsSchedulingLesson(true);
            setLessonError('');
            if (lessonRepeatWeekly && lessonRepeatCount > 1) {
              await scheduleLessonSeries({ classId: teacherClass.id, title: lessonTitle.trim(), firstScheduledAt: new Date(lessonDate).toISOString(), durationMinutes: 60, occurrences: lessonRepeatCount });
            } else {
              await scheduleLesson({ classId: teacherClass.id, title: lessonTitle.trim(), scheduledAt: new Date(lessonDate).toISOString(), durationMinutes: 60 });
            }
            setLessonTitle(''); setLessonDate(''); setLessonRepeatWeekly(false); setLessonRepeatCount(1);
            onCloseLessonModal();
            addNotification({ type: 'success', title: 'Lesson scheduled', message: lessonRepeatWeekly && lessonRepeatCount > 1 ? 'Weekly lesson series added to this class.' : 'New session added to this class.', duration: 2200 });
          } catch (error) {
            setLessonError(error instanceof Error ? error.message : 'Could not schedule lesson.');
          } finally {
            setIsSchedulingLesson(false);
          }
        }}>
          {lessonError ? <p className="text-xs text-[color:var(--edu-danger)]">{lessonError}</p> : null}
          <input value={lessonTitle} onChange={(e) => { setLessonTitle(e.target.value); if (lessonError) setLessonError(''); }} placeholder="Lesson title" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <input type="datetime-local" value={lessonDate} onChange={(e) => { setLessonDate(e.target.value); if (lessonError) setLessonError(''); }} min={toDateTimeLocalMin()} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <label className="flex items-center justify-between rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 text-sm">
            <span className="font-medium text-[color:var(--hub-text)]">Repeat weekly</span>
            <input type="checkbox" checked={lessonRepeatWeekly} onChange={(e) => setLessonRepeatWeekly(e.target.checked)} />
          </label>
          {lessonRepeatWeekly ? (
            <input type="number" min={2} max={12} value={lessonRepeatCount} onChange={(e) => setLessonRepeatCount(Math.max(2, Math.min(12, Number(e.target.value) || 2)))} placeholder="Number of weekly sessions" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          ) : null}
          <button type="submit" disabled={isSchedulingLesson} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isSchedulingLesson ? 'Scheduling...' : 'Schedule lesson'}</button>
        </form>
      </ActionModal>

      <ActionModal isOpen={!!rescheduleTarget && !isStudent} title="Reschedule lesson" description="Move this session to a new date and time." onClose={() => setRescheduleTarget(null)}>
        <form className="grid gap-4" onSubmit={async (event) => {
          event.preventDefault();
          if (!rescheduleTarget || !rescheduleDate) { setRescheduleError('Select a valid date/time.'); return; }
          const nextTime = new Date(rescheduleDate).getTime();
          if (!Number.isFinite(nextTime) || nextTime <= Date.now()) { setRescheduleError('Rescheduled time must be in the future.'); return; }
          try {
            setIsReschedulingLesson(true);
            setRescheduleError('');
            await rescheduleLesson(teacherClass.id, rescheduleTarget.lessonId, new Date(rescheduleDate).toISOString());
            setRescheduleTarget(null);
            setRescheduleDate('');
            addNotification({ type: 'success', title: 'Session rescheduled', message: 'The class lesson time was updated.', duration: 2200 });
          } catch (error) {
            setRescheduleError(error instanceof Error ? error.message : 'Could not reschedule lesson.');
          } finally {
            setIsReschedulingLesson(false);
          }
        }}>
          {rescheduleError ? <p className="text-xs text-[color:var(--edu-danger)]">{rescheduleError}</p> : null}
          <input type="datetime-local" value={rescheduleDate} min={toDateTimeLocalMin()} onChange={(e) => { setRescheduleDate(e.target.value); if (rescheduleError) setRescheduleError(''); }} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <button type="submit" disabled={isReschedulingLesson} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isReschedulingLesson ? 'Saving...' : 'Save new time'}</button>
        </form>
      </ActionModal>

      {/* Suppress unused variable warning — used in assignment due-soon check */}
      {DUE_SOON_MS ? null : null}
    </>
  );
};
