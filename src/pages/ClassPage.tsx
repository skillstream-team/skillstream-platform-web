import React, { useState } from 'react';
import { Archive, CalendarDays, Copy, Pencil, Plus } from 'lucide-react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ActionModal } from '../components/common/ActionModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ClassStudentsTab } from '../components/class/ClassStudentsTab';
import { ClassLessonsTab } from '../components/class/ClassLessonsTab';
import { ClassHomeworkTab } from '../components/class/ClassHomeworkTab';
import { ClassResourcesTab } from '../components/class/ClassResourcesTab';
import { ClassProgressTab } from '../components/class/ClassProgressTab';
import { ClassMessagesTab } from '../components/class/ClassMessagesTab';
import { useNotifications } from '../components/notifications/NotificationToast';
import { cn, formatHubDateTime } from '../lib/utils';
import { useAuthStore } from '../store/auth';
import { useSessionUiStore } from '../store/sessionUi';
import { useTeacherHubStore } from '../store/teacherHub';

const tabs = [
  { id: 'students', label: 'Students' },
  { id: 'lessons', label: 'Lessons' },
  { id: 'homework', label: 'Homework / Assignments' },
  { id: 'resources', label: 'Resources' },
  { id: 'progress', label: 'Progress Tracking' },
  { id: 'messages', label: 'Messages' },
] as const;

