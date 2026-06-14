import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ClipboardList, Download } from 'lucide-react';
import { cn, formatHubDateTime } from '../../lib/utils';

const PAGE_SIZE = 50;
import { useOrgHubStore } from '../../store/orgHub';
import { AuditAction } from '../../data/orgHub';

const ACTION_LABELS: Record<AuditAction, string> = {
  enroll: 'Enrolled learner',
  unenroll: 'Unenrolled learner',
  invite: 'Invited member',
  remove_member: 'Removed member',
  publish_course: 'Published course',
  create_course: 'Created course',
  delete_course: 'Deleted course',
  create_team: 'Created team',
  delete_team: 'Deleted team',
  update_org: 'Updated org settings',
  create_path: 'Created learning path',
  enroll_path: 'Enrolled in learning path',
};

const ACTION_COLORS: Record<AuditAction, string> = {
  enroll: 'bg-blue-50 text-blue-700',
  unenroll: 'bg-red-50 text-red-700',
  invite: 'bg-emerald-50 text-emerald-700',
  remove_member: 'bg-red-50 text-red-700',
  publish_course: 'bg-purple-50 text-purple-700',
  create_course: 'bg-purple-50 text-purple-700',
  delete_course: 'bg-red-50 text-red-700',
  create_team: 'bg-emerald-50 text-emerald-700',
  delete_team: 'bg-red-50 text-red-700',
  update_org: 'bg-amber-50 text-amber-700',
  create_path: 'bg-blue-50 text-blue-700',
  enroll_path: 'bg-blue-50 text-blue-700',
};

export const OrgAuditPage: React.FC = () => {
  const { orgId = '' } = useParams();
  const { auditEvents, isHydrated, isSyncing, loadOrgHub } = useOrgHubStore();
  const [filterAction, setFilterAction] = useState<AuditAction | 'all'>('all');
  const [page, setPage] = useState(0);

  useEffect(() => { if (orgId) void loadOrgHub(orgId); }, [orgId, loadOrgHub]);

  const filtered = useMemo(() => {
    if (filterAction === 'all') return auditEvents;
    return auditEvents.filter((e) => e.action === filterAction);
  }, [auditEvents, filterAction]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [filtered]);
  const paged = useMemo(() => sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [sorted, page]);
  useEffect(() => { setPage(0); }, [filterAction]);

  if (!isHydrated || isSyncing) return <div className="h-96 animate-pulse rounded-[32px] bg-[color:var(--hub-soft)]" />;

  const exportCsv = () => {
    const csv = ['Date,Actor,Action,Target'].concat(
      sorted.map((e) => `"${e.createdAt}","${e.actorName}","${ACTION_LABELS[e.action]}","${e.targetName}"`),
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'audit-log.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--hub-text)]">Audit Log</h1>
          <p className="mt-1 text-sm text-[color:var(--hub-muted)]">All admin actions in your organisation.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--hub-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]"
        >
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterAction('all')}
          className={cn('rounded-full px-3 py-1.5 text-xs font-semibold transition-colors', filterAction === 'all' ? 'bg-[color:var(--hub-primary)] text-white' : 'border border-[color:var(--hub-border)] bg-white text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]')}
        >
          All actions
        </button>
        {(['invite', 'enroll', 'publish_course', 'create_course', 'create_team', 'update_org'] as AuditAction[]).map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => setFilterAction(action)}
            className={cn('rounded-full px-3 py-1.5 text-xs font-semibold transition-colors', filterAction === action ? 'bg-[color:var(--hub-primary)] text-white' : 'border border-[color:var(--hub-border)] bg-white text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]')}
          >
            {ACTION_LABELS[action]}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50">
            <ClipboardList className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-[color:var(--hub-text)]">{sorted.length}</p>
            <p className="text-xs font-semibold text-[color:var(--hub-muted)]">events{filterAction !== 'all' ? ' (filtered)' : ''}</p>
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.05)] overflow-hidden">
        {sorted.length === 0 ? (
          <div className="p-12 text-center text-sm text-[color:var(--hub-muted)]">No audit events found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--hub-border)] bg-[color:var(--hub-soft)]">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--hub-muted)]">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--hub-muted)]">Actor</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--hub-muted)]">Action</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--hub-muted)]">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--hub-border)]">
              {paged.map((event) => (
                <tr key={event.id} className="hover:bg-[color:var(--hub-soft)]">
                  <td className="whitespace-nowrap px-6 py-4 text-xs text-[color:var(--hub-muted)]">{formatHubDateTime(event.createdAt)}</td>
                  <td className="px-6 py-4 font-medium text-[color:var(--hub-text)]">{event.actorName}</td>
                  <td className="px-6 py-4">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', ACTION_COLORS[event.action])}>
                      {ACTION_LABELS[event.action]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[color:var(--hub-muted)]">{event.targetName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {sorted.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-[color:var(--hub-border)] px-6 py-3">
            <p className="text-xs text-[color:var(--hub-muted)]">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
            </p>
            <div className="flex gap-2">
              <button type="button" aria-label="Previous page" onClick={() => setPage((p) => p - 1)} disabled={page === 0} className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--hub-border)] text-[color:var(--hub-muted)] hover:bg-[color:var(--hub-soft)] disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" aria-label="Next page" onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * PAGE_SIZE >= sorted.length} className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--hub-border)] text-[color:var(--hub-muted)] hover:bg-[color:var(--hub-soft)] disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
