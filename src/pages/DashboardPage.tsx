import React, { useMemo } from 'react';
import { ArrowRight, CheckCheck, Video } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { NextStepsPanel } from '../components/hub/NextStepsPanel';
import { getSessionCachedValue } from '../lib/sessionCache';
import { formatHubDateTime } from '../lib/utils';
import { useAuthStore } from '../store/auth';
import { useTeacherHubStore } from '../store/teacherHub';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role === 'STUDENT';
  const allClasses = useTeacherHubStore((state) => state.classes);
  const students = useTeacherHubStore((state) => state.students);
  const tasks = useTeacherHubStore((state) => state.tasks);
  const revision = useTeacherHubStore((state) => state.revision);
  const currentStudent = students.find((entry) => entry.email.toLowerCase() === (user?.email || '').toLowerCase());
  const classes = useMemo(
    () =>
      isStudent
        ? currentStudent
          ? allClasses.filter((entry) => entry.students.some((student) => student.id === currentStudent.id))
          : []
        : allClasses,
    [allClasses, currentStudent, isStudent]
  );
  const allLessons = getSessionCachedValue(
    `dashboard:all-lessons:${revision}:${user?.role || 'guest'}`,
    () => classes.flatMap((entry) => entry.lessons),
    20_000
  );
  const todaySchedule = getSessionCachedValue(
    `dashboard:today:${revision}:${user?.role || 'guest'}`,
    () =>
      allLessons
        .filter((lesson) => lesson.status === 'today')
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    20_000
  );
  const activity = getSessionCachedValue(
    `dashboard:activity:${revision}:${user?.role || 'guest'}`,
    () =>
      classes
        .flatMap((entry) => entry.activity.map((item) => ({ ...item, className: entry.name, classId: entry.id })))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5),
    20_000
  );
  const stats = isStudent
    ? [
        { id: 'classes', label: 'My classes', value: `${classes.length}`, note: 'Active right now' },
        { id: 'upcoming', label: 'Upcoming lessons', value: `${allLessons.filter((lesson) => lesson.status !== 'completed').length}`, note: 'Next 7 days' },
        { id: 'progress', label: 'My progress', value: `${currentStudent?.progress || 0}%`, note: 'Across active classes' },
        { id: 'homework', label: 'Homework done', value: `${currentStudent?.homeworkCompletion || 0}%`, note: 'Latest completion rate' },
      ]
    : [
    { id: 'students', label: 'Total students', value: `${new Set(classes.flatMap((entry) => entry.students.map((student) => student.id))).size}`, note: 'Across all active classes' },
    { id: 'classes', label: 'Active classes', value: `${classes.length}`, note: 'Running this week' },
    { id: 'upcoming', label: 'Upcoming lessons', value: `${allLessons.filter((lesson) => lesson.status !== 'completed').length}`, note: 'Next 7 days' },
    { id: 'tasks', label: 'Pending tasks', value: `${tasks.filter((task) => task.status !== 'done').length}`, note: 'Reviews, messages, payments' },
  ];

  // Org users should never land here — redirect to their portal.
  if (user?.activeOrgId) {
    const orgRole = user.orgMemberships.find((m) => m.orgId === user.activeOrgId)?.orgRole;
    if (orgRole === 'admin' || orgRole === 'instructor') return <Navigate to={`/org/${user.activeOrgId}/dashboard`} replace />;
    return <Navigate to="/learn" replace />;
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Dashboard</p>
            <h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">
              {isStudent ? 'Your learning dashboard.' : 'Run your lesson business from one workspace.'}
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-[color:var(--hub-muted)]">
              {isStudent
                ? 'Track classes, lessons, and updates in one place.'
                : 'Classes, students, lessons, and payments in one flow.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {isStudent ? (
              <>
                <Link to="/classes" className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white">
                  Open classes
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/schedule" className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)]">
                  View schedule
                </Link>
              </>
            ) : (
              <>
                <Link to="/classes" className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white">
                  Create class
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/schedule" className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)]">
                  Schedule lesson
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div key={item.id} className="rounded-[24px] bg-[color:var(--hub-soft)] p-4">
              <p className="text-sm font-medium text-[color:var(--hub-muted)]">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--hub-accent)]">{item.value}</p>
              <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      {!isStudent ? <NextStepsPanel tasks={tasks} /> : null}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Today's Schedule</p>
                <h3 className="mt-2 text-2xl font-semibold text-[color:var(--hub-text)]">
                  {isStudent ? 'Classes happening today' : 'Lessons happening today'}
                </h3>
              </div>
              <Link to="/schedule" className="text-sm font-semibold text-[color:var(--hub-primary)]">
                View calendar
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {todaySchedule.length > 0 ? (
                todaySchedule.map((lesson) => (
                  <div key={lesson.id} className="flex flex-col gap-4 rounded-[24px] border border-[color:var(--hub-border)] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--hub-text)]">{lesson.title}</p>
                      <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{lesson.className}</p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--hub-muted)]">
                        {formatHubDateTime(lesson.scheduledAt)} • {lesson.durationMinutes} min • {lesson.studentCount} students
                      </p>
                    </div>
                    <Link to={`/class/${lesson.classId}/live/${lesson.id}`} className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white">
                      <Video className="h-4 w-4" />
                      {isStudent ? 'Open class' : 'Join'}
                    </Link>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] bg-[color:var(--hub-soft)] p-5 text-sm text-[color:var(--hub-muted)]">
                  {isStudent
                    ? 'No classes today.'
                    : 'No lessons today. Use this time for planning and feedback.'}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Recent Activity</p>
                <h3 className="mt-2 text-2xl font-semibold text-[color:var(--hub-text)]">
                  {isStudent ? 'Recent class updates' : 'Recent class activity'}
                </h3>
              </div>
              <CheckCheck className="h-5 w-5 text-[color:var(--hub-primary)]" />
            </div>
            <div className="mt-5 grid gap-3">
              {activity.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-[color:var(--hub-border)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[color:var(--hub-text)]">{item.title}</p>
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--hub-muted)]">{item.className}</span>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--hub-muted)]">{item.detail}</p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--hub-muted)]">{formatHubDateTime(item.timestamp)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">
                  {isStudent ? 'My classes' : 'Active classes'}
                </p>
                <p className="mt-2 text-xl font-semibold text-[color:var(--hub-text)]">
                  {isStudent ? 'Where you are learning now' : 'Your current teaching load'}
                </p>
              </div>
              <Link to="/classes" className="text-sm font-semibold text-[color:var(--hub-primary)]">
                Open classes
              </Link>
            </div>
            <div className="mt-4 grid gap-3">
              {classes.length === 0 ? (
                <div className="rounded-[22px] bg-[color:var(--hub-soft)] p-4 text-sm text-[color:var(--hub-muted)]">
                  {isStudent ? 'You are not enrolled in any classes yet.' : 'No classes yet. Create your first class to start.'}
                </div>
              ) : classes.map((teacherClass) => (
                <Link key={teacherClass.id} to={`/class/${teacherClass.id}`} className="rounded-[22px] border border-[color:var(--hub-border)] p-4 transition hover:bg-[color:var(--hub-soft)]">
                  <p className="text-sm font-semibold text-[color:var(--hub-text)]">{teacherClass.name}</p>
                  <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{teacherClass.studentCount} students</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--hub-muted)]">
                    Next session {formatHubDateTime(teacherClass.nextSessionAt)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
};
