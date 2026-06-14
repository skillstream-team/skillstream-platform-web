import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, ShieldCheck, Star } from 'lucide-react';
import { useOrgHubStore } from '../../store/orgHub';
import { cn, formatHubDateTime } from '../../lib/utils';

const PAGE_SIZE = 50;

type StatusFilter = 'all' | 'completed' | 'in_progress' | 'overdue';
type Tab = 'enrollments' | 'compliance' | 'quiz' | 'ratings';

export const OrgReportsPage: React.FC = () => {
  const { orgId = '' } = useParams();
  const { org, courses, enrollments, teams, members, ratings, quizStats, isHydrated, isSyncing, loadOrgHub } = useOrgHubStore();

  const [tab, setTab] = useState<Tab>('enrollments');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [filterMandatory, setFilterMandatory] = useState<'all' | 'mandatory' | 'optional'>('all');
  const [enrollPage, setEnrollPage] = useState(0);

  useEffect(() => {
    if (orgId) void loadOrgHub(orgId);
  }, [orgId, loadOrgHub]);

  useEffect(() => { setEnrollPage(0); }, [filterCourse, filterTeam, filterStatus, filterMandatory]);

  const filtered = useMemo(() => {
    const teamMemberIds = filterTeam ? (teams.find((t) => t.id === filterTeam)?.memberIds ?? []) : null;
    let rows = enrollments;
    if (filterCourse) rows = rows.filter((e) => e.courseId === filterCourse);
    if (teamMemberIds) rows = rows.filter((e) => teamMemberIds.includes(e.userId));
    if (filterMandatory === 'mandatory') rows = rows.filter((e) => e.isMandatory);
    if (filterMandatory === 'optional') rows = rows.filter((e) => !e.isMandatory);
    if (filterStatus === 'completed') rows = rows.filter((e) => Boolean(e.completedAt));
    if (filterStatus === 'in_progress') rows = rows.filter((e) => !e.completedAt && (!e.deadlineAt || new Date(e.deadlineAt) >= new Date()));
    if (filterStatus === 'overdue') rows = rows.filter((e) => !e.completedAt && e.deadlineAt && new Date(e.deadlineAt) < new Date());
    return rows;
  }, [enrollments, filterCourse, filterTeam, teams, filterStatus, filterMandatory]);

  const mandatoryEnrollments = useMemo(() => enrollments.filter((e) => e.isMandatory), [enrollments]);
  const mandatoryCompleted = mandatoryEnrollments.filter((e) => e.completedAt);
  const mandatoryOverdue = mandatoryEnrollments.filter((e) => !e.completedAt && e.deadlineAt && new Date(e.deadlineAt) < new Date());
  const complianceRate = mandatoryEnrollments.length > 0 ? Math.round((mandatoryCompleted.length / mandatoryEnrollments.length) * 100) : null;

  // Per-learner compliance for compliance tab
  const learnerCompliance = useMemo(() => {
    const learners = members.filter((m) => m.orgRole === 'learner' || m.orgRole === 'manager');
    return learners.map((m) => {
      const mandatory = enrollments.filter((e) => e.userId === m.userId && e.isMandatory);
      const completed = mandatory.filter((e) => e.completedAt);
      const overdue = mandatory.filter((e) => !e.completedAt && e.deadlineAt && new Date(e.deadlineAt) < new Date());
      const rate = mandatory.length > 0 ? Math.round((completed.length / mandatory.length) * 100) : null;
      const memberTeams = teams.filter((t) => t.memberIds.includes(m.userId));
      return { member: m, mandatory, completed, overdue, rate, memberTeams };
    }).sort((a, b) => {
      if (a.overdue.length !== b.overdue.length) return b.overdue.length - a.overdue.length;
      return (a.rate ?? 101) - (b.rate ?? 101);
    });
  }, [members, enrollments, teams]);

  // Per-team compliance
  const teamCompliance = useMemo(() => teams.map((team) => {
    const mandatory = enrollments.filter((e) => team.memberIds.includes(e.userId) && e.isMandatory);
    const completed = mandatory.filter((e) => e.completedAt);
    const overdue = mandatory.filter((e) => !e.completedAt && e.deadlineAt && new Date(e.deadlineAt) < new Date());
    const rate = mandatory.length > 0 ? Math.round((completed.length / mandatory.length) * 100) : null;
    return { team, mandatory, completed, overdue, rate };
  }), [teams, enrollments]);

  const overallCompletionRate = enrollments.length > 0 ? Math.round((enrollments.filter((e) => e.completedAt).length / enrollments.length) * 100) : 0;
  const overdueCount = enrollments.filter((e) => !e.completedAt && e.deadlineAt && new Date(e.deadlineAt) < new Date()).length;

  const handleExport = () => {
    const headers = ['Learner', 'Email', 'Course', 'Mandatory', 'Enrolled', 'Deadline', 'Progress', 'Status'];
    const rows = filtered.map((e) => [
      e.userName, e.userEmail, e.courseTitle,
      e.isMandatory ? 'Yes' : 'No',
      e.enrolledAt, e.deadlineAt ?? '',
      `${e.completionPercent}%`,
      e.completedAt ? 'Completed' : (!e.completedAt && e.deadlineAt && new Date(e.deadlineAt) < new Date()) ? 'Overdue' : 'In progress',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${org?.slug ?? 'org'}-report.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!isHydrated || isSyncing) {
    return <div className="h-64 animate-pulse rounded-[32px] bg-[color:var(--hub-soft)]" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">{org?.name}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">Reports</h2>
          </div>
          <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-border)] px-5 py-2.5 text-sm font-semibold text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </section>

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total enrollments', value: enrollments.length.toString(), sub: `${courses.length} courses`, highlight: false },
          { label: 'Overall completion', value: `${overallCompletionRate}%`, sub: `${enrollments.filter((e) => e.completedAt).length} completed`, highlight: false },
          { label: 'Compliance rate', value: complianceRate !== null ? `${complianceRate}%` : '—', sub: complianceRate !== null ? `${mandatoryCompleted.length}/${mandatoryEnrollments.length} required` : 'No mandatory courses', highlight: complianceRate !== null && complianceRate < 80 },
          { label: 'Overdue', value: overdueCount.toString(), sub: `${mandatoryOverdue.length} mandatory overdue`, highlight: overdueCount > 0 },
        ].map(({ label, value, sub, highlight }) => (
          <div key={label} className={cn('rounded-[24px] border p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]', highlight ? 'border-red-200 bg-red-50' : 'border-[color:var(--hub-border)] bg-white')}>
            <p className={cn('text-2xl font-semibold', highlight ? 'text-red-600' : 'text-[color:var(--hub-text)]')}>{value}</p>
            <p className="mt-0.5 text-sm font-semibold text-[color:var(--hub-muted)]">{label}</p>
            <p className="mt-0.5 text-xs text-[color:var(--hub-muted)]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-[color:var(--hub-soft)] p-1 w-fit">
        {([['enrollments', 'Enrollments'], ['compliance', 'Compliance'], ['quiz', 'Quiz Analytics'], ['ratings', 'Ratings']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={cn('rounded-xl px-4 py-2 text-sm font-semibold transition', tab === t ? 'bg-white shadow-sm text-[color:var(--hub-text)]' : 'text-[color:var(--hub-muted)] hover:text-[color:var(--hub-text)]')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'quiz' ? (
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <p className="border-b border-[color:var(--hub-border)] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Quiz performance by lesson</p>
          {quizStats.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold text-[color:var(--hub-text)]">No quiz data yet</p>
              <p className="mt-1 text-sm text-[color:var(--hub-muted)]">Quiz analytics will appear once learners complete quiz lessons.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--hub-border)] text-left">
                    {['Quiz', 'Course', 'Attempts', 'Pass rate', 'Avg. score'].map((h) => (
                      <th key={h} className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--hub-border)]">
                  {quizStats.map((qs) => (
                    <tr key={qs.lessonId} className="hover:bg-[color:var(--hub-soft)]">
                      <td className="px-6 py-4 font-semibold text-[color:var(--hub-text)]">{qs.lessonTitle}</td>
                      <td className="px-6 py-4 text-[color:var(--hub-muted)]">{qs.courseTitle}</td>
                      <td className="px-6 py-4 text-[color:var(--hub-text)]">{qs.totalAttempts}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-[color:var(--hub-soft)]">
                            <div className={cn('h-full rounded-full', qs.passRate >= 80 ? 'bg-emerald-500' : qs.passRate >= 50 ? 'bg-amber-400' : 'bg-red-400')} style={{ width: `${qs.passRate}%` }} />
                          </div>
                          <span className={cn('text-xs font-semibold', qs.passRate >= 80 ? 'text-emerald-600' : qs.passRate >= 50 ? 'text-amber-600' : 'text-red-600')}>{qs.passRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-[color:var(--hub-text)]">{qs.avgScore}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : tab === 'ratings' ? (
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <p className="border-b border-[color:var(--hub-border)] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Course ratings & feedback</p>
          {ratings.length === 0 ? (
            <div className="p-12 text-center">
              <Star className="mx-auto h-10 w-10 text-[color:var(--hub-muted)]" />
              <p className="mt-4 text-sm font-semibold text-[color:var(--hub-text)]">No ratings yet</p>
              <p className="mt-1 text-sm text-[color:var(--hub-muted)]">Ratings appear after learners complete a course.</p>
            </div>
          ) : (
            <div className="divide-y divide-[color:var(--hub-border)]">
              {ratings.map((r) => {
                const course = courses.find((c) => c.id === r.courseId);
                return (
                  <div key={r.id} className="px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--hub-text)]">{r.learnerName}</p>
                        <p className="text-xs text-[color:var(--hub-muted)]">{course?.title ?? r.courseId}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn('h-4 w-4', i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-[color:var(--hub-border)]')} />
                        ))}
                        <span className="ml-1 text-xs font-semibold text-[color:var(--hub-muted)]">{formatHubDateTime(r.createdAt)}</span>
                      </div>
                    </div>
                    {r.comment ? <p className="mt-2 text-sm text-[color:var(--hub-muted)]">"{r.comment}"</p> : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : tab === 'enrollments' ? (
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 border-b border-[color:var(--hub-border)] px-6 py-4">
            <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-2 text-sm outline-none">
              <option value="">All courses</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            {teams.length > 0 ? (
              <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)} className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-2 text-sm outline-none">
                <option value="">All teams</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            ) : null}
            <select value={filterMandatory} onChange={(e) => setFilterMandatory(e.target.value as typeof filterMandatory)} className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-2 text-sm outline-none">
              <option value="all">All types</option>
              <option value="mandatory">Mandatory only</option>
              <option value="optional">Optional only</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as StatusFilter)} className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-2 text-sm outline-none">
              <option value="all">All statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In progress</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-[color:var(--hub-border)] text-left">
                  {['Learner', 'Course', 'Type', 'Progress', 'Deadline', 'Status'].map((h) => (
                    <th key={h} className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--hub-border)]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-[color:var(--hub-muted)]">No records match your filters.</td></tr>
                ) : filtered.slice(enrollPage * PAGE_SIZE, (enrollPage + 1) * PAGE_SIZE).map((e) => {
                  const isOverdue = !e.completedAt && e.deadlineAt && new Date(e.deadlineAt) < new Date();
                  return (
                    <tr key={e.id} className="hover:bg-[color:var(--hub-soft)]">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[color:var(--hub-text)]">{e.userName}</p>
                        <p className="text-xs text-[color:var(--hub-muted)]">{e.userEmail}</p>
                      </td>
                      <td className="px-6 py-4 text-[color:var(--hub-text)]">{e.courseTitle}</td>
                      <td className="px-6 py-4">
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', e.isMandatory ? 'bg-orange-100 text-orange-700' : 'bg-[color:var(--hub-soft)] text-[color:var(--hub-muted)]')}>
                          {e.isMandatory ? 'Required' : 'Optional'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-[color:var(--hub-soft)]">
                            <div className={cn('h-full rounded-full', e.completedAt ? 'bg-emerald-500' : isOverdue ? 'bg-red-400' : 'bg-[color:var(--hub-primary)]')} style={{ width: `${e.completionPercent}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-[color:var(--hub-text)]">{e.completionPercent}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[color:var(--hub-muted)]">{e.deadlineAt ? formatHubDateTime(e.deadlineAt) : '—'}</td>
                      <td className="px-6 py-4">
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', e.completedAt ? 'bg-emerald-100 text-emerald-700' : isOverdue ? 'bg-red-100 text-red-700' : 'bg-[color:var(--hub-soft)] text-[color:var(--hub-muted)]')}>
                          {e.completedAt ? 'Completed' : isOverdue ? 'Overdue' : 'In progress'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-[color:var(--hub-border)] px-6 py-3">
              <p className="text-xs text-[color:var(--hub-muted)]">
                {enrollPage * PAGE_SIZE + 1}–{Math.min((enrollPage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <button type="button" aria-label="Previous page" onClick={() => setEnrollPage((p) => p - 1)} disabled={enrollPage === 0} className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--hub-border)] text-[color:var(--hub-muted)] hover:bg-[color:var(--hub-soft)] disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Next page" onClick={() => setEnrollPage((p) => p + 1)} disabled={(enrollPage + 1) * PAGE_SIZE >= filtered.length} className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--hub-border)] text-[color:var(--hub-muted)] hover:bg-[color:var(--hub-soft)] disabled:opacity-40">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Compliance tab */
        <div className="space-y-6">
          {mandatoryEnrollments.length === 0 ? (
            <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-12 text-center shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
              <ShieldCheck className="mx-auto h-10 w-10 text-[color:var(--hub-muted)]" />
              <p className="mt-4 text-sm font-semibold text-[color:var(--hub-text)]">No mandatory courses assigned</p>
              <p className="mt-1 text-sm text-[color:var(--hub-muted)]">Enrol learners with "Mark as mandatory" to track compliance here.</p>
            </div>
          ) : (
            <>
              {/* Per-team compliance */}
              {teamCompliance.filter((tc) => tc.mandatory.length > 0).length > 0 ? (
                <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
                  <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">By team</p>
                  <div className="space-y-3">
                    {teamCompliance.filter((tc) => tc.mandatory.length > 0).map(({ team, completed, mandatory, overdue, rate }) => (
                      <div key={team.id} className="flex items-center gap-4">
                        <p className="w-40 shrink-0 text-sm font-semibold text-[color:var(--hub-text)] truncate">{team.name}</p>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs text-[color:var(--hub-muted)] mb-1">
                            <span>{completed.length}/{mandatory.length} required complete</span>
                            {overdue.length > 0 ? <span className="font-semibold text-red-600">{overdue.length} overdue</span> : null}
                          </div>
                          <div className="h-2 rounded-full bg-[color:var(--hub-soft)]">
                            <div className={cn('h-full rounded-full transition-all', rate === 100 ? 'bg-emerald-500' : (rate ?? 0) < 50 ? 'bg-red-400' : 'bg-amber-400')} style={{ width: `${rate ?? 0}%` }} />
                          </div>
                        </div>
                        <span className={cn('w-12 shrink-0 text-right text-sm font-semibold', rate === 100 ? 'text-emerald-600' : (rate ?? 0) < 50 ? 'text-red-600' : 'text-amber-600')}>{rate !== null ? `${rate}%` : '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Per-learner compliance table */}
              <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
                <p className="border-b border-[color:var(--hub-border)] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">By learner</p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead>
                      <tr className="border-b border-[color:var(--hub-border)] text-left">
                        {['Learner', 'Teams', 'Required courses', 'Overdue', 'Compliance'].map((h) => (
                          <th key={h} className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--hub-border)]">
                      {learnerCompliance.filter((lc) => lc.mandatory.length > 0).map(({ member, mandatory, completed, overdue, rate, memberTeams }) => (
                        <tr key={member.userId} className={cn('hover:bg-[color:var(--hub-soft)]', overdue.length > 0 && 'bg-red-50/40')}>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-[color:var(--hub-text)]">{member.name}</p>
                            <p className="text-xs text-[color:var(--hub-muted)]">{member.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {memberTeams.length > 0 ? memberTeams.map((t) => (
                                <span key={t.id} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{t.name}</span>
                              )) : <span className="text-xs text-[color:var(--hub-muted)]">—</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-[color:var(--hub-text)]">{completed.length}/{mandatory.length}</p>
                          </td>
                          <td className="px-6 py-4">
                            {overdue.length > 0 ? (
                              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">{overdue.length} overdue</span>
                            ) : <span className="text-xs text-[color:var(--hub-muted)]">—</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 rounded-full bg-[color:var(--hub-soft)]">
                                <div className={cn('h-full rounded-full', rate === 100 ? 'bg-emerald-500' : overdue.length > 0 ? 'bg-red-400' : 'bg-amber-400')} style={{ width: `${rate ?? 0}%` }} />
                              </div>
                              <span className={cn('text-xs font-semibold', rate === 100 ? 'text-emerald-600' : overdue.length > 0 ? 'text-red-600' : 'text-[color:var(--hub-muted)]')}>{rate !== null ? `${rate}%` : '—'}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
