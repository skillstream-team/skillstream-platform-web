import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { useNotifications } from '../components/notifications/NotificationToast';
import { printStudentReport } from '../lib/progressReport';
import { formatHubDateTime } from '../lib/utils';
import { useAuthStore } from '../store/auth';
import { useTeacherHubStore } from '../store/teacherHub';

export const StudentProfilePage: React.FC = () => {
  const { id = '' } = useParams();
  const user = useAuthStore((state) => state.user);
  const students = useTeacherHubStore((state) => state.students);
  const updateStudentNote = useTeacherHubStore((state) => state.updateStudentNote);
  const student = students.find((entry) => entry.id === id);
  const currentStudent = students.find((entry) => entry.email.toLowerCase() === (user?.email || '').toLowerCase());
  const isStudent = user?.role === 'STUDENT';
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
    return <Navigate to="/students" replace />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Student Profile</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">{student.name}</h2>
            <p className="mt-2 text-sm text-[color:var(--hub-muted)]">{student.email}</p>
          </div>
          {!isStudent ? (
            <button
              type="button"
              onClick={() => printStudentReport(student)}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)] transition hover:bg-[color:var(--hub-soft)]"
            >
              <FileText className="h-4 w-4" />
              Print report
            </button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Overview</p>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-[22px] bg-[color:var(--hub-soft)] p-4">Progress: {student.progress}%</div>
              <div className="rounded-[22px] bg-[color:var(--hub-soft)] p-4">Homework completion: {student.homeworkCompletion}%</div>
              <div className="rounded-[22px] bg-[color:var(--hub-soft)] p-4">Last activity: {formatHubDateTime(student.lastActivity)}</div>
            </div>
          </div>
          <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Classes enrolled</p>
            <div className="mt-4 grid gap-3">
              {student.classes.map((className) => (
                <div key={className} className="rounded-[22px] bg-[color:var(--hub-soft)] p-4 text-sm text-[color:var(--hub-text)]">
                  {className}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Teacher notes</p>
          {isStudent ? (
            <div className="mt-4 rounded-[24px] bg-[color:var(--hub-soft)] p-5">
              <p className="text-sm text-[color:var(--hub-text)]">{student.note}</p>
            </div>
          ) : (
            <form
              className="mt-4 grid gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!noteDraft.trim()) {
                  setNoteError('Note cannot be empty.');
                  return;
                }
                try {
                  setIsSavingNote(true);
                  setNoteError('');
                  await updateStudentNote(student.id, noteDraft);
                  addNotification({
                    type: 'success',
                    title: 'Note updated',
                    message: 'Intervention note saved for this learner.',
                    duration: 2200,
                  });
                } catch (error) {
                  setNoteError(error instanceof Error ? error.message : 'Could not save note.');
                } finally {
                  setIsSavingNote(false);
                }
              }}
            >
              <textarea
                value={noteDraft}
                onChange={(event) => {
                  setNoteDraft(event.target.value);
                  if (noteError) setNoteError('');
                }}
                rows={5}
                placeholder="Add intervention notes, support actions, or follow-up plan"
                className="rounded-[20px] border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none"
              />
              {noteError ? <p className="text-xs text-[color:var(--edu-danger)]">{noteError}</p> : null}
              <button type="submit" disabled={isSavingNote} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {isSavingNote ? 'Saving...' : 'Save note'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
