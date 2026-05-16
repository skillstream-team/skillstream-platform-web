import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Award, BookOpen, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import { useOrgHubStore } from '../../store/orgHub';
import { formatHubDateTime } from '../../lib/utils';

export const OrgLearnerProfilePage: React.FC = () => {
  const { orgId = '', userId = '' } = useParams();
  const navigate = useNavigate();
  const { members, teams, courses, enrollments, isHydrated, isSyncing, loadOrgHub } = useOrgHubStore();

  useEffect(() => { if (orgId) void loadOrgHub(orgId); }, [orgId, loadOrgHub]);

  const member = members.find((m) => m.userId === userId);
  const memberEnrollments = useMemo(() => enrollments.filter((e) => e.userId === userId), [enrollments, userId]);
  const memberTeams = useMemo(() => teams.filter((t) => t.memberIds.includes(userId)), [teams, userId]);
  const completed = useMemo(() => memberEnrollments.filter((e) => e.completedAt), [memberEnrollments]);
  const mandatory = useMemo(() => memberEnrollments.filter((e) => e.isMandatory), [memberEnrollments]);
  const mandatoryComplete = mandatory.filter((e) => e.completedAt);
  const overdue = memberEnrollments.filter((e) => !e.completedAt && e.deadlineAt && new Date(e.deadlineAt) < new Date());
  const complianceRate = mandatory.length > 0 ? Math.round((mandatoryComplete.length / mandatory.length) * 100) : null;
  const avgCompletion = memberEnrollments.length > 0 ? Math.round(memberEnrollments.reduce((s, e) => s + e.completionPercent, 0) / memberEnrollments.length) : 0;

  const activityTimeline = useMemo(() => {
    const events: { date: string; label: string; type: 'enrolled' | 'completed' }[] = [];
    memberEnrollments.forEach((e) => {
      events.push({ date: e.enrolledAt, label: `Enrolled in ${e.courseTitle}`, type: 'enrolled' });
      if (e.completedAt) events.push({ date: e.completedAt, label: `Completed ${e.courseTitle}`, type: 'completed' });
    });
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [memberEnrollments]);

  const skillsEarned = useMemo(() => {
    const skillSet = new Set<string>();
    completed.forEach((e) => {
      const course = courses.find((c) => c.id === e.courseId);
      course?.skills?.forEach((s) => skillSet.add(s));
    });
    return Array.from(skillSet);
  }, [completed, courses]);

  if (!isHydrated || isSyncing) return <div className="h-96 animate-pulse rounded-[32px] bg-[color:var(--hub-soft)]" />;
  if (!member) return <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-12 text-center text-sm text-[color:var(--hub-muted)]">Learner not found.</div>;

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate(`/org/${orgId}/learners`)} className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--hub-muted)] hover:text-[color:var(--hub-text)]">
        <ArrowLeft className="h-4 w-4" /> Back to learners
      </button>

      {/* Profile header */}
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[color:var(--hub-primary)] text-xl font-bold text-white">
            {member.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--hub-text)]">{member.name}</h2>
            <p className="text-sm text-[color:var(--hub-muted)]">{member.email}</p>
            {(member.jobTitle || member.department) ? (
              <p className="mt-0.5 text-sm text-[color:var(--hub-muted)]">{[member.jobTitle, member.department].filter(Boolean).join(' · ')}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-[color:var(--hub-soft)] px-2.5 py-0.5 text-xs font-semibold capitalize text-[color:var(--hub-muted)]">{member.orgRole}</span>
              {memberTeams.map((t) => <span key={t.id} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">{t.name}</span>)}
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-[color:var(--hub-muted)]">Joined {formatHubDateTime(member.joinedAt)}</p>
      </section>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Courses enrolled', value: memberEnrollments.length, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
          { label: 'Completed', value: completed.length, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Avg. progress', value: `${avgCompletion}%`, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Compliance rate', value: complianceRate !== null ? `${complianceRate}%` : '—', icon: ShieldCheck, color: overdue.length > 0 ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${color}`}><Icon className="h-5 w-5" /></div>
            <p className="mt-3 text-2xl font-semibold text-[color:var(--hub-text)]">{value}</p>
            <p className="mt-0.5 text-xs font-semibold text-[color:var(--hub-muted)]">{label}</p>
          </div>
        ))}
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 ? (
        <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {overdue.length} overdue course{overdue.length !== 1 ? 's' : ''}: {overdue.map((e) => e.courseTitle).join(', ')}
        </div>
      ) : null}

      {/* Courses */}
      <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Enrolled Courses</p>
        {memberEnrollments.length === 0 ? (
          <p className="py-6 text-center text-sm text-[color:var(--hub-muted)]">Not enrolled in any courses yet.</p>
        ) : (
          <div className="divide-y divide-[color:var(--hub-border)]">
            {memberEnrollments.map((enroll) => {
              const course = courses.find((c) => c.id === enroll.courseId);
              const isOverdue = !enroll.completedAt && enroll.deadlineAt && new Date(enroll.deadlineAt) < new Date();
              return (
                <div key={enroll.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[color:var(--hub-text)]">{enroll.courseTitle}</p>
                      {enroll.isMandatory ? <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">Required</span> : null}
                    </div>
                    {course?.category ? <p className="mt-0.5 text-xs capitalize text-[color:var(--hub-muted)]">{course.category.replace('-', ' ')}</p> : null}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 rounded-full bg-[color:var(--hub-soft)]">
                        <div className={`h-full rounded-full transition-all ${enroll.completedAt ? 'bg-emerald-500' : isOverdue ? 'bg-red-400' : 'bg-[color:var(--hub-primary)]'}`} style={{ width: `${enroll.completionPercent}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-[color:var(--hub-muted)]">{enroll.completionPercent}%</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {enroll.completedAt ? (
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><Award className="h-3.5 w-3.5" /> Completed</div>
                    ) : enroll.deadlineAt ? (
                      <p className={`text-xs font-semibold ${isOverdue ? 'text-red-600' : 'text-[color:var(--hub-muted)]'}`}>Due {formatHubDateTime(enroll.deadlineAt)}</p>
                    ) : (
                      <p className="text-xs text-[color:var(--hub-muted)]">In progress</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Certificates */}
      {completed.length > 0 ? (
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Certificates Earned</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {completed.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3">
                <Award className="h-5 w-5 shrink-0 text-amber-600" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[color:var(--hub-text)]">{e.courseTitle}</p>
                  <p className="text-xs text-amber-700">Completed {formatHubDateTime(e.completedAt!)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Skills earned */}
      {skillsEarned.length > 0 ? (
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Skills Earned</p>
          <div className="flex flex-wrap gap-2">
            {skillsEarned.map((skill) => (
              <span key={skill} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{skill}</span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Activity timeline */}
      {activityTimeline.length > 0 ? (
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Recent Activity</p>
          <div className="space-y-3">
            {activityTimeline.map((event, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${event.type === 'completed' ? 'bg-emerald-500' : 'bg-[color:var(--hub-primary)]'}`} />
                <div>
                  <p className="text-sm text-[color:var(--hub-text)]">{event.label}</p>
                  <p className="text-xs text-[color:var(--hub-muted)]">{formatHubDateTime(event.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
