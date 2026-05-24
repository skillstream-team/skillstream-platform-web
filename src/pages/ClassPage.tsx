import React, { useState } from 'react';
import { Archive, CalendarDays, Copy, Link2, MessageSquare, Pencil, PlayCircle, Plus, Sparkles, Users, Video } from 'lucide-react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AiPanel } from '../components/ai/AiPanel';
import { ActionModal } from '../components/common/ActionModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ProgressStrip } from '../components/hub/ProgressStrip';
import { StudentTable } from '../components/hub/StudentTable';
import { useNotifications } from '../components/notifications/NotificationToast';
import { formatHubDateTime, toDateTimeLocalMin } from '../lib/utils';
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
  const teacherClass = useTeacherHubStore((state) => state.classes.find((entry) => entry.id === id));
  const allStudents = useTeacherHubStore((state) => state.students);
  const currentStudent = allStudents.find((entry) => entry.email.toLowerCase() === (user?.email || '').toLowerCase());
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
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showArchiveClassConfirm, setShowArchiveClassConfirm] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showSubmitAssignmentModal, setShowSubmitAssignmentModal] = useState(false);
  const [showReviewSubmissionsModal, setShowReviewSubmissionsModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [recordingPlayingId, setRecordingPlayingId] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [addStudentMode, setAddStudentMode] = useState<'workspace' | 'email'>('workspace');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDate, setLessonDate] = useState('');
  const [lessonRepeatWeekly, setLessonRepeatWeekly] = useState(false);
  const [lessonRepeatCount, setLessonRepeatCount] = useState(1);
  const [lessonError, setLessonError] = useState('');
  const [isSchedulingLesson, setIsSchedulingLesson] = useState(false);
  const [editClassName, setEditClassName] = useState('');
  const [editClassOverview, setEditClassOverview] = useState('');
  const [editClassError, setEditClassError] = useState('');
  const [isSavingClassDetails, setIsSavingClassDetails] = useState(false);
  const [isArchivingClass, setIsArchivingClass] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [assignmentResources, setAssignmentResources] = useState<Array<{ title: string; url: string }>>([]);
  const [assignmentFiles, setAssignmentFiles] = useState<File[]>([]);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [assignmentDate, setAssignmentDate] = useState('');
  const [assignmentScope, setAssignmentScope] = useState<'class' | 'individuals'>('class');
  const [selectedAssignmentStudentIds, setSelectedAssignmentStudentIds] = useState<string[]>([]);
  const [assignmentError, setAssignmentError] = useState('');
  const [activeAssignmentId, setActiveAssignmentId] = useState('');
  const [submissionNote, setSubmissionNote] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionError, setSubmissionError] = useState('');
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [gradingSubmissionId, setGradingSubmissionId] = useState('');
  const [gradeScore, setGradeScore] = useState('80');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [gradingError, setGradingError] = useState('');
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [classResourceTitle, setClassResourceTitle] = useState('');
  const [classResourceDescription, setClassResourceDescription] = useState('');
  const [classResourceKind, setClassResourceKind] = useState<'note' | 'document' | 'pdf' | 'video'>('note');
  const [classResourceNote, setClassResourceNote] = useState('');
  const [classResourceLink, setClassResourceLink] = useState('');
  const [classResourceFile, setClassResourceFile] = useState<File | null>(null);
  const [classResourceError, setClassResourceError] = useState('');
  const [isUploadingResource, setIsUploadingResource] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<{ lessonId: string; current: string } | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [isReschedulingLesson, setIsReschedulingLesson] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [aiOpenLessonId, setAiOpenLessonId] = useState<string | null>(null);
  const [aiTabByLesson, setAiTabByLesson] = useState<Record<string, 'plan' | 'quiz' | 'recap'>>({});
  const [aiAssistQuestion, setAiAssistQuestion] = useState('');
  const [showAiAssist, setShowAiAssist] = useState(false);

  if (!teacherClass) {
    return <Navigate to="/classes" replace />;
  }
  if (isStudent && (!currentStudent || !teacherClass.students.some((entry) => entry.id === currentStudent.id))) {
    return <Navigate to="/classes" replace />;
  }

  const availableStudents = allStudents.filter((student) => !teacherClass.students.some((member) => member.id === student.id));
  const activeAssignment = teacherClass.assignments.find((assignment) => assignment.id === activeAssignmentId) || null;
  const activeSubmission = activeAssignment?.submissions.find((submission) => submission.id === gradingSubmissionId) || null;

  return (
    <div className="space-y-6">
      <section className={`rounded-[32px] border border-[color:var(--hub-border)] bg-gradient-to-br ${teacherClass.accent} p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8`}>
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
                    addNotification({
                      type: 'success',
                      title: 'Invite copied',
                      message: 'The invite link is in your clipboard.',
                      duration: 2200,
                    });
                  }).catch(() => {
                    addNotification({
                      type: 'warning',
                      title: 'Copy failed',
                      message: 'Clipboard access is blocked in this browser tab.',
                      duration: 2600,
                    });
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
                onClick={() => {
                  setEditClassName(teacherClass.name);
                  setEditClassOverview(teacherClass.overview);
                  setEditClassError('');
                  setShowEditClassModal(true);
                }}
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

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setSearchParams({ tab: tab.id });
              setClassTab(id, tab.id);
            }}
            className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'bg-[color:var(--hub-primary)] text-white'
                : 'border border-[color:var(--hub-border)] bg-white text-[color:var(--hub-muted)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'students' ? (
        <div className="space-y-6">
          <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
                <Users className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.18em]">Enrolled students</p>
              </div>
              {!isStudent ? (
                <button type="button" onClick={() => setShowAddStudent(true)} className="rounded-full border border-[color:var(--hub-border)] px-4 py-2 text-sm font-semibold">Manage students</button>
              ) : null}
            </div>
            <div className="mt-5">
              <StudentTable students={teacherClass.students} allowProfileLinks={!isStudent} />
            </div>
            {!isStudent ? (
              <div className="mt-5 grid gap-3">
                {teacherClass.students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between rounded-[22px] bg-[color:var(--hub-soft)] px-4 py-3 text-sm">
                    <span className="font-medium text-[color:var(--hub-text)]">{student.name}</span>
                    <button type="button" onClick={() => setStudentToRemove(student.id)} className="font-semibold text-[color:var(--hub-primary)]">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {activeTab === 'lessons' ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {teacherClass.lessons.map((lesson) => (
            <div key={lesson.id} className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${lesson.status === 'today' ? 'text-[color:var(--hub-accent)]' : 'text-[color:var(--hub-primary)]'}`}>
                {lesson.status === 'cancelled' ? 'Cancelled session' : lesson.status === 'completed' ? 'Past session' : lesson.status === 'today' ? 'Today' : 'Upcoming session'}
              </p>
              <h3 className="mt-3 text-xl font-semibold">{lesson.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--hub-muted)]">{formatHubDateTime(lesson.scheduledAt)}</p>
              <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{lesson.durationMinutes} minutes • {lesson.studentCount} students</p>
              {lesson.syncStatus === 'pending' ? (
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-primary)]">Saving...</p>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setScheduleSelectedClassId(teacherClass.id);
                    if (lesson.status === 'completed' || lesson.status === 'cancelled') {
                      setSearchParams({ tab: 'messages' });
                      setClassTab(id, 'messages');
                      return;
                    }
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
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ${recordingPlayingId === lesson.id ? 'bg-[color:var(--hub-primary)] text-white' : 'border border-[color:var(--hub-border)] text-[color:var(--hub-text)]'}`}
                  >
                    <PlayCircle className="h-4 w-4" />
                    {recordingPlayingId === lesson.id ? 'Close player' : 'Watch recording'}
                  </button>
                ) : null}
                {!isStudent ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRescheduleTarget({ lessonId: lesson.id, current: lesson.scheduledAt });
                        setRescheduleDate(lesson.scheduledAt.slice(0, 16));
                      }}
                      className="rounded-full border border-[color:var(--hub-border)] px-4 py-2.5 text-sm font-semibold"
                    >
                      Reschedule
                    </button>
                    {lesson.status !== 'cancelled' ? (
                      <button
                        type="button"
                        onClick={() => {
                          void (async () => {
                            try {
                              await cancelLesson(teacherClass.id, lesson.id);
                              addNotification({
                                type: 'success',
                                title: 'Lesson cancelled',
                                message: 'Students will see this lesson as cancelled.',
                                duration: 2200,
                              });
                            } catch (error) {
                              addNotification({
                                type: 'error',
                                title: 'Could not cancel lesson',
                                message: error instanceof Error ? error.message : 'Please try again.',
                                duration: 2600,
                              });
                            }
                          })();
                        }}
                        className="rounded-full border border-[rgba(200,95,73,0.36)] px-4 py-2.5 text-sm font-semibold text-[color:var(--edu-danger)]"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </>
                ) : null}
              </div>

              {/* Inline recording player */}
              {lesson.recordingUrl && recordingPlayingId === lesson.id ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-[color:var(--hub-border)] bg-gray-950">
                  <video
                    key={lesson.recordingUrl}
                    src={lesson.recordingUrl}
                    controls
                    autoPlay
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full"
                    style={{ maxHeight: 340, display: 'block' }}
                  />
                  <div className="px-4 py-2.5">
                    <span className="text-xs text-white/40">Recorded lesson · {lesson.title}</span>
                  </div>
                </div>
              ) : null}

              {/* AI Tools section (teacher only) */}
              {!isStudent ? (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setAiOpenLessonId(aiOpenLessonId === lesson.id ? null : lesson.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--hub-border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--hub-muted)]"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    AI tools
                  </button>

                  {aiOpenLessonId === lesson.id ? (
                    <div className="mt-3 rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] p-4">
                      {/* Sub-tab switcher */}
                      <div className="flex gap-2">
                        {(['plan', 'quiz', 'recap'] as const).map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setAiTabByLesson((prev) => ({ ...prev, [lesson.id]: tab }))}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${(aiTabByLesson[lesson.id] || 'plan') === tab ? 'bg-[color:var(--hub-primary)] text-white' : 'border border-[color:var(--hub-border)] text-[color:var(--hub-muted)]'}`}
                          >
                            {tab === 'plan' ? 'Lesson Plan' : tab === 'quiz' ? 'Quiz' : 'Session Recap'}
                          </button>
                        ))}
                      </div>

                      {(aiTabByLesson[lesson.id] || 'plan') === 'plan' ? (
                        <AiPanel
                          feature="ai-lesson-plan"
                          payload={{ topic: lesson.title, durationMinutes: lesson.durationMinutes }}
                          label="Generate lesson plan"
                          outputFormat="text"
                        />
                      ) : (aiTabByLesson[lesson.id] || 'plan') === 'quiz' ? (
                        <AiPanel
                          feature="ai-quiz-gen"
                          payload={{ lessonTitle: lesson.title, questionCount: 5 }}
                          label="Generate quiz"
                          outputFormat="quiz"
                        />
                      ) : (
                        <AiPanel
                          feature="ai-session-recap"
                          payload={{ lessonId: lesson.id }}
                          label="Generate session recap"
                          outputFormat="text"
                          storedResult={lesson.aiRecap}
                          onResult={(r) => setLessonAiRecap(teacherClass.id, lesson.id, r)}
                        />
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
            <button type="button" onClick={() => setShowLessonModal(true)} className="rounded-[28px] border border-dashed border-[color:var(--hub-border)] bg-white p-6 text-left shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-semibold text-[color:var(--hub-text)]">Schedule a new session</p>
              <p className="mt-2 text-sm text-[color:var(--hub-muted)]">Add another lesson to this class in a couple of clicks.</p>
            </button>
          ) : null}
        </section>
      ) : null}

      {activeTab === 'homework' ? (
        <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Assignments</p>
              <p className="mt-2 text-xl font-semibold text-[color:var(--hub-text)]">Create, assign, and review classwork fast</p>
            </div>
            {!isStudent ? (
              <button type="button" onClick={() => setShowAssignmentModal(true)} className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white">
                <Plus className="h-4 w-4" />
                Assign homework
              </button>
            ) : null}
          </div>
          <div className="mt-5 grid gap-4">
            {teacherClass.assignments.map((assignment) => (
              <div key={assignment.id} className="flex flex-col gap-4 rounded-[24px] border border-[color:var(--hub-border)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--hub-text)]">{assignment.title}</p>
                  {assignment.description ? (
                    <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{assignment.description}</p>
                  ) : null}
                  <p className="mt-1 text-sm text-[color:var(--hub-muted)]">Due {formatHubDateTime(assignment.dueAt)}</p>
                  {new Date(assignment.dueAt).getTime() < Date.now() ? (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--edu-danger)]">Overdue</p>
                  ) : new Date(assignment.dueAt).getTime() < Date.now() + 48 * 60 * 60 * 1000 ? (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-primary)]">Due soon</p>
                  ) : null}
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--hub-muted)]">
                    {assignment.assignedTo === 'class' ? 'Assigned to full class' : 'Assigned to individuals'}
                  </p>
                  {assignment.assignedTo === 'individuals' ? (
                    <p className="mt-1 text-xs text-[color:var(--hub-muted)]">
                      {assignment.assignedStudentIds?.length || 0} learner{(assignment.assignedStudentIds?.length || 0) === 1 ? '' : 's'} targeted
                    </p>
                  ) : null}
                  {assignment.resources.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {assignment.resources.map((resource) => (
                        <a
                          key={`${assignment.id}-${resource.url}`}
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-full border border-[color:var(--hub-border)] px-3 py-1 text-xs font-semibold text-[color:var(--hub-primary)]"
                        >
                          {resource.title}
                        </a>
                      ))}
                    </div>
                  ) : null}
                  {!isStudent ? (
                    <p className="mt-2 text-xs text-[color:var(--hub-muted)]">{assignment.submissions.length} submission{assignment.submissions.length === 1 ? '' : 's'} received</p>
                  ) : null}
                  {isStudent ? (
                    <div className="mt-2 grid gap-1 text-sm">
                      {assignment.mySubmission ? (
                        <>
                          <p className="text-[color:var(--hub-text)]">
                            Submitted {formatHubDateTime(assignment.mySubmission.submittedAt)}
                          </p>
                          <p className="text-[color:var(--hub-muted)]">
                            Status: {assignment.mySubmission.status === 'graded' ? 'Graded' : 'Pending review'}
                          </p>
                          {assignment.mySubmission.gradeScore !== null ? (
                            <p className="font-semibold text-[color:var(--hub-text)]">Score: {assignment.mySubmission.gradeScore}%</p>
                          ) : null}
                          {assignment.mySubmission.feedback ? (
                            <p className="text-[color:var(--hub-muted)]">Feedback: {assignment.mySubmission.feedback}</p>
                          ) : null}
                        </>
                      ) : (
                        <p className="text-[color:var(--edu-danger)]">
                          {new Date(assignment.dueAt).getTime() < Date.now() ? 'Overdue - not submitted' : 'Not submitted yet'}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[color:var(--hub-text)]">{assignment.completionRate}% complete</p>
                  <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{assignment.submissionsPendingReview} pending review</p>
                  <div className="mt-3 flex justify-end gap-2">
                    {!isStudent ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAssignmentId(assignment.id);
                          setGradingSubmissionId(assignment.submissions[0]?.id || '');
                          setGradeScore(String(assignment.submissions[0]?.gradeScore ?? 80));
                          setGradeFeedback(assignment.submissions[0]?.feedback || '');
                          setShowReviewSubmissionsModal(true);
                          setGradingError('');
                        }}
                        className="rounded-full border border-[color:var(--hub-border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--hub-text)]"
                      >
                        Review submissions
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAssignmentId(assignment.id);
                          setSubmissionNote(assignment.mySubmission?.submissionNote || '');
                          setSubmissionFile(null);
                          setSubmissionError('');
                          setShowSubmitAssignmentModal(true);
                        }}
                        className="rounded-full border border-[color:var(--hub-border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--hub-text)]"
                      >
                        {assignment.mySubmission ? 'Resubmit' : 'Submit'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {teacherClass.assignments.length === 0 ? (
              <div className="rounded-[24px] bg-[color:var(--hub-soft)] p-4 text-sm text-[color:var(--hub-muted)]">
                {isStudent ? 'No assignments yet.' : 'No assignments yet. Create the first homework task.'}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {activeTab === 'resources' ? (
        <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Class resources</p>
              <p className="mt-2 text-xl font-semibold text-[color:var(--hub-text)]">Notes, files, and lesson media</p>
            </div>
            {!isStudent ? (
              <button type="button" onClick={() => setShowResourceModal(true)} className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white">
                <Plus className="h-4 w-4" />
                Add resource
              </button>
            ) : null}
          </div>
          <div className="mt-5 grid gap-4">
            {teacherClass.resources.length > 0 ? teacherClass.resources.map((resource) => (
              <div key={resource.id} className="rounded-[24px] border border-[color:var(--hub-border)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--hub-text)]">{resource.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">
                      {resource.kind} • {resource.createdByName} • {formatHubDateTime(resource.createdAt)}
                    </p>
                  </div>
                  {resource.fileUrl || resource.externalUrl ? (
                    <a
                      href={resource.fileUrl || resource.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--hub-primary)]"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Open
                    </a>
                  ) : null}
                </div>
                {resource.description ? (
                  <p className="mt-2 text-sm text-[color:var(--hub-muted)]">{resource.description}</p>
                ) : null}
                {resource.noteBody ? (
                  <div className="mt-3 rounded-2xl bg-[color:var(--hub-soft)] px-3 py-2 text-sm text-[color:var(--hub-muted)]">
                    {resource.noteBody}
                  </div>
                ) : null}
              </div>
            )) : (
              <div className="rounded-[24px] bg-[color:var(--hub-soft)] p-4 text-sm text-[color:var(--hub-muted)]">
                No class resources yet.
              </div>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === 'progress' ? (
        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Class performance</p>
            <div className="mt-5">
              <ProgressStrip items={teacherClass.topics} />
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Students needing attention</p>
              <div className="mt-4 grid gap-3">
                {teacherClass.students.filter((student) => student.needsAttention).length > 0 ? (
                  teacherClass.students
                    .filter((student) => student.needsAttention)
                    .map((student) => (
                      <div key={student.id} className="rounded-[22px] bg-[color:var(--hub-soft)] p-4">
                        <p className="text-sm font-semibold text-[color:var(--hub-text)]">{student.name}</p>
                        <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{student.note}</p>
                      </div>
                    ))
                ) : (
                  <div className="rounded-[22px] bg-[color:var(--hub-soft)] p-4 text-sm text-[color:var(--hub-muted)]">
                    No learners currently need attention.
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Quick intervention idea</p>
              <div className="mt-4 rounded-[24px] bg-[color:var(--hub-soft)] p-4 text-sm text-[color:var(--hub-muted)]">
                Run a 10-minute diagnostic at the start of the next lesson, then split follow-up questions by weak topic.
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'messages' ? (
        <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
              <MessageSquare className="h-5 w-5" />
              <p className="text-sm font-semibold uppercase tracking-[0.18em]">Class communication</p>
            </div>
            {!isStudent ? (
              <button type="button" onClick={() => setShowMessageModal(true)} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white">Send announcement</button>
            ) : null}
          </div>
          <div className="mt-5 grid gap-4">
            {teacherClass.messages.length > 0 ? (
              teacherClass.messages.map((message) => (
                <div key={message.id} className="rounded-[24px] border border-[color:var(--hub-border)] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-[color:var(--hub-text)]">{message.sender}</p>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--hub-muted)]">{formatHubDateTime(message.sentAt)}</p>
                  </div>
                  <p className="mt-3 text-sm text-[color:var(--hub-muted)]">{message.body}</p>
                  {message.syncStatus === 'pending' ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-primary)]">Sending...</p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-[24px] bg-[color:var(--hub-soft)] p-4 text-sm text-[color:var(--hub-muted)]">
                No class messages yet.
              </div>
            )}
        </div>
        </section>
      ) : null}

      <ActionModal isOpen={showAddStudent && !isStudent} title="Add student to class" description="Add existing students or invite by email." onClose={() => setShowAddStudent(false)}>
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (addStudentMode === 'workspace') {
              if (!selectedStudentId) {
                setInviteError('Select a student from your workspace.');
                return;
              }
              try {
                setIsAddingStudent(true);
                await addStudentToClass(teacherClass.id, selectedStudentId);
                setSelectedStudentId('');
                setInviteError('');
                setShowAddStudent(false);
                addNotification({
                  type: 'success',
                  title: 'Student added',
                  message: 'The student has been added to this class.',
                  duration: 2200,
                });
              } catch (error) {
                setInviteError(error instanceof Error ? error.message : 'Could not add student.');
              } finally {
                setIsAddingStudent(false);
              }
              return;
            }

            const normalizedEmail = inviteEmail.trim().toLowerCase();
            if (!normalizedEmail) {
              setInviteError('Student email is required.');
              return;
            }

            try {
              setIsAddingStudent(true);
              const result = await inviteStudentByEmail(teacherClass.id, normalizedEmail);
              addNotification({
                type: 'success',
                title: result.status === 'added_existing' ? 'Student added' : 'Invite created',
                message: result.message,
                duration: 2400,
              });
              setInviteEmail('');
              setInviteError('');
              setShowAddStudent(false);
            } catch (error) {
              setInviteError(error instanceof Error ? error.message : 'Could not invite student.');
            } finally {
              setIsAddingStudent(false);
            }
          }}
        >
          <div className="inline-flex rounded-full border border-[color:var(--hub-border)] p-1">
            <button
              type="button"
              onClick={() => {
                setAddStudentMode('workspace');
                setInviteError('');
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${addStudentMode === 'workspace' ? 'bg-[color:var(--hub-primary)] text-white' : 'text-[color:var(--hub-muted)]'}`}
            >
              Existing student
            </button>
            <button
              type="button"
              onClick={() => {
                setAddStudentMode('email');
                setInviteError('');
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${addStudentMode === 'email' ? 'bg-[color:var(--hub-primary)] text-white' : 'text-[color:var(--hub-muted)]'}`}
            >
              Invite by email
            </button>
          </div>

          {addStudentMode === 'workspace' ? (
            <>
              <select value={selectedStudentId} onChange={(event) => {
                setSelectedStudentId(event.target.value);
                if (inviteError) setInviteError('');
              }} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none">
                <option value="">Select a student</option>
                {availableStudents.map((student) => (
                  <option key={student.id} value={student.id}>{student.name}</option>
                ))}
              </select>
              {availableStudents.length === 0 ? (
                <p className="text-xs text-[color:var(--hub-muted)]">
                  No available workspace students. Use "Invite by email" to add new learners.
                </p>
              ) : null}
              {inviteError ? (
                <p className="text-xs text-[color:var(--edu-danger)]">{inviteError}</p>
              ) : null}
            </>
          ) : (
            <>
              <input
                type="email"
                value={inviteEmail}
                onChange={(event) => {
                  setInviteEmail(event.target.value);
                  if (inviteError) setInviteError('');
                }}
                placeholder="student@example.com"
                className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none"
              />
              {inviteError ? (
                <p className="text-xs text-[color:var(--edu-danger)]">{inviteError}</p>
              ) : null}
            </>
          )}

          <button type="submit" disabled={isAddingStudent} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {isAddingStudent ? 'Working...' : addStudentMode === 'workspace' ? 'Add to class' : 'Create invite'}
          </button>
        </form>
      </ActionModal>

      <ActionModal isOpen={showLessonModal && !isStudent} title="Schedule lesson" description="Add a new class session." onClose={() => setShowLessonModal(false)}>
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!lessonTitle.trim() || !lessonDate) {
              setLessonError('Lesson title and date/time are required.');
              return;
            }
            const lessonTime = new Date(lessonDate).getTime();
            if (!Number.isFinite(lessonTime) || lessonTime <= Date.now()) {
              setLessonError('Lesson date/time must be in the future.');
              return;
            }
            try {
              setIsSchedulingLesson(true);
              setLessonError('');
              if (lessonRepeatWeekly && lessonRepeatCount > 1) {
                await scheduleLessonSeries({
                  classId: teacherClass.id,
                  title: lessonTitle.trim(),
                  firstScheduledAt: new Date(lessonDate).toISOString(),
                  durationMinutes: 60,
                  occurrences: lessonRepeatCount,
                });
              } else {
                await scheduleLesson({ classId: teacherClass.id, title: lessonTitle.trim(), scheduledAt: new Date(lessonDate).toISOString(), durationMinutes: 60 });
              }
              setLessonTitle('');
              setLessonDate('');
              setLessonRepeatWeekly(false);
              setLessonRepeatCount(1);
              setShowLessonModal(false);
              addNotification({
                type: 'success',
                title: 'Lesson scheduled',
                message: lessonRepeatWeekly && lessonRepeatCount > 1 ? 'Weekly lesson series added to this class.' : 'New session added to this class.',
                duration: 2200,
              });
            } catch (error) {
              setLessonError(error instanceof Error ? error.message : 'Could not schedule lesson.');
            } finally {
              setIsSchedulingLesson(false);
            }
          }}
        >
          {lessonError ? <p className="text-xs text-[color:var(--edu-danger)]">{lessonError}</p> : null}
          <input value={lessonTitle} onChange={(event) => {
            setLessonTitle(event.target.value);
            if (lessonError) setLessonError('');
          }} placeholder="Lesson title" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <input type="datetime-local" value={lessonDate} onChange={(event) => {
            setLessonDate(event.target.value);
            if (lessonError) setLessonError('');
          }} min={toDateTimeLocalMin()} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
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
          <button type="submit" disabled={isSchedulingLesson} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isSchedulingLesson ? 'Scheduling...' : 'Schedule lesson'}</button>
        </form>
      </ActionModal>

      <ActionModal
        isOpen={showEditClassModal && !isStudent}
        title="Edit class details"
        description="Update your class name and description."
        onClose={() => setShowEditClassModal(false)}
      >
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!editClassName.trim() || !editClassOverview.trim()) {
              setEditClassError('Class name and description are required.');
              return;
            }
            try {
              setIsSavingClassDetails(true);
              setEditClassError('');
              await updateClassDetails(teacherClass.id, {
                name: editClassName.trim(),
                overview: editClassOverview.trim(),
              });
              setShowEditClassModal(false);
              addNotification({
                type: 'success',
                title: 'Class updated',
                message: 'Class details have been saved.',
                duration: 2200,
              });
            } catch (error) {
              setEditClassError(error instanceof Error ? error.message : 'Could not update class.');
            } finally {
              setIsSavingClassDetails(false);
            }
          }}
        >
          <input
            value={editClassName}
            onChange={(event) => {
              setEditClassName(event.target.value);
              if (editClassError) setEditClassError('');
            }}
            placeholder="Class name"
            className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none"
          />
          <textarea
            value={editClassOverview}
            onChange={(event) => {
              setEditClassOverview(event.target.value);
              if (editClassError) setEditClassError('');
            }}
            rows={4}
            placeholder="Class description"
            className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none"
          />
          {editClassError ? <p className="text-xs text-[color:var(--edu-danger)]">{editClassError}</p> : null}
          <button type="submit" disabled={isSavingClassDetails} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {isSavingClassDetails ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </ActionModal>

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
              addNotification({
                type: 'success',
                title: 'Class archived',
                message: 'The class has been moved out of active workspace.',
                duration: 2300,
              });
              navigate('/classes');
            } catch (error) {
              addNotification({
                type: 'error',
                title: 'Could not archive class',
                message: error instanceof Error ? error.message : 'Please try again.',
                duration: 2600,
              });
            } finally {
              setIsArchivingClass(false);
            }
          })();
        }}
        type="danger"
      />

      <ActionModal isOpen={showAssignmentModal && !isStudent} title="Assign homework" description="Create a new assignment for this class." onClose={() => setShowAssignmentModal(false)}>
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!assignmentTitle.trim() || !assignmentDescription.trim() || !assignmentDate) {
              setAssignmentError('Title, description, and due date are required.');
              return;
            }
            const dueTime = new Date(assignmentDate).getTime();
            if (!Number.isFinite(dueTime) || dueTime <= Date.now()) {
              setAssignmentError('Due date must be in the future.');
              return;
            }
            if (assignmentScope === 'individuals' && selectedAssignmentStudentIds.length === 0) {
              setAssignmentError('Select at least one student for individual assignment.');
              return;
            }
            try {
              await createAssignment({
                classId: teacherClass.id,
                title: assignmentTitle.trim(),
                description: assignmentDescription.trim(),
                resources: assignmentResources,
                files: assignmentFiles,
                dueAt: new Date(assignmentDate).toISOString(),
                assignedTo: assignmentScope,
                assignedStudentIds: assignmentScope === 'individuals' ? selectedAssignmentStudentIds : [],
              });
              setAssignmentTitle('');
              setAssignmentDescription('');
              setAssignmentResources([]);
              setAssignmentFiles([]);
              setResourceTitle('');
              setResourceUrl('');
              setAssignmentDate('');
              setAssignmentScope('class');
              setSelectedAssignmentStudentIds([]);
              setAssignmentError('');
              setShowAssignmentModal(false);
              addNotification({
                type: 'success',
                title: 'Assignment created',
                message: 'Homework is now visible to learners.',
                duration: 2200,
              });
            } catch (error) {
              setAssignmentError(error instanceof Error ? error.message : 'Could not create assignment.');
            }
          }}
        >
          <input value={assignmentTitle} onChange={(event) => {
            setAssignmentTitle(event.target.value);
            if (assignmentError) setAssignmentError('');
          }} placeholder="Assignment title *" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <textarea
            value={assignmentDescription}
            onChange={(event) => {
              setAssignmentDescription(event.target.value);
              if (assignmentError) setAssignmentError('');
            }}
            rows={4}
            placeholder="What learners need to do, success criteria, and submission details. *"
            className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none"
          />
          <div className="grid gap-2 rounded-2xl border border-[color:var(--hub-border)] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">Resources</p>
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <input
                value={resourceTitle}
                onChange={(event) => setResourceTitle(event.target.value)}
                placeholder="Document title"
                className="rounded-xl border border-[color:var(--hub-border)] px-3 py-2 outline-none"
              />
              <input
                value={resourceUrl}
                onChange={(event) => setResourceUrl(event.target.value)}
                placeholder="https://..."
                className="rounded-xl border border-[color:var(--hub-border)] px-3 py-2 outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!resourceUrl.trim()) {
                    setAssignmentError('Resource URL is required to add a resource.');
                    return;
                  }
                  setAssignmentResources((current) => [
                    ...current,
                    {
                      title: resourceTitle.trim() || 'Resource',
                      url: resourceUrl.trim(),
                    },
                  ]);
                  setResourceTitle('');
                  setResourceUrl('');
                }}
                className="rounded-xl border border-[color:var(--hub-border)] px-3 py-2 text-sm font-semibold text-[color:var(--hub-text)]"
              >
                Add
              </button>
            </div>
            {assignmentResources.length > 0 ? (
              <div className="grid gap-1">
                {assignmentResources.map((resource, index) => (
                  <div key={`${resource.url}-${index}`} className="flex items-center justify-between rounded-xl bg-[color:var(--hub-soft)] px-3 py-2 text-sm">
                    <span className="truncate text-[color:var(--hub-text)]">{resource.title}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAssignmentResources((current) => current.filter((_, currentIndex) => currentIndex !== index));
                      }}
                      className="text-xs font-semibold text-[color:var(--hub-primary)]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="grid gap-2 rounded-2xl border border-[color:var(--hub-border)] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">Upload documents</p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
              onChange={(event) => {
                const files = event.target.files ? Array.from(event.target.files) : [];
                setAssignmentFiles(files);
                if (assignmentError) setAssignmentError('');
              }}
              className="rounded-xl border border-[color:var(--hub-border)] px-3 py-2 text-sm outline-none file:mr-3 file:rounded-full file:border file:border-[color:var(--hub-border)] file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold"
            />
            {assignmentFiles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {assignmentFiles.map((file) => (
                  <span key={`${file.name}-${file.size}`} className="inline-flex rounded-full bg-[color:var(--hub-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--hub-text)]">
                    {file.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <input type="datetime-local" value={assignmentDate} onChange={(event) => {
            setAssignmentDate(event.target.value);
            if (assignmentError) setAssignmentError('');
          }} min={toDateTimeLocalMin()} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <select
            value={assignmentScope}
            onChange={(event) => {
              const nextScope = event.target.value as 'class' | 'individuals';
              setAssignmentScope(nextScope);
              if (nextScope === 'class') {
                setSelectedAssignmentStudentIds([]);
              }
            }}
            className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none"
          >
            <option value="class">Assign to full class</option>
            <option value="individuals">Assign to individuals</option>
          </select>
          {assignmentScope === 'individuals' ? (
            <div className="grid gap-2 rounded-2xl border border-[color:var(--hub-border)] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">Select learners</p>
              <div className="grid gap-2">
                {teacherClass.students.map((student) => {
                  const selected = selectedAssignmentStudentIds.includes(student.id);
                  return (
                    <label key={student.id} className="flex items-center justify-between rounded-xl bg-[color:var(--hub-soft)] px-3 py-2 text-sm">
                      <span className="text-[color:var(--hub-text)]">{student.name}</span>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) => {
                          setSelectedAssignmentStudentIds((current) => (
                            event.target.checked
                              ? [...current, student.id]
                              : current.filter((entry) => entry !== student.id)
                          ));
                          if (assignmentError) setAssignmentError('');
                        }}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}
          {assignmentError ? (
            <p className="text-xs text-[color:var(--edu-danger)]">{assignmentError}</p>
          ) : null}
          <button type="submit" className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white">Create assignment</button>
        </form>
      </ActionModal>

      <ActionModal
        isOpen={showSubmitAssignmentModal && isStudent}
        title="Submit homework"
        description={activeAssignment ? `Submit work for ${activeAssignment.title}.` : 'Submit your assignment file.'}
        onClose={() => setShowSubmitAssignmentModal(false)}
      >
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!activeAssignment) {
              setSubmissionError('Select an assignment first.');
              return;
            }
            if (!submissionFile) {
              setSubmissionError('Attach your homework file.');
              return;
            }
            try {
              setIsSubmittingAssignment(true);
              setSubmissionError('');
              await submitAssignment({
                classId: teacherClass.id,
                assignmentId: activeAssignment.id,
                submissionNote,
                file: submissionFile,
              });
              setShowSubmitAssignmentModal(false);
              setSubmissionFile(null);
              setSubmissionNote('');
              addNotification({
                type: 'success',
                title: 'Homework submitted',
                message: 'Your teacher can now review it.',
                duration: 2200,
              });
            } catch (error) {
              setSubmissionError(error instanceof Error ? error.message : 'Could not submit homework.');
            } finally {
              setIsSubmittingAssignment(false);
            }
          }}
        >
          <textarea
            value={submissionNote}
            onChange={(event) => {
              setSubmissionNote(event.target.value);
              if (submissionError) setSubmissionError('');
            }}
            rows={4}
            placeholder="Optional note to your teacher"
            className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none"
          />
          <input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
            onChange={(event) => {
              setSubmissionFile(event.target.files?.[0] || null);
              if (submissionError) setSubmissionError('');
            }}
            className="rounded-xl border border-[color:var(--hub-border)] px-3 py-2 text-sm outline-none file:mr-3 file:rounded-full file:border file:border-[color:var(--hub-border)] file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold"
          />
          {submissionFile ? (
            <p className="text-xs text-[color:var(--hub-muted)]">Selected: {submissionFile.name}</p>
          ) : null}
          {submissionError ? <p className="text-xs text-[color:var(--edu-danger)]">{submissionError}</p> : null}

          {/* AI writing assist for students */}
          {activeAssignment ? (
            <div className="rounded-2xl border border-[color:var(--hub-border)] p-4">
              <button
                type="button"
                onClick={() => setShowAiAssist((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--hub-primary)]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Get writing help
              </button>
              {showAiAssist ? (
                <AiPanel
                  feature="ai-assignment-assist"
                  payload={{
                    assignmentTitle: activeAssignment.title,
                    assignmentDescription: activeAssignment.description,
                  }}
                  promptInput={{
                    label: 'What are you stuck on?',
                    placeholder: 'e.g. I don\'t understand what the question is asking...',
                    value: aiAssistQuestion,
                    onChange: setAiAssistQuestion,
                  }}
                  label="Get guidance"
                  outputFormat="text"
                />
              ) : null}
            </div>
          ) : null}

          <button type="submit" disabled={isSubmittingAssignment} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {isSubmittingAssignment ? 'Submitting...' : 'Submit homework'}
          </button>
        </form>
      </ActionModal>

      <ActionModal
        isOpen={showReviewSubmissionsModal && !isStudent}
        title="Review submissions"
        description={activeAssignment ? `${activeAssignment.title} submissions` : 'Review learner work'}
        onClose={() => setShowReviewSubmissionsModal(false)}
      >
        {activeAssignment ? (
          <div className="grid gap-4">
            {activeAssignment.submissions.length > 0 ? (
              <select
                value={gradingSubmissionId}
                onChange={(event) => {
                  const submissionId = event.target.value;
                  setGradingSubmissionId(submissionId);
                  const selected = activeAssignment.submissions.find((submission) => submission.id === submissionId);
                  setGradeScore(String(selected?.gradeScore ?? 80));
                  setGradeFeedback(selected?.feedback || '');
                  setGradingError('');
                }}
                className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none"
              >
                {activeAssignment.submissions.map((submission) => (
                  <option key={submission.id} value={submission.id}>
                    {submission.studentName} • {formatHubDateTime(submission.submittedAt)} • {submission.status}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-2xl bg-[color:var(--hub-soft)] p-4 text-sm text-[color:var(--hub-muted)]">
                No submissions yet.
              </div>
            )}

            {activeSubmission ? (
              <>
                <div className="rounded-2xl border border-[color:var(--hub-border)] p-3 text-sm">
                  <p className="font-semibold text-[color:var(--hub-text)]">{activeSubmission.studentName}</p>
                  <p className="mt-1 text-[color:var(--hub-muted)]">Submitted {formatHubDateTime(activeSubmission.submittedAt)}</p>
                  {activeSubmission.submissionNote ? (
                    <p className="mt-2 text-[color:var(--hub-muted)]">{activeSubmission.submissionNote}</p>
                  ) : null}
                  {activeSubmission.fileUrl ? (
                    <a href={activeSubmission.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex rounded-full border border-[color:var(--hub-border)] px-3 py-1 text-xs font-semibold text-[color:var(--hub-primary)]">
                      Open file
                    </a>
                  ) : null}
                </div>

                {activeAssignment ? (
                  <AiPanel
                    feature="ai-assignment-feedback"
                    payload={{
                      assignmentTitle: activeAssignment.title,
                      assignmentDescription: activeAssignment.description,
                      submissionNote: activeSubmission.submissionNote || '',
                      fileUrl: activeSubmission.fileUrl || '',
                    }}
                    label="AI feedback assist"
                    outputFormat="text"
                  />
                ) : null}

                <form
                  className="grid gap-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!activeAssignment || !activeSubmission) return;
                    const score = Number(gradeScore);
                    if (!Number.isFinite(score) || score < 0 || score > 100) {
                      setGradingError('Grade must be between 0 and 100.');
                      return;
                    }
                    try {
                      setIsSavingGrade(true);
                      setGradingError('');
                      await gradeAssignmentSubmission({
                        classId: teacherClass.id,
                        assignmentId: activeAssignment.id,
                        submissionId: activeSubmission.id,
                        gradeScore: score,
                        feedback: gradeFeedback,
                      });
                      addNotification({
                        type: 'success',
                        title: 'Grade saved',
                        message: 'Feedback is now visible to the student.',
                        duration: 2200,
                      });
                    } catch (error) {
                      setGradingError(error instanceof Error ? error.message : 'Could not save grade.');
                    } finally {
                      setIsSavingGrade(false);
                    }
                  }}
                >
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={gradeScore}
                    onChange={(event) => {
                      setGradeScore(event.target.value);
                      if (gradingError) setGradingError('');
                    }}
                    placeholder="Grade score (0-100)"
                    className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none"
                  />
                  <textarea
                    value={gradeFeedback}
                    onChange={(event) => {
                      setGradeFeedback(event.target.value);
                      if (gradingError) setGradingError('');
                    }}
                    rows={4}
                    placeholder="Feedback for the student"
                    className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none"
                  />
                  {gradingError ? <p className="text-xs text-[color:var(--edu-danger)]">{gradingError}</p> : null}
                  <button type="submit" disabled={isSavingGrade} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    {isSavingGrade ? 'Saving...' : 'Save grade and feedback'}
                  </button>
                </form>
              </>
            ) : null}
          </div>
        ) : null}
      </ActionModal>

      <ActionModal isOpen={showResourceModal && !isStudent} title="Add class resource" description="Upload notes, documents, PDFs, or recorded videos." onClose={() => setShowResourceModal(false)}>
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!classResourceTitle.trim()) {
              setClassResourceError('Resource title is required.');
              return;
            }
            if (classResourceKind === 'note' && !classResourceNote.trim()) {
              setClassResourceError('Add your note content.');
              return;
            }
            if (classResourceKind !== 'note' && !classResourceFile && !classResourceLink.trim()) {
              setClassResourceError('Upload a file or provide a link.');
              return;
            }
            try {
              setIsUploadingResource(true);
              setClassResourceError('');
              await uploadClassResource({
                classId: teacherClass.id,
                title: classResourceTitle.trim(),
                description: classResourceDescription.trim(),
                kind: classResourceKind,
                noteBody: classResourceKind === 'note' ? classResourceNote : '',
                externalUrl: classResourceKind !== 'note' ? classResourceLink.trim() : '',
                file: classResourceKind !== 'note' ? classResourceFile : null,
              });
              setClassResourceTitle('');
              setClassResourceDescription('');
              setClassResourceKind('note');
              setClassResourceNote('');
              setClassResourceLink('');
              setClassResourceFile(null);
              setShowResourceModal(false);
              addNotification({
                type: 'success',
                title: 'Resource added',
                message: 'Students can now access this material.',
                duration: 2200,
              });
            } catch (error) {
              setClassResourceError(error instanceof Error ? error.message : 'Could not upload resource.');
            } finally {
              setIsUploadingResource(false);
            }
          }}
        >
          <input
            value={classResourceTitle}
            onChange={(event) => {
              setClassResourceTitle(event.target.value);
              if (classResourceError) setClassResourceError('');
            }}
            placeholder="Resource title *"
            className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none"
          />
          <input
            value={classResourceDescription}
            onChange={(event) => setClassResourceDescription(event.target.value)}
            placeholder="Short description (optional)"
            className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none"
          />
          <select
            value={classResourceKind}
            onChange={(event) => {
              const nextKind = event.target.value as 'note' | 'document' | 'pdf' | 'video';
              setClassResourceKind(nextKind);
              if (nextKind === 'note') {
                setClassResourceFile(null);
                setClassResourceLink('');
              }
            }}
            className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none"
          >
            <option value="note">Note</option>
            <option value="document">Document</option>
            <option value="pdf">PDF</option>
            <option value="video">Video</option>
          </select>

          {classResourceKind === 'note' ? (
            <textarea
              value={classResourceNote}
              onChange={(event) => {
                setClassResourceNote(event.target.value);
                if (classResourceError) setClassResourceError('');
              }}
              rows={6}
              placeholder="Write your notes *"
              className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none"
            />
          ) : (
            <div className="grid gap-3">
              <input
                value={classResourceLink}
                onChange={(event) => {
                  setClassResourceLink(event.target.value);
                  if (classResourceError) setClassResourceError('');
                }}
                placeholder="Optional external link"
                className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none"
              />
              <div className="grid gap-2 rounded-2xl border border-[color:var(--hub-border)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">Upload file</p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xlsx,.xls,.csv,.png,.jpg,.jpeg,video/mp4,video/webm,video/quicktime,.mov,.m4v"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] || null;
                    setClassResourceFile(nextFile);
                    if (classResourceError) setClassResourceError('');
                  }}
                  className="rounded-xl border border-[color:var(--hub-border)] px-3 py-2 text-sm outline-none file:mr-3 file:rounded-full file:border file:border-[color:var(--hub-border)] file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold"
                />
                {classResourceFile ? (
                  <span className="inline-flex w-fit rounded-full bg-[color:var(--hub-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--hub-text)]">
                    {classResourceFile.name}
                  </span>
                ) : null}
              </div>
            </div>
          )}

          {classResourceError ? <p className="text-xs text-[color:var(--edu-danger)]">{classResourceError}</p> : null}
          <button type="submit" disabled={isUploadingResource} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {isUploadingResource ? 'Uploading...' : 'Add resource'}
          </button>
        </form>
      </ActionModal>

      <ActionModal isOpen={showMessageModal && !isStudent} title="Send announcement" description="Post an update to everyone in this class." onClose={() => setShowMessageModal(false)}>
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!classDraft.trim()) {
              setMessageError('Message body is required.');
              return;
            }
            try {
              setIsSendingMessage(true);
              setMessageError('');
              await sendClassMessage(teacherClass.id, classDraft.trim());
              setDraft(id, '');
              setShowMessageModal(false);
              addNotification({
                type: 'success',
                title: 'Announcement sent',
                message: 'Your class has been notified.',
                duration: 2200,
              });
            } catch (error) {
              setMessageError(error instanceof Error ? error.message : 'Could not send message.');
            } finally {
              setIsSendingMessage(false);
            }
          }}
        >
          <textarea
            value={classDraft}
            onChange={(event) => {
              setDraft(id, event.target.value);
              if (messageError) setMessageError('');
            }}
            rows={5}
            placeholder="Write your announcement"
            className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none"
          />
          {messageError ? <p className="text-xs text-[color:var(--edu-danger)]">{messageError}</p> : null}
          <button type="submit" disabled={isSendingMessage} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isSendingMessage ? 'Sending...' : 'Send message'}</button>
        </form>
      </ActionModal>

      <ActionModal isOpen={!!rescheduleTarget && !isStudent} title="Reschedule lesson" description="Move this session to a new date and time." onClose={() => setRescheduleTarget(null)}>
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!rescheduleTarget || !rescheduleDate) {
              setRescheduleError('Select a valid date/time.');
              return;
            }
            const nextTime = new Date(rescheduleDate).getTime();
            if (!Number.isFinite(nextTime) || nextTime <= Date.now()) {
              setRescheduleError('Rescheduled time must be in the future.');
              return;
            }
            try {
              setIsReschedulingLesson(true);
              setRescheduleError('');
              await rescheduleLesson(teacherClass.id, rescheduleTarget.lessonId, new Date(rescheduleDate).toISOString());
              setRescheduleTarget(null);
              setRescheduleDate('');
              addNotification({
                type: 'success',
                title: 'Session rescheduled',
                message: 'The class lesson time was updated.',
                duration: 2200,
              });
            } catch (error) {
              setRescheduleError(error instanceof Error ? error.message : 'Could not reschedule lesson.');
            } finally {
              setIsReschedulingLesson(false);
            }
          }}
        >
          {rescheduleError ? <p className="text-xs text-[color:var(--edu-danger)]">{rescheduleError}</p> : null}
          <input type="datetime-local" value={rescheduleDate} min={toDateTimeLocalMin()} onChange={(event) => {
            setRescheduleDate(event.target.value);
            if (rescheduleError) setRescheduleError('');
          }} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <button type="submit" disabled={isReschedulingLesson} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isReschedulingLesson ? 'Saving...' : 'Save new time'}</button>
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
                addNotification({
                  type: 'success',
                  title: 'Student removed',
                  message: 'The student was removed from this class.',
                  duration: 2200,
                });
              } catch (error) {
                addNotification({
                  type: 'error',
                  title: 'Could not remove student',
                  message: error instanceof Error ? error.message : 'Please try again.',
                  duration: 2800,
                });
              }
            }
            setStudentToRemove(null);
          })();
        }}
      />
    </div>
  );
};
