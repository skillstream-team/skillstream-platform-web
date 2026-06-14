import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Route, Search, Trash2, Upload, Users } from 'lucide-react';
import { ActionModal } from '../../components/common/ActionModal';
import { useNotifications } from '../../components/notifications/NotificationToast';
import { cn, parseCsv } from '../../lib/utils';
import { useOrgHubStore } from '../../store/orgHub';
import { OrgRole } from '../../data/orgHub';

type Tab = 'learners' | 'teams';

interface CsvRow { name: string; email: string; orgRole: OrgRole; jobTitle?: string; department?: string }

const PAGE_SIZE = 50;

const parseCSV = (text: string): CsvRow[] => {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.toLowerCase());
  return rows.slice(1).map((values) => {
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    const role = (['admin', 'instructor', 'manager', 'learner'] as OrgRole[]).includes(row.role as OrgRole) ? (row.role as OrgRole) : 'learner';
    return { name: row.name ?? '', email: row.email ?? '', orgRole: role, jobTitle: row.jobtitle || row['job title'] || undefined, department: row.department || undefined };
  }).filter((r) => r.email.includes('@'));
};

export const OrgLearnersPage: React.FC = () => {
  const { orgId = '' } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const {
    org, members, courses, enrollments, teams, paths,
    isHydrated, isSyncing, loadOrgHub,
    inviteMember, removeMember, bulkInviteMembers, enrollLearners, enrollTeam, enrollLearnersInPath,
    createTeam, renameTeam, deleteTeam, addTeamMember, removeTeamMember,
    updateMemberRole,
  } = useOrgHubStore();

  const [tab, setTab] = useState<Tab>('learners');
  const [searchQuery, setSearchQuery] = useState('');

  // Invite
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('learner');
  const [inviteError, setInviteError] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // CSV bulk import
  const [showCSV, setShowCSV] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Enrol in course
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollCourseId, setEnrollCourseId] = useState('');
  const [enrollUserIds, setEnrollUserIds] = useState<string[]>([]);
  const [enrollDeadline, setEnrollDeadline] = useState('');
  const [enrollMandatory, setEnrollMandatory] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  // Enrol in path
  const [showPathEnroll, setShowPathEnroll] = useState(false);
  const [pathEnrollId, setPathEnrollId] = useState('');
  const [pathEnrollUserIds, setPathEnrollUserIds] = useState<string[]>([]);
  const [isPathEnrolling, setIsPathEnrolling] = useState(false);
  const [pathEnrollError, setPathEnrollError] = useState('');

  // Teams
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [renamingTeamId, setRenamingTeamId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [managingTeamId, setManagingTeamId] = useState<string | null>(null);
  const [enrollingTeamId, setEnrollingTeamId] = useState<string | null>(null);
  const [teamEnrollCourseId, setTeamEnrollCourseId] = useState('');
  const [teamEnrollDeadline, setTeamEnrollDeadline] = useState('');
  const [teamEnrollMandatory, setTeamEnrollMandatory] = useState(false);
  const [isTeamEnrolling, setIsTeamEnrolling] = useState(false);
  const [teamEnrollError, setTeamEnrollError] = useState('');

  const [pendingConfirm, setPendingConfirm] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);
  const [learnerPage, setLearnerPage] = useState(0);

  useEffect(() => { if (orgId) void loadOrgHub(orgId); }, [orgId, loadOrgHub]);

  const learners = useMemo(() => members.filter((m) => m.orgRole === 'learner' || m.orgRole === 'manager'), [members]);

  const filteredLearners = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return learners;
    return learners.filter((m) => `${m.name} ${m.email} ${m.orgRole}`.toLowerCase().includes(q));
  }, [learners, searchQuery]);

  const pagedLearners = useMemo(
    () => filteredLearners.slice(learnerPage * PAGE_SIZE, (learnerPage + 1) * PAGE_SIZE),
    [filteredLearners, learnerPage],
  );

  useEffect(() => { setLearnerPage(0); }, [searchQuery, tab]);

  const getEnrollmentCount = (userId: string) => enrollments.filter((e) => e.userId === userId).length;
  const getCompletionAvg = (userId: string) => {
    const ue = enrollments.filter((e) => e.userId === userId);
    if (ue.length === 0) return 0;
    return Math.round(ue.reduce((s, e) => s + e.completionPercent, 0) / ue.length);
  };

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteEmail.trim()) { setInviteError('Email is required.'); return; }
    try {
      setIsInviting(true); setInviteError('');
      const result = await inviteMember(inviteEmail.trim().toLowerCase(), inviteRole);
      if (result === 'pending') {
        addNotification({ type: 'success', title: 'Invite queued', message: `${inviteEmail} will be added automatically when they sign up.`, duration: 4000 });
      } else {
        addNotification({ type: 'success', title: 'Member added', message: `${inviteEmail} has been added.`, duration: 2000 });
      }
      setShowInvite(false); setInviteEmail('');
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'Could not add member.');
    } finally { setIsInviting(false); }
  };

  const handleRemove = (userId: string, name: string) => {
    setPendingConfirm({
      title: 'Remove member',
      description: `Remove ${name} from the organisation? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await removeMember(userId);
          addNotification({ type: 'success', title: 'Member removed', message: '', duration: 1800 });
        } catch (error) {
          addNotification({ type: 'error', title: 'Error', message: error instanceof Error ? error.message : 'Could not remove.', duration: 2500 });
        }
      },
    });
  };

  const handleRoleChange = async (userId: string, newRole: OrgRole) => {
    try {
      await updateMemberRole(userId, newRole);
      addNotification({ type: 'success', title: 'Role updated', message: '', duration: 1500 });
    } catch {
      addNotification({ type: 'error', title: 'Error', message: 'Could not update role.', duration: 2000 });
    }
  };

  // CSV import
  const handleFileLoad = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      setCsvRows(parseCSV(text));
    };
    reader.readAsText(file);
  }, []);

  const handleCSVPaste = (text: string) => {
    setCsvText(text);
    setCsvRows(parseCSV(text));
  };

  const handleImport = async () => {
    if (csvRows.length === 0) return;
    setIsImporting(true);
    try {
      const result = await bulkInviteMembers(csvRows);
      setImportResult(result);
      addNotification({ type: 'success', title: 'Import complete', message: `${result.ok} added, ${result.skipped} skipped.`, duration: 3000 });
    } catch {
      addNotification({ type: 'error', title: 'Import failed', message: '', duration: 2500 });
    } finally { setIsImporting(false); }
  };

  const handleEnroll = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!enrollCourseId || enrollUserIds.length === 0) { setEnrollError('Select a course and at least one learner.'); return; }
    try {
      setIsEnrolling(true); setEnrollError('');
      await enrollLearners(enrollCourseId, enrollUserIds, { deadlineAt: enrollDeadline || undefined, isMandatory: enrollMandatory });
      addNotification({ type: 'success', title: 'Enrolled', message: `${enrollUserIds.length} learner${enrollUserIds.length > 1 ? 's' : ''} enrolled.`, duration: 2000 });
      setShowEnroll(false); setEnrollCourseId(''); setEnrollUserIds([]); setEnrollDeadline(''); setEnrollMandatory(false);
    } catch (error) {
      setEnrollError(error instanceof Error ? error.message : 'Could not enrol.');
    } finally { setIsEnrolling(false); }
  };

  const handlePathEnroll = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pathEnrollId || pathEnrollUserIds.length === 0) { setPathEnrollError('Select a path and at least one learner.'); return; }
    try {
      setIsPathEnrolling(true); setPathEnrollError('');
      await enrollLearnersInPath(pathEnrollId, pathEnrollUserIds);
      addNotification({ type: 'success', title: 'Enrolled in path', message: `${pathEnrollUserIds.length} learner${pathEnrollUserIds.length > 1 ? 's' : ''} enrolled in path.`, duration: 2000 });
      setShowPathEnroll(false); setPathEnrollId(''); setPathEnrollUserIds([]);
    } catch (error) {
      setPathEnrollError(error instanceof Error ? error.message : 'Could not enrol.');
    } finally { setIsPathEnrolling(false); }
  };

  const toggleUserId = (id: string) =>
    setEnrollUserIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const togglePathUserId = (id: string) =>
    setPathEnrollUserIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      setIsCreatingTeam(true);
      await createTeam(newTeamName.trim());
      setShowCreateTeam(false); setNewTeamName('');
      addNotification({ type: 'success', title: 'Team created', message: '', duration: 1500 });
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Could not create team.', duration: 2500 });
    } finally { setIsCreatingTeam(false); }
  };

  const handleRenameTeam = async (teamId: string) => {
    if (!renameValue.trim()) return;
    try {
      await renameTeam(teamId, renameValue.trim());
      setRenamingTeamId(null);
      addNotification({ type: 'success', title: 'Renamed', message: '', duration: 1500 });
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Could not rename.', duration: 2500 });
    }
  };

  const handleDeleteTeam = (teamId: string, name: string) => {
    setPendingConfirm({
      title: 'Delete team',
      description: `Delete team "${name}"? Members will not be removed from the organisation.`,
      onConfirm: async () => {
        try {
          await deleteTeam(teamId);
          addNotification({ type: 'success', title: 'Team deleted', message: '', duration: 1500 });
        } catch (err) {
          addNotification({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Could not delete.', duration: 2500 });
        }
      },
    });
  };

  const handleToggleTeamMember = async (teamId: string, userId: string, inTeam: boolean) => {
    try {
      if (inTeam) { await removeTeamMember(teamId, userId); } else { await addTeamMember(teamId, userId); }
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Could not update team.', duration: 2500 });
    }
  };

  const handleTeamEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollingTeamId || !teamEnrollCourseId) { setTeamEnrollError('Select a course.'); return; }
    const team = teams.find((t) => t.id === enrollingTeamId);
    if (!team || team.memberIds.length === 0) { setTeamEnrollError('This team has no members.'); return; }
    try {
      setIsTeamEnrolling(true); setTeamEnrollError('');
      await enrollTeam(enrollingTeamId, teamEnrollCourseId, { deadlineAt: teamEnrollDeadline || undefined, isMandatory: teamEnrollMandatory });
      addNotification({ type: 'success', title: 'Team enrolled', message: `${team.memberIds.length} member${team.memberIds.length !== 1 ? 's' : ''} enrolled.`, duration: 2000 });
      setEnrollingTeamId(null); setTeamEnrollCourseId(''); setTeamEnrollDeadline(''); setTeamEnrollMandatory(false);
    } catch (err) {
      setTeamEnrollError(err instanceof Error ? err.message : 'Could not enrol team.');
    } finally { setIsTeamEnrolling(false); }
  };

  if (!isHydrated || isSyncing) {
    return <div className="h-64 animate-pulse rounded-[32px] bg-[color:var(--hub-soft)]" />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">{org?.name}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">People</h2>
            <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{learners.length} of {org?.seatLimit} seats used · {teams.length} team{teams.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tab === 'learners' ? (
              <>
                <button type="button" onClick={() => { setShowPathEnroll(true); setPathEnrollId(''); setPathEnrollUserIds([]); setPathEnrollError(''); }} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]">
                  <Route className="h-4 w-4" /> Enrol in path
                </button>
                <button type="button" onClick={() => setShowEnroll(true)} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]">
                  Enrol in course
                </button>
                <button type="button" onClick={() => { setShowCSV(true); setCsvText(''); setCsvRows([]); setImportResult(null); }} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]">
                  <Upload className="h-4 w-4" /> Import CSV
                </button>
                <button type="button" onClick={() => setShowInvite(true)} className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-5 py-2.5 text-sm font-semibold text-white">
                  <Plus className="h-4 w-4" /> Add member
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setShowCreateTeam(true)} className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-5 py-2.5 text-sm font-semibold text-white">
                <Plus className="h-4 w-4" /> New team
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-[color:var(--hub-soft)] p-1 w-fit">
        {(['learners', 'teams'] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={cn('rounded-xl px-4 py-2 text-sm font-semibold capitalize transition', tab === t ? 'bg-white shadow-sm text-[color:var(--hub-text)]' : 'text-[color:var(--hub-muted)] hover:text-[color:var(--hub-text)]')}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'learners' ? (
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="border-b border-[color:var(--hub-border)] px-6 py-4">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--hub-muted)]" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search learners" className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-10 py-2.5 text-sm outline-none" />
            </div>
          </div>

          <div className="divide-y divide-[color:var(--hub-border)]">
            {filteredLearners.length === 0 ? (
              <p className="px-6 py-8 text-sm text-[color:var(--hub-muted)]">No learners found.</p>
            ) : pagedLearners.map((member) => {
              const enrollCount = getEnrollmentCount(member.userId);
              const avgCompletion = getCompletionAvg(member.userId);
              const memberTeams = teams.filter((t) => t.memberIds.includes(member.userId));
              return (
                <div key={member.userId} className="flex items-center gap-4 px-6 py-4">
                  <button type="button" onClick={() => navigate(`/org/${orgId}/learners/${member.userId}`)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--hub-primary)] text-sm font-bold text-white hover:opacity-80">
                    {member.name.charAt(0).toUpperCase()}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => navigate(`/org/${orgId}/learners/${member.userId}`)} className="truncate text-sm font-semibold text-[color:var(--hub-text)] hover:text-[color:var(--hub-primary)] text-left">
                        {member.name}
                      </button>
                      {member.orgRole === 'manager' ? (
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">Manager</span>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-[color:var(--hub-muted)]">{member.email}</p>
                    {(member.jobTitle || member.department) ? (
                      <p className="truncate text-xs text-[color:var(--hub-muted)]">{[member.jobTitle, member.department].filter(Boolean).join(' · ')}</p>
                    ) : null}
                    {memberTeams.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {memberTeams.map((t) => <span key={t.id} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{t.name}</span>)}
                      </div>
                    ) : null}
                  </div>
                  <div className="hidden gap-4 text-center sm:flex items-center">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--hub-text)]">{enrollCount}</p>
                      <p className="text-xs text-[color:var(--hub-muted)]">Courses</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--hub-text)]">{avgCompletion}%</p>
                      <p className="text-xs text-[color:var(--hub-muted)]">Progress</p>
                    </div>
                    <select
                      value={member.orgRole}
                      onChange={(e) => void handleRoleChange(member.userId, e.target.value as OrgRole)}
                      className="rounded-xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-2 py-1 text-xs font-semibold text-[color:var(--hub-text)] outline-none"
                    >
                      <option value="learner">Learner</option>
                      <option value="manager">Manager</option>
                      <option value="instructor">Instructor</option>
                    </select>
                  </div>
                  <button type="button" aria-label={`View ${member.name}'s profile`} onClick={() => navigate(`/org/${orgId}/learners/${member.userId}`)} className="hidden rounded-full border border-[color:var(--hub-border)] px-3 py-1 text-xs font-semibold text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)] sm:block">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label={`Remove ${member.name}`} onClick={() => handleRemove(member.userId, member.name)} className="shrink-0 rounded-full p-2 text-[color:var(--hub-muted)] hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
          {filteredLearners.length > PAGE_SIZE ? (
            <div className="flex items-center justify-between border-t border-[color:var(--hub-border)] px-6 py-3">
              <p className="text-xs text-[color:var(--hub-muted)]">
                {learnerPage * PAGE_SIZE + 1}–{Math.min((learnerPage + 1) * PAGE_SIZE, filteredLearners.length)} of {filteredLearners.length} learners
              </p>
              <div className="flex gap-2">
                <button type="button" aria-label="Previous page" onClick={() => setLearnerPage((p) => p - 1)} disabled={learnerPage === 0} className="rounded-full border border-[color:var(--hub-border)] p-1.5 hover:bg-[color:var(--hub-soft)] disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Next page" onClick={() => setLearnerPage((p) => p + 1)} disabled={(learnerPage + 1) * PAGE_SIZE >= filteredLearners.length} className="rounded-full border border-[color:var(--hub-border)] p-1.5 hover:bg-[color:var(--hub-soft)] disabled:opacity-40">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* Teams tab */
        <div className="space-y-4">
          {teams.length === 0 ? (
            <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-12 text-center shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
              <Users className="mx-auto h-10 w-10 text-[color:var(--hub-muted)]" />
              <p className="mt-4 text-sm font-semibold text-[color:var(--hub-text)]">No teams yet</p>
              <p className="mt-1 text-sm text-[color:var(--hub-muted)]">Create teams to group learners and bulk-enrol them in courses.</p>
            </div>
          ) : teams.map((team) => (
            <div key={team.id} className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {renamingTeamId === team.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); void handleRenameTeam(team.id); }} className="flex gap-2">
                      <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="flex-1 rounded-xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-3 py-1.5 text-sm outline-none" />
                      <button type="submit" className="rounded-xl bg-[color:var(--hub-primary)] px-3 py-1.5 text-xs font-semibold text-white">Save</button>
                      <button type="button" onClick={() => setRenamingTeamId(null)} className="rounded-xl border border-[color:var(--hub-border)] px-3 py-1.5 text-xs font-semibold">Cancel</button>
                    </form>
                  ) : (
                    <p className="font-semibold text-[color:var(--hub-text)]">{team.name} <span className="ml-1 text-sm font-normal text-[color:var(--hub-muted)]">({team.memberIds.length} members)</span></p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button type="button" onClick={() => { setEnrollingTeamId(team.id); setTeamEnrollCourseId(''); setTeamEnrollDeadline(''); setTeamEnrollMandatory(false); setTeamEnrollError(''); }} className="rounded-full bg-[color:var(--hub-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
                    Enrol in course
                  </button>
                  <button type="button" onClick={() => { setManagingTeamId(managingTeamId === team.id ? null : team.id); }} className="rounded-full border border-[color:var(--hub-border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]">
                    {managingTeamId === team.id ? 'Done' : 'Members'}
                  </button>
                  <button type="button" onClick={() => { setRenamingTeamId(team.id); setRenameValue(team.name); }} className="rounded-full border border-[color:var(--hub-border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]">Rename</button>
                  <button type="button" aria-label={`Delete team ${team.name}`} onClick={() => handleDeleteTeam(team.id, team.name)} className="rounded-full p-1.5 text-[color:var(--hub-muted)] hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {team.memberIds.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {team.memberIds.map((uid) => {
                    const m = members.find((x) => x.userId === uid);
                    return m ? (
                      <span key={uid} className="flex items-center gap-1.5 rounded-full bg-[color:var(--hub-soft)] pl-1.5 pr-2.5 py-1 text-xs font-semibold text-[color:var(--hub-text)]">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--hub-primary)] text-[10px] font-bold text-white">{m.name.charAt(0)}</span>
                        {m.name}
                      </span>
                    ) : null;
                  })}
                </div>
              ) : <p className="mt-2 text-xs text-[color:var(--hub-muted)]">No members yet.</p>}

              {managingTeamId === team.id ? (
                <div className="mt-4 rounded-2xl border border-[color:var(--hub-border)] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">Add / remove members</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {learners.length === 0 ? <p className="text-sm text-[color:var(--hub-muted)]">No learners available.</p> : learners.map((m) => {
                      const inTeam = team.memberIds.includes(m.userId);
                      return (
                        <label key={m.userId} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-[color:var(--hub-soft)]">
                          <input type="checkbox" checked={inTeam} onChange={() => void handleToggleTeamMember(team.id, m.userId, inTeam)} className="accent-[color:var(--hub-primary)]" />
                          <span className="text-sm text-[color:var(--hub-text)]">{m.name} <span className="text-[color:var(--hub-muted)]">({m.email})</span></span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Invite modal */}
      <ActionModal isOpen={showInvite} title="Add member" description="Add someone to your organisation." onClose={() => { setShowInvite(false); setInviteError(''); setInviteEmail(''); }}>
        <form onSubmit={handleInvite} className="grid gap-4">
          {inviteError ? <p className="text-xs text-[color:var(--edu-danger)]">{inviteError}</p> : null}
          <input value={inviteEmail} onChange={(e) => { setInviteEmail(e.target.value); if (inviteError) setInviteError(''); }} placeholder="Email address" type="email" className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none" />
          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as OrgRole)} className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none">
            <option value="learner">Learner</option>
            <option value="manager">Manager</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" disabled={isInviting} className="rounded-full bg-[color:var(--hub-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60">
            {isInviting ? 'Adding...' : 'Add member'}
          </button>
        </form>
      </ActionModal>

      {/* CSV import modal */}
      <ActionModal isOpen={showCSV} title="Bulk import learners" description="Upload a CSV file or paste CSV text. Required columns: name, email. Optional: role, jobTitle, department." onClose={() => setShowCSV(false)}>
        <div className="grid gap-4">
          <div className="rounded-2xl border-2 border-dashed border-[color:var(--hub-border)] p-4 text-center">
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileLoad} />
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--hub-primary)] hover:underline">
              <Upload className="h-4 w-4" /> Choose CSV file
            </button>
            <p className="mt-1 text-xs text-[color:var(--hub-muted)]">or paste below</p>
          </div>
          <textarea
            value={csvText}
            onChange={(e) => handleCSVPaste(e.target.value)}
            placeholder={'name,email,role,jobTitle,department\nJane Smith,jane@company.com,learner,Developer,Engineering'}
            rows={5}
            className="w-full resize-none rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 font-mono text-xs text-[color:var(--hub-text)] outline-none"
          />
          {csvRows.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold text-[color:var(--hub-muted)]">{csvRows.length} row{csvRows.length !== 1 ? 's' : ''} parsed</p>
              <div className="max-h-36 overflow-y-auto rounded-2xl border border-[color:var(--hub-border)] divide-y divide-[color:var(--hub-border)]">
                {csvRows.slice(0, 10).map((row, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 text-xs">
                    <span className="font-semibold text-[color:var(--hub-text)]">{row.name || '—'}</span>
                    <span className="text-[color:var(--hub-muted)]">{row.email}</span>
                    <span className="ml-auto rounded-full bg-[color:var(--hub-soft)] px-2 py-0.5 capitalize text-[color:var(--hub-muted)]">{row.orgRole}</span>
                  </div>
                ))}
                {csvRows.length > 10 ? <div className="px-3 py-2 text-xs text-[color:var(--hub-muted)]">…and {csvRows.length - 10} more</div> : null}
              </div>
            </div>
          ) : null}
          {importResult ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Import complete: <strong>{importResult.ok}</strong> added, <strong>{importResult.skipped}</strong> skipped.
            </div>
          ) : null}
          <button type="button" onClick={() => void handleImport()} disabled={csvRows.length === 0 || isImporting} className="rounded-full bg-[color:var(--hub-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60">
            {isImporting ? 'Importing...' : `Import ${csvRows.length} member${csvRows.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </ActionModal>

      {/* Enrol in course modal */}
      <ActionModal isOpen={showEnroll} title="Enrol in course" description="Select a course and learners to enrol." onClose={() => { setShowEnroll(false); setEnrollError(''); setEnrollCourseId(''); setEnrollUserIds([]); setEnrollDeadline(''); setEnrollMandatory(false); }}>
        <form onSubmit={handleEnroll} className="grid gap-4">
          {enrollError ? <p className="text-xs text-[color:var(--edu-danger)]">{enrollError}</p> : null}
          <select value={enrollCourseId} onChange={(e) => { setEnrollCourseId(e.target.value); if (enrollError) setEnrollError(''); }} className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none">
            <option value="">Select course</option>
            {courses.filter((c) => c.isPublished).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <div className="max-h-48 overflow-y-auto rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] p-3 space-y-2">
            {learners.length === 0 ? <p className="text-sm text-[color:var(--hub-muted)]">No learners yet.</p> : learners.map((m) => (
              <label key={m.userId} className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={enrollUserIds.includes(m.userId)} onChange={() => toggleUserId(m.userId)} className="accent-[color:var(--hub-primary)]" />
                <span className="text-sm text-[color:var(--hub-text)]">{m.name} <span className="text-[color:var(--hub-muted)]">({m.email})</span></span>
              </label>
            ))}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[color:var(--hub-muted)]">Completion deadline (optional)</label>
            <input value={enrollDeadline} onChange={(e) => setEnrollDeadline(e.target.value)} type="date" className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none" />
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={enrollMandatory} onChange={(e) => setEnrollMandatory(e.target.checked)} className="accent-[color:var(--hub-primary)]" />
            <span className="text-sm text-[color:var(--hub-text)]">Mark as mandatory</span>
          </label>
          <button type="submit" disabled={isEnrolling} className="rounded-full bg-[color:var(--hub-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60">
            {isEnrolling ? 'Enrolling...' : `Enrol ${enrollUserIds.length > 0 ? `${enrollUserIds.length} learner${enrollUserIds.length > 1 ? 's' : ''}` : ''}`}
          </button>
        </form>
      </ActionModal>

      {/* Enrol in path modal */}
      <ActionModal isOpen={showPathEnroll} title="Enrol in learning path" description="Select a path and learners. All courses in the path will be assigned." onClose={() => { setShowPathEnroll(false); setPathEnrollError(''); setPathEnrollId(''); setPathEnrollUserIds([]); }}>
        <form onSubmit={handlePathEnroll} className="grid gap-4">
          {pathEnrollError ? <p className="text-xs text-[color:var(--edu-danger)]">{pathEnrollError}</p> : null}
          <select value={pathEnrollId} onChange={(e) => { setPathEnrollId(e.target.value); if (pathEnrollError) setPathEnrollError(''); }} className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none">
            <option value="">Select learning path</option>
            {paths.filter((p) => p.isPublished).map((p) => <option key={p.id} value={p.id}>{p.title} ({p.courses.length} courses)</option>)}
          </select>
          {pathEnrollId ? (
            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-xs text-blue-700">
              <p className="font-semibold">Courses in this path:</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                {paths.find((p) => p.id === pathEnrollId)?.courses.map((pc) => <li key={pc.courseId}>{pc.courseTitle}</li>)}
              </ul>
            </div>
          ) : null}
          <div className="max-h-48 overflow-y-auto rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] p-3 space-y-2">
            {learners.length === 0 ? <p className="text-sm text-[color:var(--hub-muted)]">No learners yet.</p> : learners.map((m) => (
              <label key={m.userId} className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={pathEnrollUserIds.includes(m.userId)} onChange={() => togglePathUserId(m.userId)} className="accent-[color:var(--hub-primary)]" />
                <span className="text-sm text-[color:var(--hub-text)]">{m.name}</span>
              </label>
            ))}
          </div>
          <button type="submit" disabled={isPathEnrolling || !pathEnrollId || pathEnrollUserIds.length === 0} className="rounded-full bg-[color:var(--hub-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60">
            {isPathEnrolling ? 'Enrolling...' : `Enrol ${pathEnrollUserIds.length > 0 ? `${pathEnrollUserIds.length} learner${pathEnrollUserIds.length > 1 ? 's' : ''}` : ''} in path`}
          </button>
        </form>
      </ActionModal>

      {/* Create team modal */}
      <ActionModal isOpen={showCreateTeam} title="New team" description="Create a team to group learners together." onClose={() => { setShowCreateTeam(false); setNewTeamName(''); }}>
        <form onSubmit={handleCreateTeam} className="grid gap-4">
          <input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Team name (e.g. Engineering, Sales)" required className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none" />
          <button type="submit" disabled={isCreatingTeam} className="rounded-full bg-[color:var(--hub-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60">
            {isCreatingTeam ? 'Creating...' : 'Create team'}
          </button>
        </form>
      </ActionModal>

      {/* Team enrol modal */}
      {enrollingTeamId ? (() => {
        const t = teams.find((x) => x.id === enrollingTeamId);
        return (
          <ActionModal isOpen title={`Enrol ${t?.name ?? 'team'} in course`} description={`${t?.memberIds.length ?? 0} members will be enrolled.`} onClose={() => setEnrollingTeamId(null)}>
            <form onSubmit={handleTeamEnroll} className="grid gap-4">
              {teamEnrollError ? <p className="text-xs text-[color:var(--edu-danger)]">{teamEnrollError}</p> : null}
              <select value={teamEnrollCourseId} onChange={(e) => { setTeamEnrollCourseId(e.target.value); setTeamEnrollError(''); }} className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none">
                <option value="">Select course</option>
                {courses.filter((c) => c.isPublished).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[color:var(--hub-muted)]">Completion deadline (optional)</label>
                <input value={teamEnrollDeadline} onChange={(e) => setTeamEnrollDeadline(e.target.value)} type="date" className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none" />
              </div>
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={teamEnrollMandatory} onChange={(e) => setTeamEnrollMandatory(e.target.checked)} className="accent-[color:var(--hub-primary)]" />
                <span className="text-sm text-[color:var(--hub-text)]">Mark as mandatory</span>
              </label>
              <button type="submit" disabled={isTeamEnrolling} className="rounded-full bg-[color:var(--hub-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60">
                {isTeamEnrolling ? 'Enrolling...' : `Enrol ${t?.memberIds.length ?? 0} member${(t?.memberIds.length ?? 0) !== 1 ? 's' : ''}`}
              </button>
            </form>
          </ActionModal>
        );
      })() : null}

      <ActionModal
        isOpen={!!pendingConfirm}
        title={pendingConfirm?.title ?? ''}
        description={pendingConfirm?.description}
        onClose={() => setPendingConfirm(null)}
      >
        <div className="flex gap-3">
          <button type="button" onClick={() => setPendingConfirm(null)} className="flex-1 rounded-full border border-[color:var(--hub-border)] py-2.5 text-sm font-semibold text-[color:var(--hub-text)]">Cancel</button>
          <button type="button" onClick={() => { void pendingConfirm?.onConfirm(); setPendingConfirm(null); }} className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Confirm</button>
        </div>
      </ActionModal>
    </div>
  );
};
