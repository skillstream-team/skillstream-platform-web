import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, ChevronRight, Clock, GripVertical, Plus, Trash2, Users, X } from 'lucide-react';
import { useNotifications } from '../../components/notifications/NotificationToast';
import { useOrgHubStore } from '../../store/orgHub';

export const OrgPathDetailPage: React.FC = () => {
  const { orgId = '', pathId = '' } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { paths, courses, members, isHydrated, loadOrgHub, updatePath, addCourseToPath, removeCourseFromPath, enrollLearnersInPath } = useOrgHubStore();

  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editTitle, setEditTitle] = useState(false);
  const [titleVal, setTitleVal] = useState('');

  useEffect(() => { if (orgId) void loadOrgHub(orgId); }, [orgId, loadOrgHub]);

  const path = paths.find((p) => p.id === pathId);
  if (!isHydrated) return <div className="h-96 animate-pulse rounded-[32px] bg-[color:var(--hub-soft)]" />;
  if (!path) return <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-12 text-center text-sm text-[color:var(--hub-muted)]">Path not found.</div>;

  const availableCourses = courses.filter((c) => c.isPublished && !path.courses.some((pc) => pc.courseId === c.id));
  const learners = members.filter((m) => m.orgRole === 'learner' || m.orgRole === 'manager');
  const totalMinutes = path.courses.reduce((s, c) => s + (c.estimatedMinutes ?? 0), 0);
  const totalLessons = path.courses.reduce((s, c) => s + c.totalLessons, 0);

  const handlePublishToggle = async () => {
    try { await updatePath(path.id, { isPublished: !path.isPublished }); } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Could not update path.', duration: 2500 });
    }
  };

  const handleSaveTitle = async () => {
    if (!titleVal.trim()) return;
    await updatePath(path.id, { title: titleVal.trim() });
    setEditTitle(false);
  };

  const handleAddCourse = async (courseId: string) => {
    try { await addCourseToPath(path.id, courseId); setShowAddCourse(false); } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Could not add course.', duration: 2500 });
    }
  };

  const handleRemoveCourse = async (pathCourseId: string) => {
    try { await removeCourseFromPath(path.id, pathCourseId); } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Could not remove course.', duration: 2500 });
    }
  };

  const handleEnroll = async () => {
    if (!selectedUsers.length) return;
    try {
      setIsSaving(true);
      await enrollLearnersInPath(path.id, selectedUsers);
      addNotification({ type: 'success', title: 'Learners enrolled', message: `${selectedUsers.length} learner${selectedUsers.length !== 1 ? 's' : ''} enrolled in path.`, duration: 2000 });
      setShowEnroll(false); setSelectedUsers([]);
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Could not enrol learners.', duration: 2500 });
    } finally { setIsSaving(false); }
  };

  const toggleUser = (uid: string) => setSelectedUsers((prev) => prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]);

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate(`/org/${orgId}/paths`)} className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--hub-muted)] hover:text-[color:var(--hub-text)]">
        <ArrowLeft className="h-4 w-4" /> Back to paths
      </button>

      {/* Header */}
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Learning Path</p>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="flex-1">
            {editTitle ? (
              <div className="flex items-center gap-2">
                <input value={titleVal} onChange={(e) => setTitleVal(e.target.value)} autoFocus className="flex-1 rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-2 text-2xl font-semibold outline-none" />
                <button type="button" onClick={handleSaveTitle} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-2 text-sm font-semibold text-white">Save</button>
                <button type="button" onClick={() => setEditTitle(false)} className="rounded-full px-4 py-2 text-sm font-semibold text-[color:var(--hub-muted)]">Cancel</button>
              </div>
            ) : (
              <button type="button" onClick={() => { setTitleVal(path.title); setEditTitle(true); }} className="text-left">
                <h2 className="text-3xl font-semibold tracking-tight text-[color:var(--hub-text)] hover:text-[color:var(--hub-primary)]">{path.title}</h2>
              </button>
            )}
            {path.description ? <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{path.description}</p> : null}
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-[color:var(--hub-muted)]">
              <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" />{path.courses.length} courses</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{totalMinutes} min total</span>
              <span className="flex items-center gap-1.5"><GripVertical className="h-4 w-4" />{totalLessons} lessons</span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={handlePublishToggle} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${path.isPublished ? 'border border-[color:var(--hub-border)] text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]' : 'bg-[color:var(--hub-primary)] text-white'}`}>
              {path.isPublished ? 'Unpublish' : 'Publish'}
            </button>
            <button type="button" onClick={() => setShowEnroll(true)} className="flex items-center gap-2 rounded-full border border-[color:var(--hub-border)] px-4 py-2 text-sm font-semibold text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]">
              <Users className="h-4 w-4" /> Enrol learners
            </button>
          </div>
        </div>
      </section>

      {/* Course sequence */}
      <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Course Sequence</p>
          {availableCourses.length > 0 ? (
            <button type="button" onClick={() => setShowAddCourse(!showAddCourse)} className="flex items-center gap-1.5 rounded-full bg-[color:var(--hub-primary)] px-4 py-2 text-sm font-semibold text-white">
              <Plus className="h-3.5 w-3.5" /> Add course
            </button>
          ) : null}
        </div>

        {showAddCourse && availableCourses.length > 0 ? (
          <div className="mb-4 rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] p-3">
            <p className="mb-2 text-xs font-semibold text-[color:var(--hub-muted)]">Select a course to add:</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {availableCourses.map((c) => (
                <button key={c.id} type="button" onClick={() => handleAddCourse(c.id)} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold text-[color:var(--hub-text)] shadow-sm hover:bg-[color:var(--hub-primary)] hover:text-white transition">
                  <BookOpen className="h-4 w-4 shrink-0" /><span className="truncate">{c.title}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {path.courses.length === 0 ? (
          <p className="py-8 text-center text-sm text-[color:var(--hub-muted)]">No courses yet. Add courses to build the learning sequence.</p>
        ) : (
          <div className="space-y-2">
            {path.courses.map((pc, index) => (
              <div key={pc.id} className="flex items-center gap-4 rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--hub-primary)] text-sm font-bold text-white">{index + 1}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[color:var(--hub-text)]">{pc.courseTitle}</p>
                  <div className="mt-0.5 flex gap-3 text-xs text-[color:var(--hub-muted)]">
                    {pc.estimatedMinutes ? <span>{pc.estimatedMinutes} min</span> : null}
                    <span>{pc.totalLessons} lesson{pc.totalLessons !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                {index < path.courses.length - 1 ? <ChevronRight className="h-4 w-4 shrink-0 text-[color:var(--hub-muted)]" /> : <Check className="h-4 w-4 shrink-0 text-emerald-500" />}
                <button type="button" onClick={() => handleRemoveCourse(pc.id)} className="shrink-0 rounded-full p-1.5 text-[color:var(--hub-muted)] hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enrol modal */}
      {showEnroll ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEnroll(false)} />
          <div className="relative w-full max-w-md rounded-[32px] bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-semibold text-[color:var(--hub-text)]">Enrol learners in path</p>
              <button type="button" onClick={() => setShowEnroll(false)} className="rounded-full p-1.5 text-[color:var(--hub-muted)] hover:bg-[color:var(--hub-soft)]"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-3 text-xs text-[color:var(--hub-muted)]">Learners will be enrolled in all {path.courses.length} courses in this path.</p>
            <div className="max-h-60 space-y-1.5 overflow-y-auto">
              {learners.map((m) => (
                <button key={m.userId} type="button" onClick={() => toggleUser(m.userId)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${selectedUsers.includes(m.userId) ? 'bg-[color:var(--hub-primary)] text-white' : 'bg-[color:var(--hub-soft)] text-[color:var(--hub-text)] hover:bg-[color:var(--hub-border)]'}`}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">{m.name.slice(0, 2).toUpperCase()}</div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{m.name}</p>
                    <p className="truncate text-xs opacity-70">{m.email}</p>
                  </div>
                </button>
              ))}
            </div>
            <button type="button" onClick={handleEnroll} disabled={!selectedUsers.length || isSaving} className="mt-4 w-full rounded-full bg-[color:var(--hub-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60">
              {isSaving ? 'Enrolling…' : `Enrol ${selectedUsers.length || ''} learner${selectedUsers.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
