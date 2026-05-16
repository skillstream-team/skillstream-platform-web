import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, BookOpen, ChevronRight, Clock, Lock, Route } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useLearnerHubStore } from '../../store/learnerHub';
import { formatHubDateTime } from '../../lib/utils';
import { LearnerCourse, LearnerPath } from '../../data/orgHub';

export const LearnPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { enrolledCourses, certificates, orgAnnouncements, enrolledPaths, isHydrated, isSyncing, loadLearnerHub } = useLearnerHubStore();

  useEffect(() => {
    if (user?.id) void loadLearnerHub(user.id);
  }, [user?.id, loadLearnerHub]);

  if (!isHydrated || isSyncing) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-[32px] bg-[color:var(--hub-soft)]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-56 animate-pulse rounded-[32px] bg-[color:var(--hub-soft)]" />)}
        </div>
      </div>
    );
  }

  const inProgress = enrolledCourses.filter((c) => !c.completedAt);
  const completed = enrolledCourses.filter((c) => c.completedAt);
  const overdueCourses = inProgress.filter((c) => c.deadlineAt && new Date(c.deadlineAt) < new Date());
  const activeAnnouncements = orgAnnouncements.filter((a) => a.isActive && (!a.expiresAt || new Date(a.expiresAt) > new Date()));
  const mandatoryPending = inProgress.filter((c) => c.isMandatory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">My Learning</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">Your courses</h2>
            <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{inProgress.length} in progress · {completed.length} completed · {certificates.length} certificate{certificates.length !== 1 ? 's' : ''}</p>
          </div>
          {overdueCourses.length > 0 ? (
            <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">{overdueCourses.length} overdue</span>
          ) : null}
        </div>
        {mandatoryPending.length > 0 ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            <Award className="h-4 w-4 shrink-0" />
            {mandatoryPending.length} mandatory course{mandatoryPending.length !== 1 ? 's' : ''} pending — required for compliance.
          </div>
        ) : null}
      </section>

      {/* Announcements */}
      {activeAnnouncements.length > 0 ? (
        <div className="rounded-[24px] border-l-4 border-[color:var(--hub-primary)] bg-blue-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--hub-primary)]">Announcements</p>
          <div className="mt-2 space-y-2">
            {activeAnnouncements.map((a) => (
              <div key={a.id}>
                <p className="text-sm font-semibold text-[color:var(--hub-text)]">{a.title}</p>
                <p className="mt-0.5 text-sm text-[color:var(--hub-muted)]">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Learning paths */}
      {enrolledPaths.length > 0 ? (
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center gap-2">
            <Route className="h-4 w-4 text-[color:var(--hub-primary)]" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Learning paths</p>
          </div>
          <div className="space-y-4">
            {enrolledPaths.map((path) => <PathCard key={path.pathId} path={path} onNavigate={(courseId, enrollmentId) => navigate(`/learn/course/${courseId}?enrollment=${enrollmentId}`)} />)}
          </div>
        </div>
      ) : null}

      {/* Courses */}
      {enrolledCourses.length === 0 ? (
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-12 text-center shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <BookOpen className="mx-auto h-10 w-10 text-[color:var(--hub-muted)]" />
          <p className="mt-4 text-sm font-semibold text-[color:var(--hub-text)]">No courses yet</p>
          <p className="mt-1 text-sm text-[color:var(--hub-muted)]">Your organisation will enrol you in courses. Check back soon.</p>
        </div>
      ) : (
        <>
          {inProgress.length > 0 ? (
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-muted)]">In progress</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {inProgress.map((course) => <CourseCard key={course.enrollmentId} course={course} onOpen={() => navigate(`/learn/course/${course.courseId}?enrollment=${course.enrollmentId}`)} />)}
              </div>
            </div>
          ) : null}
          {completed.length > 0 ? (
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-muted)]">Completed</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {completed.map((course) => <CourseCard key={course.enrollmentId} course={course} onOpen={() => navigate(`/learn/course/${course.courseId}?enrollment=${course.enrollmentId}`)} />)}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

const PathCard: React.FC<{ path: LearnerPath; onNavigate: (courseId: string, enrollmentId: string) => void }> = ({ path, onNavigate }) => (
  <div className="rounded-[24px] border border-[color:var(--hub-border)] p-4">
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[color:var(--hub-text)]">{path.title}</p>
        {path.description ? <p className="mt-0.5 text-xs text-[color:var(--hub-muted)]">{path.description}</p> : null}
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${path.completedAt ? 'bg-emerald-100 text-emerald-700' : 'bg-[color:var(--hub-soft)] text-[color:var(--hub-muted)]'}`}>
        {path.completionPercent}%
      </span>
    </div>
    <div className="mt-2 h-1.5 rounded-full bg-[color:var(--hub-soft)]">
      <div className={`h-full rounded-full transition-all ${path.completedAt ? 'bg-emerald-500' : 'bg-[color:var(--hub-primary)]'}`} style={{ width: `${path.completionPercent}%` }} />
    </div>
    <div className="mt-3 space-y-1.5">
      {path.courses.map((c) => (
        <button
          key={c.courseId}
          type="button"
          disabled={!c.isUnlocked || !c.enrollmentId}
          onClick={() => c.enrollmentId && onNavigate(c.courseId, c.enrollmentId)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-[color:var(--hub-soft)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
            {c.completedAt ? <Award className="h-4 w-4 text-emerald-500" /> : c.isUnlocked ? <ChevronRight className="h-4 w-4 text-[color:var(--hub-primary)]" /> : <Lock className="h-4 w-4 text-[color:var(--hub-muted)]" />}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[color:var(--hub-text)]">{c.courseTitle}</span>
          <span className="shrink-0 text-xs text-[color:var(--hub-muted)]">{c.completionPercent}%</span>
        </button>
      ))}
    </div>
  </div>
);

const CourseCard: React.FC<{ course: LearnerCourse; onOpen: () => void }> = ({ course, onOpen }) => {
  const isOverdue = !course.completedAt && course.deadlineAt && new Date(course.deadlineAt) < new Date();
  return (
    <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-1.5">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${course.completedAt ? 'bg-emerald-100 text-emerald-700' : isOverdue ? 'bg-red-100 text-red-700' : 'bg-[color:var(--hub-soft)] text-[color:var(--hub-muted)]'}`}>
            {course.completedAt ? 'Completed' : isOverdue ? 'Overdue' : 'In progress'}
          </span>
          {course.isMandatory ? <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">Required</span> : null}
        </div>
        {course.estimatedMinutes ? (
          <div className="flex items-center gap-1 text-xs text-[color:var(--hub-muted)]">
            <Clock className="h-3.5 w-3.5" />
            {course.estimatedMinutes} min
          </div>
        ) : null}
      </div>
      <h3 className="mt-4 text-base font-semibold text-[color:var(--hub-text)]">{course.title}</h3>
      {course.description ? <p className="mt-1 line-clamp-2 text-sm text-[color:var(--hub-muted)]">{course.description}</p> : null}
      <p className="mt-2 text-xs text-[color:var(--hub-muted)]">{course.orgName}</p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-[color:var(--hub-muted)]">
          <span>{course.completedLessons}/{course.totalLessons} lessons</span>
          <span>{course.completionPercent}%</span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-[color:var(--hub-soft)]">
          <div className={`h-full rounded-full transition-all ${course.completedAt ? 'bg-emerald-500' : 'bg-[color:var(--hub-primary)]'}`} style={{ width: `${course.completionPercent}%` }} />
        </div>
      </div>

      {course.deadlineAt && !course.completedAt ? (
        <p className={`mt-2 text-xs ${isOverdue ? 'font-semibold text-red-600' : 'text-[color:var(--hub-muted)]'}`}>Due {formatHubDateTime(course.deadlineAt)}</p>
      ) : null}

      <button type="button" onClick={onOpen} className={`mt-4 w-full rounded-full py-2 text-sm font-semibold transition ${course.completedAt ? 'border border-[color:var(--hub-border)] text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]' : 'bg-[color:var(--hub-primary)] text-white'}`}>
        {course.completedAt ? 'Review course' : course.completionPercent > 0 ? 'Continue' : 'Start course'}
      </button>
    </div>
  );
};
