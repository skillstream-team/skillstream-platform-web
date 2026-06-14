import React, { useMemo, useState } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight, Clock3, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ActionModal } from '../components/common/ActionModal';
import { useNotifications } from '../components/notifications/NotificationToast';
import { cn, formatHubDateTime, toDateTimeLocalMin } from '../lib/utils';
import { downloadIcal } from '../lib/ical';
import { useAuthStore } from '../store/auth';
import { useSessionUiStore } from '../store/sessionUi';
import { useTeacherHubStore } from '../store/teacherHub';

export const SchedulePage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role === 'STUDENT';
  const navigate = useNavigate();
  const allClasses = useTeacherHubStore((state) => state.classes);
  const students = useTeacherHubStore((state) => state.students);
  const currentStudent = students.find((entry) => entry.email.toLowerCase() === (user?.email || '').toLowerCase());
  const classes = useMemo(
    () => (isStudent
      ? currentStudent
        ? allClasses.filter((entry) => entry.students.some((student) => student.id === currentStudent.id))
        : []
      : allClasses),
    [allClasses, currentStudent, isStudent]
  );
  const scheduleLesson = useTeacherHubStore((state) => state.scheduleLesson);
  const scheduleLessonSeries = useTeacherHubStore((state) => state.scheduleLessonSeries);
  const rescheduleLesson = useTeacherHubStore((state) => state.rescheduleLesson);
  const cancelLesson = useTeacherHubStore((state) => state.cancelLesson);
  const { addNotification } = useNotifications();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const selectedClassId = useSessionUiStore((state) => state.scheduleSelectedClassId);
  const setSelectedClassId = useSessionUiStore((state) => state.setScheduleSelectedClassId);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDate, setLessonDate] = useState('');
  const [lessonRepeatWeekly, setLessonRepeatWeekly] = useState(false);
  const [lessonRepeatCount, setLessonRepeatCount] = useState(1);
  const [scheduleError, setScheduleError] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<{ classId: string; lessonId: string } | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [calendarCursor, setCalendarCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const calendarYear = calendarCursor.getFullYear();
  const calendarMonth = calendarCursor.getMonth();
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const mondayIndex = (firstDay.getDay() + 6) % 7;
  const trailingDays = (7 - ((mondayIndex + daysInMonth) % 7 || 7)) % 7;
  const calendarCells: Array<number | null> = [
    ...Array.from({ length: mondayIndex }).map(() => null),
    ...Array.from({ length: daysInMonth }).map((_, index) => index + 1),
    ...Array.from({ length: trailingDays }).map(() => null),
  ];
  const lessons = useMemo(
    () =>
      classes
        .flatMap((entry) => entry.lessons)
        .filter((lesson) => lesson.status !== 'completed' && lesson.status !== 'cancelled')
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [classes]
  );
  const visibleLessons = useMemo(
    () =>
      lessons.filter((lesson) => {
        const lessonDate = new Date(lesson.scheduledAt);
        return lessonDate.getFullYear() === calendarYear && lessonDate.getMonth() === calendarMonth;
      }),
    [calendarMonth, calendarYear, lessons]
  );
  const calendarTitle = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(calendarCursor);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Schedule</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">
          {isStudent ? 'Your lesson calendar.' : 'Plan lessons and avoid conflicts quickly.'}
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="max-w-2xl text-sm text-[color:var(--hub-muted)]">
            {isStudent
              ? 'See upcoming sessions and class timings in one place.'
              : 'Keep upcoming sessions visible and rescheduling simple.'}
          </p>
          {lessons.length > 0 ? (
            <button
              type="button"
              onClick={() => downloadIcal('skillstream-lessons.ics', lessons)}
              className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full border border-[color:var(--hub-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)] transition hover:bg-[color:var(--hub-soft)]"
            >
              <Download className="h-4 w-4" />
              Export to Calendar
            </button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
              <CalendarRange className="h-5 w-5" />
              <p className="text-sm font-semibold uppercase tracking-[0.18em]">Calendar</p>
            </div>
            {!isStudent ? (
              <button type="button" onClick={() => setShowScheduleModal(true)} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white">
                Schedule lesson
              </button>
            ) : null}
          </div>
          <div className="mt-5 rounded-[28px] bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_100%)] dark:bg-[linear-gradient(180deg,#1c2333_0%,#0d1117_100%)] p-5">
            <div className="mb-3 flex items-center justify-between rounded-2xl bg-white dark:bg-[#0d1117] px-3 py-2">
              <button
                type="button"
                onClick={() => setCalendarCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                className="rounded-full border border-[color:var(--hub-border)] p-1.5 text-[color:var(--hub-muted)]"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-semibold text-[color:var(--hub-text)]">{calendarTitle}</p>
              <button
                type="button"
                onClick={() => setCalendarCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                className="rounded-full border border-[color:var(--hub-border)] p-1.5 text-[color:var(--hub-muted)]"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--hub-muted)]">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-7 gap-2">
              {calendarCells.map((day, index) => {
                const hasLesson = day
                  ? lessons.some((lesson) => {
                      const lessonDate = new Date(lesson.scheduledAt);
                      return (
                        lessonDate.getFullYear() === calendarYear
                        && lessonDate.getMonth() === calendarMonth
                        && lessonDate.getDate() === day
                      );
                    })
                  : false;
                return (
                  <div
                    key={index}
                    className={cn('flex aspect-square items-center justify-center rounded-2xl text-sm', day ? hasLesson ? 'bg-[color:var(--hub-accent)] font-semibold text-white' : 'bg-white dark:bg-[#1c2333] text-[color:var(--hub-muted)]' : 'bg-transparent')}
                  >
                    {day || ''}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
            <Clock3 className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em]">Sessions in {calendarTitle}</p>
          </div>
          <div className="mt-5 grid gap-3">
            {visibleLessons.map((lesson) => (
              <div key={lesson.id} className="rounded-[24px] border border-[color:var(--hub-border)] p-4">
                <p className="text-sm font-semibold text-[color:var(--hub-text)]">{lesson.title}</p>
                <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{lesson.className}</p>
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--hub-muted)]">
                  {formatHubDateTime(lesson.scheduledAt)} • {lesson.durationMinutes} min
                </p>
                {lesson.syncStatus === 'pending' ? (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-primary)]">Saving...</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/class/${lesson.classId}/live/${lesson.id}`)}
                    className="rounded-full bg-[color:var(--hub-primary)] px-4 py-2 text-sm font-semibold text-white"
                  >
                    {isStudent ? 'Join lesson' : 'Open live room'}
                  </button>
                  {!isStudent ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleTarget({ classId: lesson.classId, lessonId: lesson.id });
                          setRescheduleDate(lesson.scheduledAt.slice(0, 16));
                        }}
                        className="rounded-full border border-[color:var(--hub-border)] px-4 py-2 text-sm font-semibold"
                      >
                        Quick reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void (async () => {
                            try {
                              await cancelLesson(lesson.classId, lesson.id);
                              addNotification({
                                type: 'success',
                                title: 'Lesson cancelled',
                                message: 'Removed from upcoming schedule.',
                                duration: 2200,
                              });
                            } catch (error) {
                              addNotification({
                                type: 'error',
                                title: 'Could not cancel',
                                message: error instanceof Error ? error.message : 'Please try again.',
                                duration: 2600,
                              });
                            }
                          })();
                        }}
                        className="rounded-full border border-[rgba(200,95,73,0.36)] px-4 py-2 text-sm font-semibold text-[color:var(--edu-danger)]"
                      >
                        Cancel
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
            {visibleLessons.length === 0 ? (
              <div className="rounded-[24px] bg-[color:var(--hub-soft)] p-4 text-sm text-[color:var(--hub-muted)]">
                No sessions in this month.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <ActionModal isOpen={showScheduleModal && !isStudent} title="Schedule lesson" description="Add a lesson to a class and place it on the calendar." onClose={() => setShowScheduleModal(false)}>
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!selectedClassId || !lessonTitle.trim() || !lessonDate) {
              setScheduleError('Class, title, and date/time are required.');
              return;
            }
            const lessonTime = new Date(lessonDate).getTime();
            if (!Number.isFinite(lessonTime) || lessonTime <= Date.now()) {
              setScheduleError('Lesson date/time must be in the future.');
              return;
            }
            try {
              setIsScheduling(true);
              setScheduleError('');
              if (lessonRepeatWeekly && lessonRepeatCount > 1) {
                await scheduleLessonSeries({
                  classId: selectedClassId,
                  title: lessonTitle.trim(),
                  firstScheduledAt: new Date(lessonDate).toISOString(),
                  durationMinutes: 60,
                  occurrences: lessonRepeatCount,
                });
              } else {
                await scheduleLesson({ classId: selectedClassId, title: lessonTitle.trim(), scheduledAt: new Date(lessonDate).toISOString(), durationMinutes: 60 });
              }
              setSelectedClassId('');
              setLessonTitle('');
              setLessonDate('');
              setLessonRepeatWeekly(false);
              setLessonRepeatCount(1);
              setShowScheduleModal(false);
              addNotification({
                type: 'success',
                title: 'Lesson scheduled',
                message: lessonRepeatWeekly && lessonRepeatCount > 1 ? 'Weekly lesson series added to your calendar.' : 'The lesson has been added to your calendar.',
                duration: 2200,
              });
            } catch (error) {
              setScheduleError(error instanceof Error ? error.message : 'Could not schedule lesson.');
            } finally {
              setIsScheduling(false);
            }
          }}
        >
          {scheduleError ? <p className="text-xs text-[color:var(--edu-danger)]">{scheduleError}</p> : null}
          <select value={selectedClassId} onChange={(event) => {
            setSelectedClassId(event.target.value);
            if (scheduleError) setScheduleError('');
          }} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none">
            <option value="">Select class</option>
            {classes.map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.name}</option>
            ))}
          </select>
          <input value={lessonTitle} onChange={(event) => {
            setLessonTitle(event.target.value);
            if (scheduleError) setScheduleError('');
          }} placeholder="Lesson title" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <input type="datetime-local" value={lessonDate} min={toDateTimeLocalMin()} onChange={(event) => {
            setLessonDate(event.target.value);
            if (scheduleError) setScheduleError('');
          }} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <label className="flex items-center justify-between rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 text-sm">
            <span className="font-medium text-[color:var(--hub-text)]">Repeat weekly</span>
            <input
              type="checkbox"
              checked={lessonRepeatWeekly}
              onChange={(event) => setLessonRepeatWeekly(event.target.checked)}
            />
          </label>
          {lessonRepeatWeekly ? (
            <input
              type="number"
              min={2}
              max={12}
              value={lessonRepeatCount}
              onChange={(event) => setLessonRepeatCount(Math.max(2, Math.min(12, Number(event.target.value) || 2)))}
              placeholder="Number of weekly sessions"
              className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none"
            />
          ) : null}
          <button type="submit" disabled={isScheduling} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isScheduling ? 'Adding...' : 'Add lesson'}</button>
        </form>
      </ActionModal>

      <ActionModal isOpen={!!rescheduleTarget && !isStudent} title="Quick reschedule" description="Move this lesson without leaving the calendar." onClose={() => setRescheduleTarget(null)}>
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!rescheduleTarget || !rescheduleDate) {
              setRescheduleError('Select a new date and time.');
              return;
            }
            const nextTime = new Date(rescheduleDate).getTime();
            if (!Number.isFinite(nextTime) || nextTime <= Date.now()) {
              setRescheduleError('Rescheduled time must be in the future.');
              return;
            }
            try {
              setIsRescheduling(true);
              setRescheduleError('');
              await rescheduleLesson(rescheduleTarget.classId, rescheduleTarget.lessonId, new Date(rescheduleDate).toISOString());
              setRescheduleTarget(null);
              setRescheduleDate('');
              addNotification({
                type: 'success',
                title: 'Lesson moved',
                message: 'Session time has been updated.',
                duration: 2200,
              });
            } catch (error) {
              setRescheduleError(error instanceof Error ? error.message : 'Could not reschedule lesson.');
            } finally {
              setIsRescheduling(false);
            }
          }}
        >
          {rescheduleError ? <p className="text-xs text-[color:var(--edu-danger)]">{rescheduleError}</p> : null}
          <input type="datetime-local" value={rescheduleDate} min={toDateTimeLocalMin()} onChange={(event) => {
            setRescheduleDate(event.target.value);
            if (rescheduleError) setRescheduleError('');
          }} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <button type="submit" disabled={isRescheduling} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isRescheduling ? 'Saving...' : 'Save'}</button>
        </form>
      </ActionModal>
    </div>
  );
};
