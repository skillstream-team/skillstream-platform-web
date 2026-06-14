import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Award, BookOpen, CheckCircle, Route, ShieldCheck, Star, TrendingUp, Trophy, Users } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useOrgHubStore } from '../../store/orgHub';
import { cn, formatHubDateTime } from '../../lib/utils';
import { OrgOnboardingWizard, shouldShowOnboarding } from '../../components/org/OrgOnboardingWizard';

export const OrgDashboardPage: React.FC = () => {
  const { orgId = '' } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { org, members, courses, enrollments, paths, announcements, isHydrated, isSyncing, loadOrgHub } = useOrgHubStore();
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => { if (orgId) void loadOrgHub(orgId); }, [orgId, loadOrgHub]);

  useEffect(() => {
    if (isHydrated) setShowWizard(shouldShowOnboarding(orgId, courses.length, members.length));
  }, [isHydrated, orgId, courses.length, members.length]);

  const learnersList = useMemo(() => members.filter((m) => m.orgRole === 'learner' || m.orgRole === 'manager'), [members]);

  const leaderboard = useMemo(() => {
    return learnersList.map((lm) => {
      const userEnrolls = enrollments.filter((e) => e.userId === lm.userId);
      const completedCourses = userEnrolls.filter((e) => e.completedAt).length;
      const lessonPoints = userEnrolls.reduce((sum, e) => sum + Math.round((e.completionPercent / 100) * (courses.find((c) => c.id === e.courseId)?.modules.reduce((s, m) => s + m.lessons.length, 0) ?? 0)), 0);
      const points = lessonPoints * 10 + completedCourses * 100;
      return { userId: lm.userId, name: lm.name, points, completedCourses };
    }).sort((a, b) => b.points - a.points).slice(0, 5);
  }, [learnersList, enrollments, courses]);

  if (!isHydrated || isSyncing) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-[32px] bg-[color:var(--hub-soft)]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((i) => <div key={i} className="h-28 animate-pulse rounded-[24px] bg-[color:var(--hub-soft)]" />)}</div>
      </div>
    );
  }

  const totalLearners = learnersList.length;
  const completedEnrollments = enrollments.filter((e) => e.completedAt).length;
  const avgCompletion = enrollments.length > 0 ? Math.round(enrollments.reduce((sum, e) => sum + e.completionPercent, 0) / enrollments.length) : 0;
  const publishedCourses = courses.filter((c) => c.isPublished).length;
  const overdueEnrollments = enrollments.filter((e) => e.deadlineAt && !e.completedAt && new Date(e.deadlineAt) < new Date());

  // Compliance: mandatory courses only
  const mandatoryEnrollments = enrollments.filter((e) => e.isMandatory);
  const mandatoryCompleted = mandatoryEnrollments.filter((e) => e.completedAt);
  const complianceRate = mandatoryEnrollments.length > 0 ? Math.round((mandatoryCompleted.length / mandatoryEnrollments.length) * 100) : null;

  // Course completion rates
  const courseStats = courses.map((c) => {
    const courseEnrolls = enrollments.filter((e) => e.courseId === c.id);
    const done = courseEnrolls.filter((e) => e.completedAt).length;
    return { id: c.id, title: c.title, total: courseEnrolls.length, done, rate: courseEnrolls.length > 0 ? Math.round((done / courseEnrolls.length) * 100) : 0 };
  }).filter((s) => s.total > 0).sort((a, b) => b.rate - a.rate);

  // Recent activity (completed enrollments sorted by completedAt desc)
  const recentActivity = [...enrollments]
    .filter((e) => e.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 6);

  const metrics = [
    { label: 'Total learners', value: totalLearners, sub: `${members.filter(m => m.orgRole === 'instructor' || m.orgRole === 'manager').length} instructors/managers`, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Published courses', value: publishedCourses, sub: `${paths.filter(p => p.isPublished).length} active paths`, icon: BookOpen, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Avg. completion', value: `${avgCompletion}%`, sub: `${completedEnrollments} completions`, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
    { label: 'Compliance rate', value: complianceRate !== null ? `${complianceRate}%` : '—', sub: complianceRate !== null ? `${mandatoryCompleted.length}/${mandatoryEnrollments.length} required` : 'No mandatory courses', icon: ShieldCheck, color: overdueEnrollments.length > 0 ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50' },
  ];

  const activeAnnouncements = announcements.filter((a) => a.isActive && (!a.expiresAt || new Date(a.expiresAt) > new Date()));

  return (
    <div className="space-y-6">
      {showWizard ? <OrgOnboardingWizard onDismiss={() => setShowWizard(false)} /> : null}

      {/* Header */}
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Organisation</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">{org?.name ?? 'Dashboard'}</h2>
            <p className="mt-1 text-sm text-[color:var(--hub-muted)]">Welcome back, {user?.name}.</p>
          </div>
          {overdueEnrollments.length > 0 ? (
            <button type="button" onClick={() => navigate(`/org/${orgId}/reports`)} className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">
              <AlertTriangle className="h-4 w-4" /> {overdueEnrollments.length} overdue
            </button>
          ) : null}
        </div>
      </section>

      {/* Active announcements for admin */}
      {activeAnnouncements.length > 0 ? (
        <div className="rounded-[24px] border-l-4 border-[color:var(--hub-primary)] bg-blue-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--hub-primary)]">Active Announcements</p>
          <div className="mt-2 space-y-1.5">
            {activeAnnouncements.slice(0, 2).map((a) => (
              <p key={a.id} className="text-sm font-semibold text-[color:var(--hub-text)]">{a.title} <span className="font-normal text-[color:var(--hub-muted)]">— {a.body.slice(0, 80)}{a.body.length > 80 ? '…' : ''}</span></p>
            ))}
          </div>
        </div>
      ) : null}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className={cn('inline-flex h-10 w-10 items-center justify-center rounded-2xl', color)}><Icon className="h-5 w-5" /></div>
            <p className="mt-4 text-2xl font-semibold text-[color:var(--hub-text)]">{value}</p>
            <p className="mt-0.5 text-sm font-semibold text-[color:var(--hub-muted)]">{label}</p>
            <p className="mt-0.5 text-xs text-[color:var(--hub-muted)]">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Course completion table */}
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Course completion</p>
          {courseStats.length === 0 ? (
            <p className="text-sm text-[color:var(--hub-muted)]">No enrolled courses yet.</p>
          ) : (
            <div className="space-y-3">
              {courseStats.map((s) => (
                <div key={s.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-semibold text-[color:var(--hub-text)]">{s.title}</span>
                    <span className="ml-2 shrink-0 font-semibold text-[color:var(--hub-muted)]">{s.done}/{s.total}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[color:var(--hub-soft)]">
                    <div className={cn('h-full rounded-full transition-all', s.rate === 100 ? 'bg-emerald-500' : 'bg-[color:var(--hub-primary)]')} style={{ width: `${s.rate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Recent completions</p>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-[color:var(--hub-muted)]">No completions yet.</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-[20px] bg-[color:var(--hub-soft)] px-4 py-3">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[color:var(--hub-text)]">{e.userName}</p>
                    <p className="truncate text-xs text-[color:var(--hub-muted)]">{e.courseTitle}</p>
                  </div>
                  <p className="shrink-0 text-xs text-[color:var(--hub-muted)]">{formatHubDateTime(e.completedAt!)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overdue section */}
      {overdueEnrollments.length > 0 ? (
        <div className="rounded-[32px] border border-red-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-red-600">Overdue — action required</p>
          <div className="space-y-2">
            {overdueEnrollments.slice(0, 8).map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 rounded-[20px] bg-red-50 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[color:var(--hub-text)]">{e.userName}</p>
                  <p className="truncate text-xs text-[color:var(--hub-muted)]">{e.courseTitle}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-red-600">Due {e.deadlineAt ? formatHubDateTime(e.deadlineAt) : ''}</p>
                    <p className="text-xs text-[color:var(--hub-muted)]">{e.completionPercent}% done</p>
                  </div>
                  <button type="button" onClick={() => navigate(`/org/${orgId}/learners/${e.userId}`)} className="rounded-full border border-[color:var(--hub-border)] px-3 py-1 text-xs font-semibold text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Leaderboard */}
      {leaderboard.length > 0 ? (
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Learner Leaderboard</p>
          </div>
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div key={entry.userId} className="flex items-center gap-4 rounded-[20px] bg-[color:var(--hub-soft)] px-4 py-3">
                <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold', i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-[color:var(--hub-border)] text-[color:var(--hub-muted)]')}>
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[color:var(--hub-text)]">{entry.name}</p>
                  <p className="text-xs text-[color:var(--hub-muted)]">{entry.completedCourses} course{entry.completedCourses !== 1 ? 's' : ''} completed</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-amber-600">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {entry.points.toLocaleString()} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Manage courses', sub: `${courses.length} total`, icon: BookOpen, to: `/org/${orgId}/courses` },
          { label: 'Learning paths', sub: `${paths.length} configured`, icon: Route, to: `/org/${orgId}/paths` },
          { label: 'View reports', sub: 'Completion & compliance', icon: Award, to: `/org/${orgId}/reports` },
        ].map(({ label, sub, icon: Icon, to }) => (
          <button key={to} type="button" onClick={() => navigate(to)} className="flex items-center gap-4 rounded-[28px] border border-[color:var(--hub-border)] bg-white px-5 py-4 text-left shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:bg-[color:var(--hub-soft)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--hub-soft)] text-[color:var(--hub-primary)]"><Icon className="h-5 w-5" /></div>
            <div><p className="text-sm font-semibold text-[color:var(--hub-text)]">{label}</p><p className="text-xs text-[color:var(--hub-muted)]">{sub}</p></div>
          </button>
        ))}
      </div>
    </div>
  );
};
