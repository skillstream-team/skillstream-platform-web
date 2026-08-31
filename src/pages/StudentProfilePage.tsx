import React, { useEffect, useState } from 'react';
import { BookOpen, FileText, Settings } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useNotifications } from '../components/notifications/NotificationToast';
import { printStudentReport } from '../lib/progressReport';
import { formatHubDateTime } from '../lib/utils';
import { useAuthStore } from '../store/auth';
import { useTeacherHubStore } from '../store/teacherHub';

const ProgressBar: React.FC<{ value: number; color?: string }> = ({ value, color = 'var(--hub-accent)' }) => (
  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[color:var(--hub-soft)]">
    <div
      className="h-full rounded-full transition-all duration-500"
      style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: `color-mix(in srgb, ${color} 100%, transparent)` }}
    />
  </div>
);

export const StudentProfilePage: React.FC = () => {
  const { id = '' } = useParams();
  const user = useAuthStore((state) => state.user);
  const students = useTeacherHubStore((state) => state.students);
  const updateStudentNote = useTeacherHubStore((state) => state.updateStudentNote);
  const student = students.find((entry) => entry.id === id);
  const currentStudent = students.find((entry) => entry.email.toLowerCase() === (user?.email || '').toLowerCase());
  const isStudent = user?.role === 'STUDENT';
  const isOwnProfile = isStudent && currentStudent?.id === student?.id;
  const { addNotification } = useNotifications();
  const [noteDraft, setNoteDraft] = useState(student?.note || '');
  const [noteError, setNoteError] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    setNoteDraft(student?.note || '');
    setNoteError('');
  }, [student?.id, student?.note]);

  if (!student) {
    return <Navigate to="/students" replace />;
  }
  if (isStudent && (!currentStudent || currentStudent.id !== student.id)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[color:var(--hub-primary)] text-xl font-bold text-white">
              {student.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">
                {isOwnProfile ? 'My Profile' : 'Student Profile'}
              </p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">{student.name}</h2>
              <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{student.email}</p>
              {user?.subjects && !isStudent ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {user.subjects.split(',').map((s) => s.trim()).filter(Boolean).map((subject) => (
                    <span key={subject} className="rounded-full bg-[color:var(--hub-soft)] px-3 py-1 text-xs font-medium text-[color:var(--hub-text)]">
                      {subject}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isOwnProfile ? (
              <Link
                to="/settings"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)] transition hover:bg-[color:var(--hub-soft)]"
              >
                <Settings className="h-4 w-4" />
                Edit profile
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => printStudentReport(student)}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)] transition hover:bg-[color:var(--hub-soft)]"
              >
                <FileText className="h-4 w-4" />
                Print report
              </button>
            )}
          </div>
        </div>

        {/* Bio — shown if the auth user has set one (students viewing own profile) */}
        {isOwnProfile && user?.bio ? (
          <div className="mt-5 rounded-[22px] bg-[color:var(--hub-soft)] px-5 py-4">
            <p className="text-sm leading-relaxed text-[color:var(--hub-text)]">{user.bio}</p>
          </div>
        ) : null}
      </section>

      <section className={`grid gap-6 ${isStudent ? '' : 'xl:grid-cols-[0.9fr_1.1fr]'}`}>
        <div className="space-y-6">
          {/* Progress stats */}
          <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">
              {isOwnProfile ? 'My progress' : 'Progress overview'}
            </p>
            <div className="mt-4 grid gap-5">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[color:var(--hub-text)]">Overall progress</p>
                  <p className="text-sm font-bold text-[color:var(--hub-primary)]">{student.progress}%</p>
                </div>
                <ProgressBar value={student.progress} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[color:var(--hub-text)]">Homework completion</p>
                  <p className="text-sm font-bold text-[color:var(--hub-primary)]">{student.homeworkCompletion}%</p>
                </div>
                <ProgressBar value={student.homeworkCompletion} />
              </div>
              <div className="rounded-[20px] bg-[color:var(--hub-soft)] px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">Last active</p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--hub-text)]">{formatHubDateTime(student.lastActivity)}</p>
              </div>
              {student.needsAttention && !isStudent ? (
                <div className="rounded-[20px] border border-[rgba(200,95,73,0.24)] bg-[rgba(200,95,73,0.08)] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--edu-danger)]">Needs attention</p>
                  <p className="mt-1 text-xs text-[color:var(--hub-muted)]">Progress or homework completion is below target.</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Classes enrolled */}
          <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[color:var(--hub-primary)]" />
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">
                {isOwnProfile ? 'My classes' : 'Classes enrolled'}
              </p>
            </div>
            <div className="mt-4 grid gap-2">
              {student.classes.length > 0 ? student.classes.map((className) => (
                <div key={className} className="rounded-[20px] bg-[color:var(--hub-soft)] px-4 py-3 text-sm font-medium text-[color:var(--hub-text)]">
                  {className}
                </div>
              )) : (
                <div className="rounded-[20px] bg-[color:var(--hub-soft)] px-4 py-3 text-sm text-[color:var(--hub-muted)]">
                  Not enrolled in any classes yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Teacher notes — internal, not shown on the student's own profile view */}
        {!isStudent ? (
          <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Teacher notes</p>
            <form
              className="mt-4 grid gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!noteDraft.trim()) { setNoteError('Note cannot be empty.'); return; }
                try {
                  setIsSavingNote(true);
                  setNoteError('');
                  await updateStudentNote(student.id, noteDraft);
                  addNotification({ type: 'success', title: 'Note updated', message: 'Intervention note saved for this learner.', duration: 2200 });
                } catch (error) {
                  setNoteError(error instanceof Error ? error.message : 'Could not save note.');
                } finally {
                  setIsSavingNote(false);
                }
              }}
            >
              <textarea
                value={noteDraft}
                onChange={(event) => { setNoteDraft(event.target.value); if (noteError) setNoteError(''); }}
                rows={6}
                placeholder="Add intervention notes, support actions, or follow-up plan"
                className="rounded-[20px] border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none focus:border-[color:var(--hub-primary)]"
              />
              {noteError ? <p className="text-xs text-[color:var(--edu-danger)]">{noteError}</p> : null}
              <button
                type="submit"
                disabled={isSavingNote}
                className="rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSavingNote ? 'Saving...' : 'Save note'}
              </button>
            </form>
          </div>
        ) : null}
      </section>
    </div>
  );
};