export const ClassPage: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role === 'STUDENT';
  const rememberedTab = useSessionUiStore((state) => state.classTabById[id]);
  const setClassTab = useSessionUiStore((state) => state.setClassTab);
  const setScheduleSelectedClassId = useSessionUiStore((state) => state.setScheduleSelectedClassId);
  const classDraft = useSessionUiStore((state) => state.messageDraftByClassId[id] || '');
  const setDraft = useSessionUiStore((state) => state.setMessageDraft);
  const activeTab = tabs.some((tab) => tab.id === searchParams.get('tab'))
    ? (searchParams.get('tab') as (typeof tabs)[number]['id'])
    : rememberedTab || 'students';
  const teacherClass = useTeacherHubStore((state) => state.classes.find((c) => c.id === id));
  const allStudents = useTeacherHubStore((state) => state.students);
  const currentStudent = allStudents.find((s) => s.email.toLowerCase() === (user?.email || '').toLowerCase());
  const { addNotification } = useNotifications();
  const refreshInvite = useTeacherHubStore((state) => state.refreshInvite);
  const updateClassDetails = useTeacherHubStore((state) => state.updateClassDetails);
  const archiveClass = useTeacherHubStore((state) => state.archiveClass);
  const addStudentToClass = useTeacherHubStore((state) => state.addStudentToClass);
  const inviteStudentByEmail = useTeacherHubStore((state) => state.inviteStudentByEmail);
  const removeStudentFromClass = useTeacherHubStore((state) => state.removeStudentFromClass);
  const scheduleLesson = useTeacherHubStore((state) => state.scheduleLesson);
  const scheduleLessonSeries = useTeacherHubStore((state) => state.scheduleLessonSeries);
  const rescheduleLesson = useTeacherHubStore((state) => state.rescheduleLesson);
  const cancelLesson = useTeacherHubStore((state) => state.cancelLesson);
  const createAssignment = useTeacherHubStore((state) => state.createAssignment);
  const submitAssignment = useTeacherHubStore((state) => state.submitAssignment);
  const gradeAssignmentSubmission = useTeacherHubStore((state) => state.gradeAssignmentSubmission);
  const uploadClassResource = useTeacherHubStore((state) => state.uploadClassResource);
  const sendClassMessage = useTeacherHubStore((state) => state.sendClassMessage);
  const setLessonAiRecap = useTeacherHubStore((state) => state.setLessonAiRecap);

  // Modal open/close state (all tabs)
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showArchiveClassConfirm, setShowArchiveClassConfirm] = useState(false);
  const [editClassName, setEditClassName] = useState('');
  const [editClassOverview, setEditClassOverview] = useState('');
  const [editClassError, setEditClassError] = useState('');
  const [isSavingClassDetails, setIsSavingClassDetails] = useState(false);
  const [isArchivingClass, setIsArchivingClass] = useState(false);

  if (!teacherClass) return <Navigate to="/classes" replace />;
  if (isStudent && (!currentStudent || !teacherClass.students.some((s) => s.id === currentStudent.id))) {
    return <Navigate to="/classes" replace />;
  }

  const availableStudents = allStudents.filter((s) => !teacherClass.students.some((m) => m.id === s.id));

  return (
    <div className="space-y-6">
      {/* Class header */}
      <section className={cn('rounded-[32px] border border-[color:var(--hub-border)] bg-gradient-to-br p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8', teacherClass.accent)}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Class Detail</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">{teacherClass.name}</h2>
            <p className="mt-4 max-w-2xl text-sm text-[color:var(--hub-text)]">{teacherClass.overview}</p>
          </div>
          <div className="grid gap-3 rounded-[24px] bg-white/80 p-4 text-sm">
            <div>
              <p className="text-[color:var(--hub-muted)]">Students</p>
              <p className="mt-1 font-semibold text-[color:var(--hub-text)]">{teacherClass.studentCount} enrolled</p>
            </div>
            <div>
              <p className="text-[color:var(--hub-muted)]">Next session</p>
              <p className="mt-1 font-semibold text-[color:var(--hub-text)]">{formatHubDateTime(teacherClass.nextSessionAt)}</p>
            </div>
            <div>
              <p className="text-[color:var(--hub-muted)]">Invite code</p>
              <p className="mt-1 font-semibold text-[color:var(--hub-text)]">{teacherClass.inviteCode}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {!isStudent ? (
            <>
              <button type="button" onClick={() => setShowAddStudent(true)} className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white">
                <Plus className="h-4 w-4" />
                Add student
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(teacherClass.inviteLink).then(() => {
                    addNotification({ type: 'success', title: 'Invite copied', message: 'The invite link is in your clipboard.', duration: 2200 });
                  }).catch(() => {
                    addNotification({ type: 'warning', title: 'Copy failed', message: 'Clipboard access is blocked in this browser tab.', duration: 2600 });
                  });
                  void refreshInvite(teacherClass.id).catch(() => null);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)]"
              >
                <Copy className="h-4 w-4" />
                Copy and refresh invite
              </button>
              <button
                type="button"
                onClick={() => { setEditClassName(teacherClass.name); setEditClassOverview(teacherClass.overview); setEditClassError(''); setShowEditClassModal(true); }}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)]"
              >
                <Pencil className="h-4 w-4" />
                Edit class
              </button>
              <button
                type="button"
                onClick={() => setShowArchiveClassConfirm(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(200,95,73,0.3)] bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--edu-danger)]"
              >
                <Archive className="h-4 w-4" />
                Archive class
              </button>
            </>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)]">
              <CalendarDays className="h-4 w-4" />
              Invite code: {teacherClass.inviteCode}
            </span>
          )}
        </div>
      </section>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setSearchParams({ tab: tab.id }); setClassTab(id, tab.id); }}
            className={cn('rounded-full px-4 py-2.5 text-sm font-semibold transition', activeTab === tab.id ? 'bg-[color:var(--hub-primary)] text-white' : 'border border-[color:var(--hub-border)] bg-white text-[color:var(--hub-muted)]')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === 'students' ? (
        <ClassStudentsTab
          teacherClass={teacherClass}
          isStudent={isStudent}
          availableStudents={availableStudents}
          addStudentToClass={addStudentToClass}
          inviteStudentByEmail={inviteStudentByEmail}
          removeStudentFromClass={removeStudentFromClass}
          showAddStudent={showAddStudent}
          onCloseAddStudent={() => setShowAddStudent(false)}
        />
      ) : null}

      {activeTab === 'lessons' ? (
        <ClassLessonsTab
          teacherClass={teacherClass}
          isStudent={isStudent}
          scheduleLesson={scheduleLesson}
          scheduleLessonSeries={scheduleLessonSeries}
          rescheduleLesson={rescheduleLesson}
          cancelLesson={cancelLesson}
          setLessonAiRecap={setLessonAiRecap}
          setScheduleSelectedClassId={setScheduleSelectedClassId}
          onTabChange={(tab) => { setSearchParams({ tab }); setClassTab(id, tab as 'students' | 'lessons' | 'homework' | 'resources' | 'progress' | 'messages'); }}
          showLessonModal={showLessonModal}
          onCloseLessonModal={() => setShowLessonModal((p) => !p)}
        />
      ) : null}

      {activeTab === 'homework' ? (
        <ClassHomeworkTab
          teacherClass={teacherClass}
          isStudent={isStudent}
          createAssignment={createAssignment}
          submitAssignment={submitAssignment}
          gradeAssignmentSubmission={gradeAssignmentSubmission}
          showAssignmentModal={showAssignmentModal}
          onCloseAssignmentModal={() => setShowAssignmentModal((p) => !p)}
        />
      ) : null}

      {activeTab === 'resources' ? (
        <ClassResourcesTab
          teacherClass={teacherClass}
          isStudent={isStudent}
          uploadClassResource={uploadClassResource}
          showResourceModal={showResourceModal}
          onCloseResourceModal={() => setShowResourceModal((p) => !p)}
        />
      ) : null}

      {activeTab === 'progress' ? (
        <ClassProgressTab teacherClass={teacherClass} />
      ) : null}

      {activeTab === 'messages' ? (
        <ClassMessagesTab
          teacherClass={teacherClass}
          isStudent={isStudent}
          classDraft={classDraft}
          onDraftChange={(value) => setDraft(id, value)}
          sendClassMessage={sendClassMessage}
          clearDraft={() => setDraft(id, '')}
          showMessageModal={showMessageModal}
          onCloseMessageModal={() => setShowMessageModal((p) => !p)}
        />
      ) : null}

      {/* Edit class modal */}
      <ActionModal isOpen={showEditClassModal && !isStudent} title="Edit class details" description="Update your class name and description." onClose={() => setShowEditClassModal(false)}>
        <form className="grid gap-4" onSubmit={async (event) => {
          event.preventDefault();
          if (!editClassName.trim() || !editClassOverview.trim()) { setEditClassError('Class name and description are required.'); return; }
          try {
            setIsSavingClassDetails(true);
            setEditClassError('');
            await updateClassDetails(teacherClass.id, { name: editClassName.trim(), overview: editClassOverview.trim() });
            setShowEditClassModal(false);
            addNotification({ type: 'success', title: 'Class updated', message: 'Class details have been saved.', duration: 2200 });
          } catch (error) {
            setEditClassError(error instanceof Error ? error.message : 'Could not update class.');
          } finally {
            setIsSavingClassDetails(false);
          }
        }}>
          <input value={editClassName} onChange={(e) => { setEditClassName(e.target.value); if (editClassError) setEditClassError(''); }} placeholder="Class name" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <textarea value={editClassOverview} onChange={(e) => { setEditClassOverview(e.target.value); if (editClassError) setEditClassError(''); }} rows={4} placeholder="Class description" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          {editClassError ? <p className="text-xs text-[color:var(--edu-danger)]">{editClassError}</p> : null}
          <button type="submit" disabled={isSavingClassDetails} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isSavingClassDetails ? 'Saving...' : 'Save changes'}</button>
        </form>
      </ActionModal>

      {/* Archive class confirm */}
      <ConfirmDialog
        isOpen={showArchiveClassConfirm && !isStudent}
        title="Archive class?"
        message="This removes the class from active teacher and student views. You can restore it later from admin tools."
        confirmText={isArchivingClass ? 'Archiving...' : 'Archive class'}
        cancelText="Keep class"
        onCancel={() => setShowArchiveClassConfirm(false)}
        onConfirm={() => {
          if (isArchivingClass) return;
          void (async () => {
            try {
              setIsArchivingClass(true);
              await archiveClass(teacherClass.id);
              setShowArchiveClassConfirm(false);
              addNotification({ type: 'success', title: 'Class archived', message: 'The class has been moved out of active workspace.', duration: 2300 });
              navigate('/classes');
            } catch (error) {
              addNotification({ type: 'error', title: 'Could not archive class', message: error instanceof Error ? error.message : 'Please try again.', duration: 2600 });
            } finally {
              setIsArchivingClass(false);
            }
          })();
        }}
        type="danger"
      />
    </div>
  );
};
