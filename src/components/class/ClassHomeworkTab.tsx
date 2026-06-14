import React, { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { AiPanel } from '../ai/AiPanel';
import { ActionModal } from '../common/ActionModal';
import { useNotifications } from '../notifications/NotificationToast';
import { formatHubDateTime, toDateTimeLocalMin } from '../../lib/utils';
import { AssignmentSummary, TeacherClass } from '../../data/teacherHub';

interface Props {
  teacherClass: TeacherClass;
  isStudent: boolean;
  createAssignment: (args: {
    classId: string;
    title: string;
    description: string;
    resources: Array<{ title: string; url: string }>;
    files: File[];
    dueAt: string;
    assignedTo: 'class' | 'individuals';
    assignedStudentIds: string[];
  }) => Promise<void>;
  submitAssignment: (args: { classId: string; assignmentId: string; submissionNote: string; file: File }) => Promise<void>;
  gradeAssignmentSubmission: (args: { classId: string; assignmentId: string; submissionId: string; gradeScore: number; feedback: string }) => Promise<void>;
  showAssignmentModal: boolean;
  onCloseAssignmentModal: () => void;
}

export const ClassHomeworkTab: React.FC<Props> = ({
  teacherClass,
  isStudent,
  createAssignment,
  submitAssignment,
  gradeAssignmentSubmission,
  showAssignmentModal,
  onCloseAssignmentModal,
}) => {
  const { addNotification } = useNotifications();
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
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submissionNote, setSubmissionNote] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionError, setSubmissionError] = useState('');
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [gradingSubmissionId, setGradingSubmissionId] = useState('');
  const [gradeScore, setGradeScore] = useState('80');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [gradingError, setGradingError] = useState('');
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [showAiAssist, setShowAiAssist] = useState(false);
  const [aiAssistQuestion, setAiAssistQuestion] = useState('');

  const activeAssignment: AssignmentSummary | null = teacherClass.assignments.find((a) => a.id === activeAssignmentId) || null;
  const activeSubmission = activeAssignment?.submissions.find((s) => s.id === gradingSubmissionId) || null;

  return (
    <>
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Assignments</p>
            <p className="mt-2 text-xl font-semibold text-[color:var(--hub-text)]">Create, assign, and review classwork fast</p>
          </div>
          {!isStudent ? (
            <button type="button" onClick={onCloseAssignmentModal} className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white">
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
                {assignment.description ? <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{assignment.description}</p> : null}
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
                      <a key={`${assignment.id}-${resource.url}`} href={resource.url} target="_blank" rel="noreferrer" className="inline-flex rounded-full border border-[color:var(--hub-border)] px-3 py-1 text-xs font-semibold text-[color:var(--hub-primary)]">
                        {resource.title}
                      </a>
                    ))}
                  </div>
                ) : null}
                {!isStudent ? <p className="mt-2 text-xs text-[color:var(--hub-muted)]">{assignment.submissions.length} submission{assignment.submissions.length === 1 ? '' : 's'} received</p> : null}
                {isStudent ? (
                  <div className="mt-2 grid gap-1 text-sm">
                    {assignment.mySubmission ? (
                      <>
                        <p className="text-[color:var(--hub-text)]">Submitted {formatHubDateTime(assignment.mySubmission.submittedAt)}</p>
                        <p className="text-[color:var(--hub-muted)]">Status: {assignment.mySubmission.status === 'graded' ? 'Graded' : 'Pending review'}</p>
                        {assignment.mySubmission.gradeScore !== null ? <p className="font-semibold text-[color:var(--hub-text)]">Score: {assignment.mySubmission.gradeScore}%</p> : null}
                        {assignment.mySubmission.feedback ? <p className="text-[color:var(--hub-muted)]">Feedback: {assignment.mySubmission.feedback}</p> : null}
                      </>
                    ) : (
                      <p className="text-[color:var(--edu-danger)]">{new Date(assignment.dueAt).getTime() < Date.now() ? 'Overdue - not submitted' : 'Not submitted yet'}</p>
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
                        setShowReviewModal(true);
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
                        setShowSubmitModal(true);
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

      {/* Assign homework modal */}
      <ActionModal isOpen={showAssignmentModal && !isStudent} title="Assign homework" description="Create a new assignment for this class." onClose={onCloseAssignmentModal}>
        <form className="grid gap-4" onSubmit={async (event) => {
          event.preventDefault();
          if (!assignmentTitle.trim() || !assignmentDescription.trim() || !assignmentDate) { setAssignmentError('Title, description, and due date are required.'); return; }
          const dueTime = new Date(assignmentDate).getTime();
          if (!Number.isFinite(dueTime) || dueTime <= Date.now()) { setAssignmentError('Due date must be in the future.'); return; }
          if (assignmentScope === 'individuals' && selectedAssignmentStudentIds.length === 0) { setAssignmentError('Select at least one student for individual assignment.'); return; }
          try {
            await createAssignment({ classId: teacherClass.id, title: assignmentTitle.trim(), description: assignmentDescription.trim(), resources: assignmentResources, files: assignmentFiles, dueAt: new Date(assignmentDate).toISOString(), assignedTo: assignmentScope, assignedStudentIds: assignmentScope === 'individuals' ? selectedAssignmentStudentIds : [] });
            setAssignmentTitle(''); setAssignmentDescription(''); setAssignmentResources([]); setAssignmentFiles([]); setResourceTitle(''); setResourceUrl(''); setAssignmentDate(''); setAssignmentScope('class'); setSelectedAssignmentStudentIds([]); setAssignmentError('');
            onCloseAssignmentModal();
            addNotification({ type: 'success', title: 'Assignment created', message: 'Homework is now visible to learners.', duration: 2200 });
          } catch (error) {
            setAssignmentError(error instanceof Error ? error.message : 'Could not create assignment.');
          }
        }}>
          <input value={assignmentTitle} onChange={(e) => { setAssignmentTitle(e.target.value); if (assignmentError) setAssignmentError(''); }} placeholder="Assignment title *" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <textarea value={assignmentDescription} onChange={(e) => { setAssignmentDescription(e.target.value); if (assignmentError) setAssignmentError(''); }} rows={4} placeholder="What learners need to do, success criteria, and submission details. *" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <div className="grid gap-2 rounded-2xl border border-[color:var(--hub-border)] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">Resources</p>
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <input value={resourceTitle} onChange={(e) => setResourceTitle(e.target.value)} placeholder="Document title" className="rounded-xl border border-[color:var(--hub-border)] px-3 py-2 outline-none" />
              <input value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} placeholder="https://..." className="rounded-xl border border-[color:var(--hub-border)] px-3 py-2 outline-none" />
              <button type="button" onClick={() => { if (!resourceUrl.trim()) { setAssignmentError('Resource URL is required.'); return; } setAssignmentResources((c) => [...c, { title: resourceTitle.trim() || 'Resource', url: resourceUrl.trim() }]); setResourceTitle(''); setResourceUrl(''); }} className="rounded-xl border border-[color:var(--hub-border)] px-3 py-2 text-sm font-semibold text-[color:var(--hub-text)]">Add</button>
            </div>
            {assignmentResources.length > 0 ? (
              <div className="grid gap-1">
                {assignmentResources.map((r, i) => (
                  <div key={`${r.url}-${i}`} className="flex items-center justify-between rounded-xl bg-[color:var(--hub-soft)] px-3 py-2 text-sm">
                    <span className="truncate text-[color:var(--hub-text)]">{r.title}</span>
                    <button type="button" onClick={() => setAssignmentResources((c) => c.filter((_, idx) => idx !== i))} className="text-xs font-semibold text-[color:var(--hub-primary)]">Remove</button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="grid gap-2 rounded-2xl border border-[color:var(--hub-border)] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">Upload documents</p>
            <input type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xlsx,.xls,.csv,.png,.jpg,.jpeg" onChange={(e) => { setAssignmentFiles(e.target.files ? Array.from(e.target.files) : []); if (assignmentError) setAssignmentError(''); }} className="rounded-xl border border-[color:var(--hub-border)] px-3 py-2 text-sm outline-none file:mr-3 file:rounded-full file:border file:border-[color:var(--hub-border)] file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold" />
            {assignmentFiles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {assignmentFiles.map((f) => <span key={`${f.name}-${f.size}`} className="inline-flex rounded-full bg-[color:var(--hub-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--hub-text)]">{f.name}</span>)}
              </div>
            ) : null}
          </div>
          <input type="datetime-local" value={assignmentDate} onChange={(e) => { setAssignmentDate(e.target.value); if (assignmentError) setAssignmentError(''); }} min={toDateTimeLocalMin()} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <select value={assignmentScope} onChange={(e) => { const s = e.target.value as 'class' | 'individuals'; setAssignmentScope(s); if (s === 'class') setSelectedAssignmentStudentIds([]); }} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none">
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
                      <input type="checkbox" checked={selected} onChange={(e) => { setSelectedAssignmentStudentIds((c) => e.target.checked ? [...c, student.id] : c.filter((s) => s !== student.id)); if (assignmentError) setAssignmentError(''); }} />
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}
          {assignmentError ? <p className="text-xs text-[color:var(--edu-danger)]">{assignmentError}</p> : null}
          <button type="submit" className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white">Create assignment</button>
        </form>
      </ActionModal>

      {/* Submit homework modal (students) */}
      <ActionModal isOpen={showSubmitModal && isStudent} title="Submit homework" description={activeAssignment ? `Submit work for ${activeAssignment.title}.` : 'Submit your assignment file.'} onClose={() => setShowSubmitModal(false)}>
        <form className="grid gap-4" onSubmit={async (event) => {
          event.preventDefault();
          if (!activeAssignment) { setSubmissionError('Select an assignment first.'); return; }
          if (!submissionFile) { setSubmissionError('Attach your homework file.'); return; }
          try {
            setIsSubmittingAssignment(true);
            setSubmissionError('');
            await submitAssignment({ classId: teacherClass.id, assignmentId: activeAssignment.id, submissionNote, file: submissionFile });
            setShowSubmitModal(false);
            setSubmissionFile(null);
            setSubmissionNote('');
            addNotification({ type: 'success', title: 'Homework submitted', message: 'Your teacher can now review it.', duration: 2200 });
          } catch (error) {
            setSubmissionError(error instanceof Error ? error.message : 'Could not submit homework.');
          } finally {
            setIsSubmittingAssignment(false);
          }
        }}>
          <textarea value={submissionNote} onChange={(e) => { setSubmissionNote(e.target.value); if (submissionError) setSubmissionError(''); }} rows={4} placeholder="Optional note to your teacher" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xlsx,.xls,.csv,.png,.jpg,.jpeg" onChange={(e) => { setSubmissionFile(e.target.files?.[0] || null); if (submissionError) setSubmissionError(''); }} className="rounded-xl border border-[color:var(--hub-border)] px-3 py-2 text-sm outline-none file:mr-3 file:rounded-full file:border file:border-[color:var(--hub-border)] file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold" />
          {submissionFile ? <p className="text-xs text-[color:var(--hub-muted)]">Selected: {submissionFile.name}</p> : null}
          {submissionError ? <p className="text-xs text-[color:var(--edu-danger)]">{submissionError}</p> : null}
          {activeAssignment ? (
            <div className="rounded-2xl border border-[color:var(--hub-border)] p-4">
              <button type="button" onClick={() => setShowAiAssist((p) => !p)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--hub-primary)]">
                <Sparkles className="h-3.5 w-3.5" />
                Get writing help
              </button>
              {showAiAssist ? (
                <AiPanel feature="ai-assignment-assist" payload={{ assignmentTitle: activeAssignment.title, assignmentDescription: activeAssignment.description }} promptInput={{ label: "What are you stuck on?", placeholder: "e.g. I don't understand what the question is asking...", value: aiAssistQuestion, onChange: setAiAssistQuestion }} label="Get guidance" outputFormat="text" />
              ) : null}
            </div>
          ) : null}
          <button type="submit" disabled={isSubmittingAssignment} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isSubmittingAssignment ? 'Submitting...' : 'Submit homework'}</button>
        </form>
      </ActionModal>

      {/* Review submissions modal (teachers) */}
      <ActionModal isOpen={showReviewModal && !isStudent} title="Review submissions" description={activeAssignment ? `${activeAssignment.title} submissions` : 'Review learner work'} onClose={() => setShowReviewModal(false)}>
        {activeAssignment ? (
          <div className="grid gap-4">
            {activeAssignment.submissions.length > 0 ? (
              <select value={gradingSubmissionId} onChange={(e) => { const id = e.target.value; setGradingSubmissionId(id); const sel = activeAssignment.submissions.find((s) => s.id === id); setGradeScore(String(sel?.gradeScore ?? 80)); setGradeFeedback(sel?.feedback || ''); setGradingError(''); }} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none">
                {activeAssignment.submissions.map((s) => <option key={s.id} value={s.id}>{s.studentName} • {formatHubDateTime(s.submittedAt)} • {s.status}</option>)}
              </select>
            ) : (
              <div className="rounded-2xl bg-[color:var(--hub-soft)] p-4 text-sm text-[color:var(--hub-muted)]">No submissions yet.</div>
            )}
            {activeSubmission ? (
              <>
                <div className="rounded-2xl border border-[color:var(--hub-border)] p-3 text-sm">
                  <p className="font-semibold text-[color:var(--hub-text)]">{activeSubmission.studentName}</p>
                  <p className="mt-1 text-[color:var(--hub-muted)]">Submitted {formatHubDateTime(activeSubmission.submittedAt)}</p>
                  {activeSubmission.submissionNote ? <p className="mt-2 text-[color:var(--hub-muted)]">{activeSubmission.submissionNote}</p> : null}
                  {activeSubmission.fileUrl ? <a href={activeSubmission.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex rounded-full border border-[color:var(--hub-border)] px-3 py-1 text-xs font-semibold text-[color:var(--hub-primary)]">Open file</a> : null}
                </div>
                <AiPanel feature="ai-assignment-feedback" payload={{ assignmentTitle: activeAssignment.title, assignmentDescription: activeAssignment.description, submissionNote: activeSubmission.submissionNote || '', fileUrl: activeSubmission.fileUrl || '' }} label="AI feedback assist" outputFormat="text" />
                <form className="grid gap-3" onSubmit={async (event) => {
                  event.preventDefault();
                  if (!activeAssignment || !activeSubmission) return;
                  const score = Number(gradeScore);
                  if (!Number.isFinite(score) || score < 0 || score > 100) { setGradingError('Grade must be between 0 and 100.'); return; }
                  try {
                    setIsSavingGrade(true);
                    setGradingError('');
                    await gradeAssignmentSubmission({ classId: teacherClass.id, assignmentId: activeAssignment.id, submissionId: activeSubmission.id, gradeScore: score, feedback: gradeFeedback });
                    addNotification({ type: 'success', title: 'Grade saved', message: 'Feedback is now visible to the student.', duration: 2200 });
                  } catch (error) {
                    setGradingError(error instanceof Error ? error.message : 'Could not save grade.');
                  } finally {
                    setIsSavingGrade(false);
                  }
                }}>
                  <input type="number" min={0} max={100} value={gradeScore} onChange={(e) => { setGradeScore(e.target.value); if (gradingError) setGradingError(''); }} placeholder="Grade score (0-100)" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
                  <textarea value={gradeFeedback} onChange={(e) => { setGradeFeedback(e.target.value); if (gradingError) setGradingError(''); }} rows={4} placeholder="Feedback for the student" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
                  {gradingError ? <p className="text-xs text-[color:var(--edu-danger)]">{gradingError}</p> : null}
                  <button type="submit" disabled={isSavingGrade} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isSavingGrade ? 'Saving...' : 'Save grade and feedback'}</button>
                </form>
              </>
            ) : null}
          </div>
        ) : null}
      </ActionModal>
    </>
  );
};
