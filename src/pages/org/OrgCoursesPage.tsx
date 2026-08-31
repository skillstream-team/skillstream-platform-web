import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, Plus, Search } from 'lucide-react';
import { ActionModal } from '../../components/common/ActionModal';
import { useNotifications } from '../../components/notifications/NotificationToast';
import { cn, formatHubDateTime } from '../../lib/utils';
import { useOrgHubStore } from '../../store/orgHub';
import { Course, CourseCategory } from '../../data/orgHub';

export const OrgCoursesPage: React.FC = () => {
  const { orgId = '' } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { org, courses, isHydrated, isSyncing, loadOrgHub, createCourse, updateCourse } = useOrgHubStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<CourseCategory | ''>('');

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const filteredCourses = useMemo(() => {
    let list = courses;
    if (filterCategory) list = list.filter((c) => c.category === filterCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
    }
    return list;
  }, [courses, filterCategory, searchQuery]);

  useEffect(() => {
    if (orgId) void loadOrgHub(orgId);
  }, [orgId, loadOrgHub]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTitle.trim()) { setCreateError('Title is required.'); return; }
    try {
      setIsCreating(true);
      setCreateError('');
      const courseId = await createCourse({ title: newTitle.trim(), description: newDescription.trim() });
      addNotification({ type: 'success', title: 'Course created', message: 'Opening course builder.', duration: 1800 });
      setShowCreate(false);
      setNewTitle('');
      setNewDescription('');
      navigate(`/org/${orgId}/courses/${courseId}/build`);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Could not create course.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleTogglePublish = async (course: Course) => {
    try {
      await updateCourse(course.id, { isPublished: !course.isPublished });
      addNotification({ type: 'success', title: course.isPublished ? 'Course unpublished' : 'Course published', message: '', duration: 1800 });
    } catch { /* swallow */ }
  };

  if (!isHydrated || isSyncing) {
    return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1,2,3].map((i) => <div key={i} className="h-48 animate-pulse rounded-[32px] bg-[color:var(--hub-soft)]" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">{org?.name}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">Courses</h2>
            <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{filteredCourses.length} of {courses.length} course{courses.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            New course
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--hub-muted)]" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search courses" className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-10 py-2.5 text-sm outline-none" />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as CourseCategory | '')} className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-2.5 text-sm outline-none">
            <option value="">All categories</option>
            {(['compliance', 'leadership', 'technical', 'soft-skills', 'onboarding', 'health-safety', 'other'] as CourseCategory[]).map((cat) => (
              <option key={cat} value={cat}>{cat.replace('-', ' ')}</option>
            ))}
          </select>
        </div>
      </section>

      {courses.length === 0 ? (
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-12 text-center shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <BookOpen className="mx-auto h-10 w-10 text-[color:var(--hub-muted)]" />
          <p className="mt-4 text-sm font-semibold text-[color:var(--hub-text)]">No courses yet</p>
          <p className="mt-1 text-sm text-[color:var(--hub-muted)]">Create your first course to get started.</p>
          <button type="button" onClick={() => setShowCreate(true)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-5 py-2.5 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" />New course
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => {
            const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
            return (
              <div key={course.id} className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', course.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-[color:var(--hub-soft)] text-[color:var(--hub-muted)]')}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                    {course.category ? (
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-blue-700">
                        {course.category.replace('-', ' ')}
                      </span>
                    ) : null}
                    {course.difficulty ? (
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', course.difficulty === 'beginner' ? 'bg-teal-50 text-teal-700' : course.difficulty === 'intermediate' ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700')}>
                        {course.difficulty}
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(course)}
                    className="shrink-0 text-[color:var(--hub-muted)] hover:text-[color:var(--hub-text)]"
                    aria-label={course.isPublished ? 'Unpublish' : 'Publish'}
                    title={course.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    {course.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <h3 className="mt-4 text-base font-semibold text-[color:var(--hub-text)]">{course.title}</h3>
                {course.description ? <p className="mt-1 line-clamp-2 text-sm text-[color:var(--hub-muted)]">{course.description}</p> : null}
                {course.skills && course.skills.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {course.skills.slice(0, 4).map((skill) => (
                      <span key={skill} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">{skill}</span>
                    ))}
                    {course.skills.length > 4 ? <span className="rounded-full bg-[color:var(--hub-soft)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--hub-muted)]">+{course.skills.length - 4}</span> : null}
                  </div>
                ) : null}
                <div className="mt-4 flex items-center gap-3 text-xs text-[color:var(--hub-muted)]">
                  <span>{course.modules.length} module{course.modules.length !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{totalLessons} lesson{totalLessons !== 1 ? 's' : ''}</span>
                  {course.estimatedMinutes ? <><span>·</span><span>{course.estimatedMinutes} min</span></> : null}
                </div>
                <p className="mt-1 text-xs text-[color:var(--hub-muted)]">Updated {formatHubDateTime(course.updatedAt)}</p>
                <button
                  type="button"
                  onClick={() => navigate(`/org/${orgId}/courses/${course.id}/build`)}
                  className="mt-4 w-full rounded-full border border-[color:var(--hub-border)] py-2 text-sm font-semibold text-[color:var(--hub-text)] transition hover:bg-[color:var(--hub-soft)]"
                >
                  Edit course
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ActionModal isOpen={showCreate} title="New course" description="Give your course a title to get started." onClose={() => { setShowCreate(false); setCreateError(''); setNewTitle(''); setNewDescription(''); }}>
        <form onSubmit={handleCreate} className="grid gap-4">
          {createError ? <p className="text-xs text-[color:var(--edu-danger)]">{createError}</p> : null}
          <input
            value={newTitle}
            onChange={(e) => { setNewTitle(e.target.value); if (createError) setCreateError(''); }}
            placeholder="Course title"
            className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none"
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Short description (optional)"
            rows={3}
            className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none"
          />
          <button type="submit" disabled={isCreating} className="rounded-full bg-[color:var(--hub-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60">
            {isCreating ? 'Creating...' : 'Create & build'}
          </button>
        </form>
      </ActionModal>
    </div>
  );
};
