import React, { useState } from 'react';
import { ActionModal } from '../common/ActionModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { StudentTable } from '../hub/StudentTable';
import { useNotifications } from '../notifications/NotificationToast';
import { cn } from '../../lib/utils';
import { StudentSummary, TeacherClass } from '../../data/teacherHub';

interface Props {
  teacherClass: TeacherClass;
  isStudent: boolean;
  availableStudents: StudentSummary[];
  addStudentToClass: (classId: string, studentId: string) => Promise<void>;
  inviteStudentByEmail: (classId: string, email: string) => Promise<{ status: string; message: string }>;
  removeStudentFromClass: (classId: string, studentId: string) => Promise<void>;
  showAddStudent: boolean;
  onCloseAddStudent: () => void;
}

export const ClassStudentsTab: React.FC<Props> = ({
  teacherClass,
  isStudent,
  availableStudents,
  addStudentToClass,
  inviteStudentByEmail,
  removeStudentFromClass,
  showAddStudent,
  onCloseAddStudent,
}) => {
  const { addNotification } = useNotifications();
  const [studentToRemove, setStudentToRemove] = useState<string | null>(null);
  const [addStudentMode, setAddStudentMode] = useState<'workspace' | 'email'>('workspace');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em]">Enrolled students</p>
            </div>
            {!isStudent ? (
              <button type="button" onClick={onCloseAddStudent} className="rounded-full border border-[color:var(--hub-border)] px-4 py-2 text-sm font-semibold">Manage students</button>
            ) : null}
          </div>
          <div className="mt-5">
            <StudentTable
              students={teacherClass.students}
              allowProfileLinks={!isStudent}
              onRemove={!isStudent ? (id) => setStudentToRemove(id) : undefined}
            />
          </div>
        </section>
      </div>

      <ActionModal isOpen={showAddStudent && !isStudent} title="Add student to class" description="Add existing students or invite by email." onClose={onCloseAddStudent}>
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (addStudentMode === 'workspace') {
              if (!selectedStudentId) { setInviteError('Select a student from your workspace.'); return; }
              try {
                setIsAddingStudent(true);
                await addStudentToClass(teacherClass.id, selectedStudentId);
                setSelectedStudentId('');
                setInviteError('');
                onCloseAddStudent();
                addNotification({ type: 'success', title: 'Student added', message: 'The student has been added to this class.', duration: 2200 });
              } catch (error) {
                setInviteError(error instanceof Error ? error.message : 'Could not add student.');
              } finally {
                setIsAddingStudent(false);
              }
              return;
            }
            const normalizedEmail = inviteEmail.trim().toLowerCase();
            if (!normalizedEmail) { setInviteError('Student email is required.'); return; }
            try {
              setIsAddingStudent(true);
              const result = await inviteStudentByEmail(teacherClass.id, normalizedEmail);
              addNotification({ type: 'success', title: result.status === 'added_existing' ? 'Student added' : 'Invite created', message: result.message, duration: 2400 });
              setInviteEmail('');
              setInviteError('');
              onCloseAddStudent();
            } catch (error) {
              setInviteError(error instanceof Error ? error.message : 'Could not invite student.');
            } finally {
              setIsAddingStudent(false);
            }
          }}
        >
          <div className="inline-flex rounded-full border border-[color:var(--hub-border)] p-1">
            <button type="button" onClick={() => { setAddStudentMode('workspace'); setInviteError(''); }} className={cn('rounded-full px-3 py-1.5 text-sm font-semibold', addStudentMode === 'workspace' ? 'bg-[color:var(--hub-primary)] text-white' : 'text-[color:var(--hub-muted)]')}>Existing student</button>
            <button type="button" onClick={() => { setAddStudentMode('email'); setInviteError(''); }} className={cn('rounded-full px-3 py-1.5 text-sm font-semibold', addStudentMode === 'email' ? 'bg-[color:var(--hub-primary)] text-white' : 'text-[color:var(--hub-muted)]')}>Invite by email</button>
          </div>
          {addStudentMode === 'workspace' ? (
            <>
              <select value={selectedStudentId} onChange={(e) => { setSelectedStudentId(e.target.value); if (inviteError) setInviteError(''); }} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none">
                <option value="">Select a student</option>
                {availableStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {availableStudents.length === 0 ? <p className="text-xs text-[color:var(--hub-muted)]">No available workspace students. Use "Invite by email" to add new learners.</p> : null}
              {inviteError ? <p className="text-xs text-[color:var(--edu-danger)]">{inviteError}</p> : null}
            </>
          ) : (
            <>
              <input type="email" value={inviteEmail} onChange={(e) => { setInviteEmail(e.target.value); if (inviteError) setInviteError(''); }} placeholder="student@example.com" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
              {inviteError ? <p className="text-xs text-[color:var(--edu-danger)]">{inviteError}</p> : null}
            </>
          )}
          <button type="submit" disabled={isAddingStudent} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {isAddingStudent ? 'Working...' : addStudentMode === 'workspace' ? 'Add to class' : 'Create invite'}
          </button>
        </form>
      </ActionModal>

      <ConfirmDialog
        isOpen={!!studentToRemove}
        title="Remove student"
        message="This student will be removed from the class roster."
        confirmText="Remove"
        onCancel={() => setStudentToRemove(null)}
        onConfirm={() => {
          void (async () => {
            if (studentToRemove) {
              try {
                await removeStudentFromClass(teacherClass.id, studentToRemove);
                addNotification({ type: 'success', title: 'Student removed', message: 'The student was removed from this class.', duration: 2200 });
              } catch (error) {
                addNotification({ type: 'error', title: 'Could not remove student', message: error instanceof Error ? error.message : 'Please try again.', duration: 2800 });
              }
            }
            setStudentToRemove(null);
          })();
        }}
      />
    </>
  );
};
